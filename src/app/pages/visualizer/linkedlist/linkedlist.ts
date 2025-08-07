import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-linkedlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './linkedlist.html',
  styleUrl: './linkedlist.css'
})
export class Linkedlist implements AfterViewInit {
  private draggingNode: Matter.Body | null = null;
  private dragNodeOffset = { x: 0, y: 0 };
  // (Removed duplicate declarations: isDragging, dragStart, panOffset)

  onCanvasMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (this.render.bounds.max.x - this.render.bounds.min.x) / this.canvasWidth + this.render.bounds.min.x;
    const mouseY = (event.clientY - rect.top) * (this.render.bounds.max.y - this.render.bounds.min.y) / this.canvasHeight + this.render.bounds.min.y;
    // Check if mouse is over a node
    for (const body of this.nodeBodies) {
      const dx = mouseX - body.position.x;
      const dy = mouseY - body.position.y;
      if (Math.abs(dx) < 50 && Math.abs(dy) < 20) {
        this.draggingNode = body;
        this.dragNodeOffset = { x: dx, y: dy };
        return;
      }
    }
    // Otherwise, start panning
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  onCanvasMouseUp() {
    this.isDragging = false;
    this.draggingNode = null;
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.draggingNode) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) * (this.render.bounds.max.x - this.render.bounds.min.x) / this.canvasWidth + this.render.bounds.min.x;
      const mouseY = (event.clientY - rect.top) * (this.render.bounds.max.y - this.render.bounds.min.y) / this.canvasHeight + this.render.bounds.min.y;
      Matter.Body.setPosition(this.draggingNode, {
        x: mouseX - this.dragNodeOffset.x,
        y: mouseY - this.dragNodeOffset.y
      });
      // Redraw arrows (if using custom drawing, trigger redraw here)
      this.updateArrows();
      return;
    }
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
  insertAtFront() {
    if (!this.listValue.trim()) return;
    const x = 100;
    const box = Matter.Bodies.rectangle(x, 200, 100, 40, {
      chamfer: { radius: 12 },
      render: {
        fillStyle: '#02D4E3',
        strokeStyle: '#1f6feb',
        lineWidth: 4,
      },
      label: this.listValue
    });
    // Shift all existing nodes right
    this.nodeBodies.forEach((body, idx) => {
      Matter.Body.setPosition(body, { x: body.position.x + 120, y: body.position.y });
    });
    this.nodeBodies.unshift(box);
    Matter.World.add(this.engine.world, box);
    this.lastInserted = this.listValue;
    this.listValue = '';
  }

  insertAtLast() {
    this.insertNode();
  }
  // --- Linked List Operations ---
  insertNode() {
    if (!this.listValue.trim()) return;
    const x = 100 + this.nodeBodies.length * 120;
    const box = Matter.Bodies.rectangle(x, 200, 100, 40, {
      chamfer: { radius: 12 },
      render: {
        fillStyle: '#02D4E3',
        strokeStyle: '#1f6feb',
        lineWidth: 4,
      },
      label: this.listValue
    });
    this.nodeBodies.push(box);
    Matter.World.add(this.engine.world, box);
    this.lastInserted = this.listValue;
    this.listValue = '';
  }

  deleteNode() {
    if (!this.listValue.trim()) return;
    // Find the node with the matching label
    const idx = this.nodeBodies.findIndex(body => body.label === this.listValue);
    if (idx === -1) return;
    const box = this.nodeBodies[idx];
    this.lastDeleted = box.label || null;
    Matter.World.remove(this.engine.world, box);
    this.nodeBodies.splice(idx, 1);
    // Optionally, shift remaining nodes to the left for visual consistency
    for (let i = idx; i < this.nodeBodies.length; i++) {
      Matter.Body.setPosition(this.nodeBodies[i], {
        x: 100 + i * 120,
        y: this.nodeBodies[i].position.y
      });
    }
    this.listValue = '';
  }

  clear() {
    while (this.nodeBodies.length > 0) {
      const box = this.nodeBodies.pop();
      if (box) Matter.World.remove(this.engine.world, box);
    }
  }

  searchNode() {
    if (!this.listValue.trim()) {
      this.ngZone.run(() => {
        this.searchMessage = 'Please enter a value to search.';
        setTimeout(() => { this.searchMessage = ''; }, 1800);
      });
      return;
    }
    this.searching = true;
    this.ngZone.run(() => { this.searchMessage = ''; });
    let found = false;
    const search = async () => {
      for (let i = 0; i < this.nodeBodies.length; i++) {
        this.searchIndex = i;
        this.nodeBodies.forEach((body, idx) => {
          if (idx === i) {
            body.render.fillStyle = '#98F5F9';
          } else {
            body.render.fillStyle = '#02D4E3';
          }
        });
        await new Promise(res => setTimeout(res, 700));
        if (this.nodeBodies[i].label === this.listValue) {
          this.nodeBodies[i].render.fillStyle = '#43ea4a';
          this.ngZone.run(() => {
            this.searchMessage = `Found value "${this.listValue}" at position ${i + 1}`;
            this.searching = false;
            this.searchIndex = -1;
            setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
          });
          found = true;
          break;
        }
      }
      if (!found) {
        this.ngZone.run(() => {
          this.searchMessage = `Value "${this.listValue}" not found in list.`;
          this.searching = false;
          this.searchIndex = -1;
          setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
        });
      }
    };
    search();
  }

  isEmpty(): boolean {
    return this.nodeBodies.length === 0;
  }

  head(): string | null {
    if (this.nodeBodies.length === 0) return 'null';
    return this.nodeBodies[0].label || null;
  }

  tail(): string | null {
    if (this.nodeBodies.length === 0) return 'null';
    return this.nodeBodies[this.nodeBodies.length - 1].label || null;
  }

  size(): number {
    return this.nodeBodies.length;
  }
  listValue: string = '';
  searchMessage: string = '';
  searching: boolean = false;
  searchIndex: number = -1;
  lastInserted: string | null = null;
  lastDeleted: string | null = null;
  @ViewChild('listCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  canvasWidth: number = 1000;
  canvasHeight: number = 400;
  private resizing = false;
  private resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private nodeBodies: Matter.Body[] = [];
  private zoomLevel: number = 1;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private panOffset = { x: 0, y: 0 };
  constructor(private ngZone: NgZone) {}

  // Ensure arrows are redrawn/updated after node drag
  updateArrows() {
    // If using custom canvas drawing for arrows, trigger a redraw here.
    // If using Matter.js constraints, update their endpoints here.
    // (This is a placeholder for your actual arrow update logic.)
    // For example, you might call this.renderArrows() or similar.
  }

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
  // (Removed duplicate drag/pan handlers)
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
  // ... (Linked list logic: insert, delete, search, clear, etc. to be implemented)
  ngAfterViewInit() {
    const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Runner, Events } = Matter;
    this.engine = Engine.create();
    this.render = Render.create({
      canvas: this.canvasRef.nativeElement,
      engine: this.engine,
      options: {
        width: this.canvasWidth,
        height: this.canvasHeight,
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
      for (let i = 0; i < this.nodeBodies.length; i++) {
        const body = this.nodeBodies[i];
        const screenX = (body.position.x - bounds.min.x) * scaleX;
        const screenY = (body.position.y - bounds.min.y) * scaleY;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#1f6feb';
        ctx.lineWidth = 2;
        ctx.strokeText(body.label, screenX, screenY);
        ctx.fillText(body.label, screenX, screenY);
        // Draw smooth arrow to next node
        if (i < this.nodeBodies.length - 1) {
          const nextBody = this.nodeBodies[i + 1];
          const nextScreenX = (nextBody.position.x - bounds.min.x) * scaleX;
          const nextScreenY = (nextBody.position.y - bounds.min.y) * scaleY;
          ctx.strokeStyle = '#ffb300';
          ctx.lineWidth = 3;
          ctx.beginPath();
          // Start at right edge of current node
          ctx.moveTo(screenX + 50, screenY);
          // Use a quadratic curve for smoothness
          const midXArrow = (screenX + 50 + nextScreenX - 50) / 2;
          ctx.quadraticCurveTo(
            midXArrow,
            screenY + (nextScreenY - screenY) * 0.3, // curve up/down based on y-difference
            nextScreenX - 50,
            nextScreenY
          );
          ctx.stroke();
          // Arrowhead
          // Compute the tangent direction at the end of the quadratic curve
          // Quadratic curve: P0 (start), CP (control), P1 (end)
          const startX = screenX + 50;
          const startY = screenY;
          const endX = nextScreenX - 50;
          const endY = nextScreenY;
          const midX = (startX + endX) / 2;
          const controlX = midX;
          const controlY = startY + (endY - startY) * 0.3;
          // Derivative at t=1 for quadratic Bezier: 2*(1-t)*(CP-P0) + 2*t*(P1-CP), t=1 => 2*(P1-CP)
          const dx = endX - controlX;
          const dy = endY - controlY;
          const angle = Math.atan2(dy, dx);
          const arrowLen = 18;
          ctx.beginPath();
          ctx.moveTo(
            endX - arrowLen * Math.cos(angle - Math.PI / 7),
            endY - arrowLen * Math.sin(angle - Math.PI / 7)
          );
          ctx.lineTo(endX, endY);
          ctx.lineTo(
            endX - arrowLen * Math.cos(angle + Math.PI / 7),
            endY - arrowLen * Math.sin(angle + Math.PI / 7)
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    });
    Render.run(this.render);
    Runner.run(this.engine);
  }
}
