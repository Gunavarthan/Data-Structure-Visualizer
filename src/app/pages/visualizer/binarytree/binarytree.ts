import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-binarytree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './binarytree.html',
  styleUrl: './binarytree.css'
})
export class Binarytree implements AfterViewInit {
  // Helper: get left/right child index for array-based binary tree
  private leftChild(idx: number) { return 2 * idx + 1; }
  private rightChild(idx: number) { return 2 * idx + 2; }

  // Helper: compute height of the tree
  height(): number {
    const dfs = (idx: number): number => {
      if (idx >= this.nodeBodies.length) return 0;
      return 1 + Math.max(dfs(this.leftChild(idx)), dfs(this.rightChild(idx)));
    };
    return dfs(0);
  }
  // --- Binary Tree Operations (insert, delete, search, clear, etc.) ---
  // Track empty indices for gap-filling insertions
  private emptyIndices: number[] = [];

  insertNode() {
    if (!this.treeValue.trim()) return;
    // Find the first available empty index, or append at the end
    let idx: number;
    if (this.emptyIndices.length > 0) {
      // Use the lowest available index
      this.emptyIndices.sort((a, b) => a - b);
      idx = this.emptyIndices.shift()!;
    } else {
      idx = this.nodeBodies.length;
    }
    // Calculate binary tree position based on index (breadth-first)
    const level = Math.floor(Math.log2(idx + 1));
    const posInLevel = idx - (2 ** level - 1);
    const nodesInLevel = 2 ** level;
    const xSpacing = this.canvasWidth / (nodesInLevel + 1);
    const x = xSpacing * (posInLevel + 1);
    const y = 80 + level * 100;
    const node = Matter.Bodies.circle(x, y, 30, {
      render: {
        fillStyle: '#02D4E3',
        strokeStyle: '#1f6feb',
        lineWidth: 4,
      },
      label: this.treeValue
    });
    // Insert node at the correct index (fill gap or append)
    if (idx < this.nodeBodies.length) {
      this.nodeBodies[idx] = node;
    } else {
      this.nodeBodies.push(node);
    }
    Matter.World.add(this.engine.world, node);
    // Connect to parent if not root and parent exists
    if (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.nodeBodies[parentIdx];
      if (parent) {
        this.edges.push({ from: parent, to: node });
      }
    }
    this.lastInserted = this.treeValue;
    this.treeValue = '';
  }

  deleteNode() {
    if (!this.treeValue.trim()) return;
    const idx = this.nodeBodies.findIndex(body => body.label === this.treeValue);
    if (idx === -1) return;
    // Recursively delete subtree rooted at idx
    const collectIndices = (i: number, arr: number[]) => {
      if (i >= this.nodeBodies.length || !this.nodeBodies[i]) return;
      arr.push(i);
      const l = this.leftChild(i);
      const r = this.rightChild(i);
      if (l < this.nodeBodies.length) collectIndices(l, arr);
      if (r < this.nodeBodies.length) collectIndices(r, arr);
    };
    const indicesToDelete: number[] = [];
    collectIndices(idx, indicesToDelete);
    this.lastDeleted = this.nodeBodies[idx]?.label || null;
    const nodesToDelete = indicesToDelete.map(i => this.nodeBodies[i]);
    indicesToDelete.forEach(i => {
      const node = this.nodeBodies[i];
      if (node) {
        Matter.World.remove(this.engine.world, node);
        this.nodeBodies[i] = undefined as any; // Mark as empty
        if (!this.emptyIndices.includes(i)) this.emptyIndices.push(i);
      }
    });
    // Remove edges connected to any deleted node
    this.edges = this.edges.filter(e =>
      !nodesToDelete.includes(e.from) && !nodesToDelete.includes(e.to)
    );
    this.treeValue = '';
  }

