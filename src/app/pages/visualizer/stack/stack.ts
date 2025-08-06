import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
      ctx.font = `${14}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const body of this.stackBodies) {
        // Convert world position to screen position
        const screenX = (body.position.x - bounds.min.x) * scaleX;
        const screenY = (body.position.y - bounds.min.y) * scaleY;
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
        render: { fillStyle: isTop ? '#7ee787' : '#2196f3' },
        label: this.pushValue
      });
      this.stackBodies.push(box);
      Matter.World.add(this.engine.world, box);
      this.animatePush(box);
      this.updateTopHighlight();
    }
    this.pushValue = '';
  }

  // Duplicate pop removed

  updateTopHighlight() {
    if (this.stackBodies.length > 0) {
      this.stackBodies.forEach((body, idx) => {
        body.render.fillStyle = idx === this.stackBodies.length - 1 ? '#7ee787' : '#2196f3';
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
