import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface HeapNode {
  value: string;
  index: number;
  body: Matter.Body;
}

@Component({
  selector: 'app-maxheap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maxheap.html',
  styleUrl: './maxheap.css'
})
export class Maxheap implements AfterViewInit {
  // Traversal methods for UI
  get preorder(): string {
    const res: string[] = [];
    const dfs = (i: number) => {
      if (i >= this.heap.length) return;
      res.push(this.heap[i].value);
      dfs(2 * i + 1);
      dfs(2 * i + 2);
    };
    dfs(0);
    return res.join(', ');
  }
  get inorder(): string {
    const res: string[] = [];
    const dfs = (i: number) => {
      if (i >= this.heap.length) return;
      dfs(2 * i + 1);
      res.push(this.heap[i].value);
      dfs(2 * i + 2);
    };
    dfs(0);
    return res.join(', ');
  }
  get postorder(): string {
    const res: string[] = [];
    const dfs = (i: number) => {
      if (i >= this.heap.length) return;
      dfs(2 * i + 1);
      dfs(2 * i + 2);
      res.push(this.heap[i].value);
    };
    dfs(0);
    return res.join(', ');
  }
  get levelorder(): string {
    return this.heap.map(n => n.value).join(', ');
  }
  get heapValues(): string {
    return this.heap.map(n => n.value).join(', ');
  }
  @ViewChild('heapCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  canvasWidth: number = 1000;
  canvasHeight: number = 500;
  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private edges: { from: Matter.Body, to: Matter.Body }[] = [];
  private zoomLevel: number = 1;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private panOffset = { x: 0, y: 0 };
  private draggingNode: Matter.Body | null = null;
  private dragNodeOffset = { x: 0, y: 0 };
  private resizing = false;
  private resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  heapValue: string = '';
  searchMessage: string = '';
  searching: boolean = false;
  lastInserted: string | null = null;
  lastDeleted: string | null = null;
  heap: HeapNode[] = [];
  private nodeBodies: Matter.Body[] = [];

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    const { Engine, Render, World, Mouse, MouseConstraint, Runner } = Matter;
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
    Matter.Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      const { bounds, canvas } = this.render;
      const scaleX = canvas.width / (bounds.max.x - bounds.min.x);
      const scaleY = canvas.height / (bounds.max.y - bounds.min.y);
      ctx.save();
      ctx.font = `bold 20px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Draw edges
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 3;
      for (const edge of this.edges) {
        const fromX = (edge.from.position.x - bounds.min.x) * scaleX;
        const fromY = (edge.from.position.y - bounds.min.y) * scaleY;
        const toX = (edge.to.position.x - bounds.min.x) * scaleX;
        const toY = (edge.to.position.y - bounds.min.y) * scaleY;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY + 30);
        const ctrlX = (fromX + toX) / 2;
        const ctrlY = fromY + 30 + (toY - fromY - 60) * 0.4;
        ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY - 30);
        ctx.stroke();
        // Arrowhead
        const dx = toX - ctrlX;
        const dy = (toY - 30) - ctrlY;
        const angle = Math.atan2(dy, dx);
        const arrowLen = 18;
        const arrowX = toX;
        const arrowY = toY - 30;
        ctx.beginPath();
        ctx.moveTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 7),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 7),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 7)
        );
        ctx.stroke();
      }
      // Draw nodes
      for (const body of this.nodeBodies) {
        if (!body) continue;
        const screenX = (body.position.x - bounds.min.x) * scaleX;
        const screenY = (body.position.y - bounds.min.y) * scaleY;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = body.render.fillStyle || '#02D4E3';
        ctx.fill();
        ctx.strokeStyle = '#1f6feb';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold 20px Arial`;
        ctx.fillText(body.label, screenX, screenY);
      }
      ctx.restore();
    });
    Render.run(this.render);
    Runner.run(this.engine);
  }

  // --- Heap Operations ---
  async insertNode() {
    if (!this.heapValue.trim()) return;
    const value = this.heapValue.trim();
    if (this.heap.find(n => n.value === value)) return; // No duplicates
    const index = this.heap.length;
    const pos = this.getNodePosition(index);
    const node = Matter.Bodies.circle(pos.x, pos.y, 30, {
      render: {
        fillStyle: '#02D4E3',
        strokeStyle: '#1f6feb',
        lineWidth: 4,
      },
      label: value
    });
    const heapNode: HeapNode = { value, index, body: node };
    this.heap.push(heapNode);
    this.nodeBodies.push(node);
    Matter.World.add(this.engine.world, node);
    await this.heapifyUp(index);
    this.updateEdges();
    this.lastInserted = value;
    this.heapValue = '';
  }

  async deleteNode() {
    if (!this.heapValue.trim()) return;
    const value = this.heapValue.trim();
    const idx = this.heap.findIndex(n => n.value === value);
    if (idx === -1) return;
    await this.removeNode(idx);
    this.lastDeleted = value;
    this.heapValue = '';
    this.updateEdges();
  }

  private async removeNode(idx: number) {
    Matter.World.remove(this.engine.world, this.heap[idx].body);
    this.nodeBodies = this.nodeBodies.filter(b => b !== this.heap[idx].body);
    this.heap.splice(idx, 1);
    // Re-index and re-heapify
    for (let i = 0; i < this.heap.length; i++) {
      this.heap[i].index = i;
    }
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      await this.heapifyDown(i);
    }
    this.updateNodePositions();
  }

  private async heapifyUp(idx: number) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (Number(this.heap[parentIdx].value) < Number(this.heap[idx].value)) {
        await this.swap(idx, parentIdx);
        idx = parentIdx;
      } else {
        break;
      }
    }
    this.updateNodePositions();
  }

  private async heapifyDown(idx: number) {
    const n = this.heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && Number(this.heap[left].value) > Number(this.heap[largest].value)) largest = left;
      if (right < n && Number(this.heap[right].value) > Number(this.heap[largest].value)) largest = right;
      if (largest !== idx) {
        await this.swap(idx, largest);
        idx = largest;
      } else {
        break;
      }
    }
    this.updateNodePositions();
  }

  private async swap(i: number, j: number) {
    // Animate swap
    this.heap[i].body.render.fillStyle = '#ffb300';
    this.heap[j].body.render.fillStyle = '#ffb300';
    await new Promise(res => setTimeout(res, 350));
    // Swap positions visually
    const posI = this.getNodePosition(i);
    const posJ = this.getNodePosition(j);
    Matter.Body.setPosition(this.heap[i].body, posJ);
    Matter.Body.setPosition(this.heap[j].body, posI);
    await new Promise(res => setTimeout(res, 350));
    // Reset color
    this.heap[i].body.render.fillStyle = '#02D4E3';
    this.heap[j].body.render.fillStyle = '#02D4E3';
    // Swap data
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    [this.heap[i].index, this.heap[j].index] = [i, j];
  }
  // Search operation with animation
  async searchNode() {
    if (!this.heapValue.trim()) {
      this.ngZone.run(() => {
        this.searchMessage = 'Please enter a value to search.';
        setTimeout(() => { this.searchMessage = ''; }, 1800);
      });
      return;
    }
    this.searching = true;
    this.ngZone.run(() => { this.searchMessage = ''; });
    const value = this.heapValue.trim();
    // Reset all node colors
    this.heap.forEach(n => n.body.render.fillStyle = '#02D4E3');
    let found = false;
    for (let i = 0; i < this.heap.length; i++) {
      this.heap[i].body.render.fillStyle = '#ffb300';
      await new Promise(res => setTimeout(res, 500));
      if (this.heap[i].value === value) {
        this.heap[i].body.render.fillStyle = '#43ea4a';
        this.ngZone.run(() => {
          this.searchMessage = `Found value "${value}"`;
          this.searching = false;
          setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
        });
        found = true;
        break;
      } else {
        this.heap[i].body.render.fillStyle = '#02D4E3';
      }
    }
    if (!found) {
      this.ngZone.run(() => {
        this.searchMessage = `Value "${value}" not found in heap.`;
        this.searching = false;
        setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
      });
    }
  }

  private getNodePosition(index: number): { x: number, y: number } {
    if (index === 0) return { x: this.canvasWidth / 2, y: 80 };
    const level = Math.floor(Math.log2(index + 1));
    const posInLevel = index - (2 ** level - 1);
    const nodesInLevel = 2 ** level;
    const spacing = this.canvasWidth / (nodesInLevel + 1);
    return {
      x: spacing * (posInLevel + 1),
      y: 80 + level * 100
    };
  }

  private updateNodePositions() {
    for (let i = 0; i < this.heap.length; i++) {
      const pos = this.getNodePosition(i);
      Matter.Body.setPosition(this.heap[i].body, pos);
    }
    this.updateEdges();
  }

  updateEdges() {
    this.edges = [];
    for (let i = 0; i < this.heap.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < this.heap.length) {
        this.edges.push({ from: this.heap[i].body, to: this.heap[left].body });
      }
      if (right < this.heap.length) {
        this.edges.push({ from: this.heap[i].body, to: this.heap[right].body });
      }
    }
  }

  clear() {
    while (this.nodeBodies.length > 0) {
      const node = this.nodeBodies.pop();
      if (node) Matter.World.remove(this.engine.world, node);
    }
    this.edges = [];
    this.heap = [];
  }

  // --- Canvas Interactions (zoom, pan, drag, resize) ---
  onCanvasMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (this.render.bounds.max.x - this.render.bounds.min.x) / this.canvasWidth + this.render.bounds.min.x;
    const mouseY = (event.clientY - rect.top) * (this.render.bounds.max.y - this.render.bounds.min.y) / this.canvasHeight + this.render.bounds.min.y;
    for (const body of this.nodeBodies) {
      const dx = mouseX - body.position.x;
      const dy = mouseY - body.position.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        this.draggingNode = body;
        this.dragNodeOffset = { x: dx, y: dy };
        return;
      }
    }
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
      this.updateEdges();
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
    this.render.bounds.min.x = 500 - 500 / this.zoomLevel;
    this.render.bounds.max.x = 500 + 500 / this.zoomLevel;
    this.render.bounds.min.y = 250 - 250 / this.zoomLevel;
    this.render.bounds.max.y = 250 + 250 / this.zoomLevel;
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
}
