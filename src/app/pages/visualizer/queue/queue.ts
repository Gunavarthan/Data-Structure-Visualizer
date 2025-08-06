import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './queue.html',
  styleUrl: './queue.css'
})
export class Queue implements AfterViewInit {
  canvasWidth: number = 800;
  canvasHeight: number = 400;
  private resizing = false;
  private resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  onResizeMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.resizing = true;
    this.resizeStart = {
      x: event.clientX,
      y: event.clientY,
      width: this.canvasWidth,
      height: this.canvasHeight
    };
    window.addEventListener('mousemove', this.onResizeMouseMove);
    window.addEventListener('mouseup', this.onResizeMouseUp);
  }

  onResizeMouseMove = (event: MouseEvent) => {
    if (!this.resizing) return;
    const dx = event.clientX - this.resizeStart.x;
    const dy = event.clientY - this.resizeStart.y;
    this.canvasWidth = Math.max(400, this.resizeStart.width + dx);
    this.canvasHeight = Math.max(200, this.resizeStart.height + dy);
    if (this.render) {
      this.render.canvas.width = this.canvasWidth;
      this.render.canvas.height = this.canvasHeight;
      this.render.options.width = this.canvasWidth;
      this.render.options.height = this.canvasHeight;
      this.applyZoom();
    }
  };

  onResizeMouseUp = () => {
    this.resizing = false;
    window.removeEventListener('mousemove', this.onResizeMouseMove);
    window.removeEventListener('mouseup', this.onResizeMouseUp);
  };
  // Drag and pan support
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private panOffset = { x: 0, y: 0 };

  onCanvasMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  onCanvasMouseUp() {
    this.isDragging = false;
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.render.bounds.min.x -= dx / this.zoomLevel;
      this.render.bounds.max.x -= dx / this.zoomLevel;
      this.render.bounds.min.y -= dy / this.zoomLevel;
      this.render.bounds.max.y -= dy / this.zoomLevel;
      this.dragStart = { x: event.clientX, y: event.clientY };
    }
  }
  queueValue: string = '';
  searchMessage: string = '';
  searching: boolean = false;
  searchIndex: number = -1;
  lastEnqueued: string | null = null;
  lastDequeued: string | null = null;
  @ViewChild('queueCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private queueBodies: Matter.Body[] = [];
  private zoomLevel: number = 1;
  constructor(private ngZone: NgZone) {}

  async searchQueue() {
    if (!this.queueValue.trim()) {
      this.ngZone.run(() => {
        this.searchMessage = 'Please enter a value to search.';
        setTimeout(() => { this.searchMessage = ''; }, 1800);
      });
      return;
    }
    this.searching = true;
    this.ngZone.run(() => { this.searchMessage = ''; });
    for (let i = 0; i < this.queueBodies.length; i++) {
      this.searchIndex = i;
      this.updateFrontHighlight();
      this.queueBodies.forEach((body, idx) => {
        if (idx === i) {
          body.render.fillStyle = '#98F5F9';
          body.render.strokeStyle = '#1f6feb';
        } else if (idx === 0) {
          body.render.fillStyle = '#CC6CE7';
          body.render.strokeStyle = '#1f6feb';
        } else {
          body.render.fillStyle = '#2196f3';
          body.render.strokeStyle = '#1f6feb';
        }
      });
      await new Promise(res => setTimeout(res, 700));
      if (this.queueBodies[i].label === this.queueValue) {
        this.queueBodies[i].render.fillStyle = '#43ea4a';
        this.queueBodies[i].render.strokeStyle = 'transparent';
        this.ngZone.run(() => {
          this.searchMessage = `Found value "${this.queueValue}" at position ${i + 1}`;
          this.searching = false;
          this.searchIndex = -1;
          this.updateFrontHighlight();
          setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
        });
        return;
      }
    }
    this.ngZone.run(() => {
      this.searchMessage = `Value "${this.queueValue}" not found in queue.`;
      this.searching = false;
      this.searchIndex = -1;
      this.updateFrontHighlight();
      setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
    });
  }

  enqueue() {
    if (this.queueValue.trim() !== '') {
      const x = 100 + this.queueBodies.length * 110;
      const box = Matter.Bodies.rectangle(x, 200, 100, 30, {
        chamfer: { radius: 12 },
        render: {
          fillStyle: this.queueBodies.length === 0 ? '#02D4E3' : '#02D4E3',
          strokeStyle: '#1f6feb',
          lineWidth: 4,
        },
        label: this.queueValue
      });
      this.queueBodies.push(box);
      Matter.World.add(this.engine.world, box);
      this.lastEnqueued = this.queueValue;
      this.animateEnqueue(box);
      this.updateFrontHighlight();
    }
    this.queueValue = '';
  }

  dequeue() {
    if (this.queueBodies.length > 0) {
      const box = this.queueBodies.shift()!;
      this.lastDequeued = box.label || null;
      this.animateDequeue(box, () => {
        Matter.World.remove(this.engine.world, box);
        // Animate remaining nodes left to fill gap
        let shiftFrames = 15;
        let shiftFrame = 0;
        const startPositions = this.queueBodies.map((body, idx) => body.position.x);
        const targetPositions = this.queueBodies.map((body, idx) => 100 + idx * 110);
        const animateShift = () => {
          if (shiftFrame < shiftFrames) {
            this.queueBodies.forEach((body, idx) => {
              const newX = startPositions[idx] + (targetPositions[idx] - startPositions[idx]) * (shiftFrame + 1) / shiftFrames;
              Matter.Body.setPosition(body, { x: newX, y: body.position.y });
            });
            shiftFrame++;
            requestAnimationFrame(animateShift);
          } else {
            this.queueBodies.forEach((body, idx) => {
              Matter.Body.setPosition(body, { x: targetPositions[idx], y: body.position.y });
            });
            setTimeout(() => this.updateFrontHighlight(), 0);
          }
        };
        animateShift();
      });
    }
  }

  clear() {
    while (this.queueBodies.length > 0) {
      const box = this.queueBodies.pop();
      if (box) Matter.World.remove(this.engine.world, box);
    }
    this.updateFrontHighlight();
  }

  isEmpty(): boolean {
    return this.queueBodies.length === 0;
  }

  front(): string | null {
    if (this.queueBodies.length === 0) return "null";
    return this.queueBodies[0].label || null;
  }

  size(): number {
    return this.queueBodies.length;
  }

  updateFrontHighlight() {
    if (this.queueBodies.length > 0) {
      this.queueBodies.forEach((body, idx) => {
        body.render.fillStyle = idx === 0 ? '#CC6CE7' : '#2196f3';
        body.render.strokeStyle = '#1f6feb';
        body.render.lineWidth = 4;
      });
    }
  }

  animateEnqueue(box: Matter.Body) {
    let frame = 0;
    const startX = box.position.x - 60;
    Matter.Body.setPosition(box, { x: startX, y: box.position.y });
    const animate = () => {
      if (frame < 15) {
        Matter.Body.setPosition(box, { x: startX + (frame * 4), y: box.position.y });
        frame++;
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  animateDequeue(box: Matter.Body, onDone: () => void) {
    let frame = 0;
    const startX = box.position.x;
    const animate = () => {
      if (frame < 15) {
        // Move dequeued node right and fade out
        Matter.Body.setPosition(box, { x: startX + (frame * 8), y: box.position.y });
        box.render.opacity = 1 - frame / 15;
        frame++;
        requestAnimationFrame(animate);
      } else {
        box.render.opacity = 0;
        onDone();
        setTimeout(() => this.updateFrontHighlight(), 0);
      }
    };
    animate();
  }

  ngAfterViewInit() {
    const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Runner, Events } = Matter;
    this.engine = Engine.create();
    this.render = Render.create({
      canvas: this.canvasRef.nativeElement,
      engine: this.engine,
      options: {
        width: 800,
        height: 400,
        wireframes: false,
        background: '#23233a',
      }
    });
    const mouse = Mouse.create(this.render.canvas);
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    World.add(this.engine.world, mouseConstraint);
    this.render.mouse = mouse;
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      const { bounds, canvas } = this.render;
      const scaleX = canvas.width / (bounds.max.x - bounds.min.x);
      const scaleY = canvas.height / (bounds.max.y - bounds.min.y);
      ctx.save();
      ctx.font = `bold 20px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const body of this.queueBodies) {
        const screenX = (body.position.x - bounds.min.x) * scaleX;
        const screenY = (body.position.y - bounds.min.y) * scaleY;
        ctx.fillStyle = body.render.fillStyle === '#ffb300' ? '#23233a' : body.render.fillStyle === '#43ea4a' ? '#23233a' : '#fff';
        if (body.render.strokeStyle !== 'transparent') {
          ctx.strokeStyle = body.render.strokeStyle || '#1f6feb';
          ctx.lineWidth = 2;
          ctx.strokeText(body.label, screenX, screenY);
        }
        ctx.fillText(body.label, screenX, screenY);
      }
      ctx.restore();
    });
    Render.run(this.render);
    Runner.run(this.engine);
  }
  
  onWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
    } else {
      this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
    }
    this.applyZoom();
    event.preventDefault();
  }

  private applyZoom() {
    this.render.options.hasBounds = true;
    this.render.bounds.min.x = 400 - 400 / this.zoomLevel;
    this.render.bounds.max.x = 400 + 400 / this.zoomLevel;
    this.render.bounds.min.y = 200 - 200 / this.zoomLevel;
    this.render.bounds.max.y = 200 + 200 / this.zoomLevel;
  }
}