  searchNode() {
    if (!this.treeValue.trim()) {
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
      // Level order (BFS) search
      const queue: number[] = [];
      const visited: boolean[] = Array(this.nodeBodies.length).fill(false);
      // Reset all node colors to default before search
      this.nodeBodies.forEach(body => {
        body.render.fillStyle = '#02D4E3';
      });
      if (this.nodeBodies.length > 0) queue.push(0);
      while (queue.length > 0) {
        const idx = queue.shift()!;
        this.searchIndex = idx;
        // Set all nodes to blue except the current one (yellow)
        this.nodeBodies.forEach((body, i) => {
          if (body.render.fillStyle !== '#43ea4a') {
            body.render.fillStyle = (i === idx) ? '#ffb300' : '#02D4E3';
          }
        });
        await new Promise(res => setTimeout(res, 700));
        if (this.nodeBodies[idx].label === this.treeValue) {
          this.nodeBodies[idx].render.fillStyle = '#43ea4a';
          this.ngZone.run(() => {
            this.searchMessage = `Found value \"${this.treeValue}\" at node ${idx + 1}`;
            this.searching = false;
            this.searchIndex = -1;
            setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
          });
          found = true;
          // Keep found node green, others blue
          this.nodeBodies.forEach((body, i) => {
            if (i !== idx && body.render.fillStyle !== '#43ea4a') {
              body.render.fillStyle = '#02D4E3';
            }
          });
          break;
        }
        visited[idx] = true;
        const l = this.leftChild(idx);
        const r = this.rightChild(idx);
        if (l < this.nodeBodies.length && !visited[l]) queue.push(l);
        if (r < this.nodeBodies.length && !visited[r]) queue.push(r);
      }
      if (!found) {
        // Reset all nodes to blue if not found
        this.nodeBodies.forEach(body => {
          body.render.fillStyle = '#02D4E3';
        });
        this.ngZone.run(() => {
          this.searchMessage = `Value \"${this.treeValue}\" not found in tree.`;
          this.searching = false;
          this.searchIndex = -1;
          setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
        });
      }
    };
    search();
  }

  clear() {
    while (this.nodeBodies.length > 0) {
      const node = this.nodeBodies.pop();
      if (node) Matter.World.remove(this.engine.world, node);
    }
    this.edges = [];
    this.emptyIndices = [];
  }

  root(): string | null {
    if (this.nodeBodies.length === 0) return 'null';
    return this.nodeBodies[0].label || null;
  }

  size(): number {
    return this.nodeBodies.length;
  }
  @ViewChild('treeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  canvasWidth: number = 1000;
  canvasHeight: number = 500;
  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private nodeBodies: Matter.Body[] = [];
  private edges: { from: Matter.Body, to: Matter.Body }[] = [];
  private zoomLevel: number = 1;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private panOffset = { x: 0, y: 0 };
  private draggingNode: Matter.Body | null = null;
  private dragNodeOffset = { x: 0, y: 0 };
  private resizing = false;
  private resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  treeValue: string = '';
  searchMessage: string = '';
  searching: boolean = false;
  searchIndex: number = -1;
  lastInserted: string | null = null;
  lastDeleted: string | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    const { Engine, Render, World, Mouse, MouseConstraint, Runner, Events } = Matter;
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
      // Draw edges
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 3;
      for (const edge of this.edges) {
        const fromX = (edge.from.position.x - bounds.min.x) * scaleX;
        const fromY = (edge.from.position.y - bounds.min.y) * scaleY;
        const toX = (edge.to.position.x - bounds.min.x) * scaleX;
        const toY = (edge.to.position.y - bounds.min.y) * scaleY;
        // Draw a smooth quadratic curve from parent to child
        ctx.beginPath();
        ctx.moveTo(fromX, fromY + 30);
        // Control point: horizontally halfway, vertically 40% down from parent to child
        const ctrlX = (fromX + toX) / 2;
        const ctrlY = fromY + 30 + (toY - fromY - 60) * 0.4;
        ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY - 30);
        ctx.stroke();
        // Arrowhead: compute tangent at end of quadratic curve
        // Derivative at t=1: 2*(P1-CP)
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

  // --- Binary Tree Operations (insert, delete, search, clear, etc.) ---
  // You can implement these as needed, similar to the linked list logic.

  updateEdges() {
    // If you want to update edge positions after dragging, you can trigger a redraw here.
    // For now, edges are always drawn based on node positions in afterRender.
  }
}
