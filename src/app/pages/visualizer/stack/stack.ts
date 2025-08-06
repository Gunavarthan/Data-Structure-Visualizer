import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-stack',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stack.html',
  styleUrl: './stack.css'
})
export class Stack implements AfterViewInit {
  // Use pushValue for both push and search
  searchMessage: string = '';
  searching: boolean = false;
  searchIndex: number = -1;

  constructor(private ngZone: NgZone) {}

  async searchStack() {
    if (!this.pushValue.trim()) {
      this.ngZone.run(() => {
        this.searchMessage = 'Please enter a value to search.';
        setTimeout(() => { this.searchMessage = ''; }, 1800);
      });
      return;
    }
    this.searching = true;
    this.ngZone.run(() => { this.searchMessage = ''; });
    for (let i = this.stackBodies.length - 1; i >= 0; i--) {
      this.searchIndex = i;
      this.updateTopHighlight();
      // Highlight current node being searched
      this.stackBodies.forEach((body, idx) => {
        if (idx === i) {
          body.render.fillStyle = '#98F5F9';
        } else if (idx === this.stackBodies.length - 1) {
          body.render.fillStyle = '#CC6CE7';
        } else {
          body.render.fillStyle = '#2196f3';
        }
      });
      await new Promise(res => setTimeout(res, 700));
      if (this.stackBodies[i].label === this.pushValue) {
        // Set found node to green and remove text stroke
        this.stackBodies[i].render.fillStyle = '#43ea4a';
        this.stackBodies[i].render.strokeStyle = 'transparent';
        this.ngZone.run(() => {
          this.searchMessage = `Found value "${this.pushValue}" at position ${this.stackBodies.length - i}`;
          this.searching = false;
          this.searchIndex = -1;
          console.log(this.searchMessage);
          this.updateTopHighlight();
          setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
        });
        return;
      }
    }
    this.ngZone.run(() => {
      this.searchMessage = `Value "${this.pushValue}" not found in stack.`;
      this.searching = false;
      this.searchIndex = -1;
      this.updateTopHighlight();
      setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
    });
  }
  lastPushed: string | null = null;
  lastPoped: string | null = null;
  // Stack utility functions
  isEmpty(): boolean {
    return this.stackBodies.length === 0;
  }

  top(): string | null {
    if (this.stackBodies.length === 0) return "null";
    return this.stackBodies[this.stackBodies.length - 1].label || null;
  }

  size(): number {
    return this.stackBodies.length;
  }

  clear(): void {
    while (this.stackBodies.length > 0) {
      const box = this.stackBodies.pop();
      if (box) Matter.World.remove(this.engine.world, box);
    }
    this.updateTopHighlight();
  }
  @ViewChild('stackCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private stackBodies: Matter.Body[] = [];
  private zoomLevel: number = 1;

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
        background: '#23233a', // dark theme background
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

    // ⬇️ Render the label inside each rectangle
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      const { bounds, canvas } = this.render;
      const scaleX = canvas.width / (bounds.max.x - bounds.min.x);
      const scaleY = canvas.height / (bounds.max.y - bounds.min.y);
      ctx.save();
      ctx.font = `bold 20px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const body of this.stackBodies) {
        // Convert world position to screen position
        const screenX = (body.position.x - bounds.min.x) * scaleX;
        const screenY = (body.position.y - bounds.min.y) * scaleY;
        // Set text color based on node color for contrast
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


  pushValue: string = '';
  animating: boolean = false;

  confirmPush() {
    if (this.pushValue.trim() !== '') {
      const y = 350 - this.stackBodies.length * 40;
      const isTop = this.stackBodies.length === 0;
      const box = Matter.Bodies.rectangle(400, y, 100, 30, {
        chamfer: { radius: 12 }, // rounder corners
        render: {
          fillStyle: isTop ? '#02D4E3' : '#02D4E3', // always #02D4E3 for top
          strokeStyle: '#1f6feb', // keep border same for all
          lineWidth: 4,
        },
        label: this.pushValue
      });
      this.stackBodies.push(box);
      Matter.World.add(this.engine.world, box);
      this.lastPushed = this.pushValue;
      this.animatePush(box);
      this.updateTopHighlight();
    }
    this.pushValue = '';
  }

  // Duplicate pop removed

  updateTopHighlight() {
    if (this.stackBodies.length > 0) {
      this.stackBodies.forEach((body, idx) => {
        body.render.fillStyle = idx === this.stackBodies.length - 1 ? '#CC6CE7' : '#2196f3';
        body.render.strokeStyle = '#1f6feb';
        body.render.lineWidth = 4;
      });
    }
  }


  animatePush(box: Matter.Body) {
    this.animating = true;
    let frame = 0;
    const startY = box.position.y + 60;
    Matter.Body.setPosition(box, { x: box.position.x, y: startY });
    const animate = () => {
      if (frame < 15) {
        Matter.Body.setPosition(box, { x: box.position.x, y: startY - (frame * 4) });
        frame++;
        requestAnimationFrame(animate);
      } else {
        this.animating = false;
      }
    };
    animate();
  }

  animatePop(box: Matter.Body, onDone: () => void) {
    this.animating = true;
    let frame = 0;
    const startY = box.position.y;
    const animate = () => {
      if (frame < 15) {
        Matter.Body.setPosition(box, { x: box.position.x, y: startY - (frame * 4) });
        frame++;
        requestAnimationFrame(animate);
      } else {
        this.animating = false;
        onDone();
        // Ensure highlight updates after pop animation
        setTimeout(() => this.updateTopHighlight(), 0);
      }
    };
    animate();
  }

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

  pop() {
    if (this.stackBodies.length > 0) {
      const box = this.stackBodies.pop()!;
      this.lastPoped = box.label || null;
      this.animatePop(box, () => {
        Matter.World.remove(this.engine.world, box);
        setTimeout(() => this.updateTopHighlight(), 0);
      });
    }
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
