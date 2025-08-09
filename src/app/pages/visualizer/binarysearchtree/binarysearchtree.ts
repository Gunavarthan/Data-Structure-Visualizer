
import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
  body: Matter.Body;
  parent: BSTNode | null;
}

@Component({
  selector: 'app-binarysearchtree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './binarysearchtree.html',
  styleUrl: './binarysearchtree.css'
})
export class Binarysearchtree implements AfterViewInit {
  @ViewChild('treeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
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
  treeValue: string = '';
  searchMessage: string = '';
  searching: boolean = false;
  searchIndex: number = -1;
  lastInserted: string | null = null;
  lastDeleted: string | null = null;
  private rootNode: BSTNode | null = null;
  private nodeBodies: Matter.Body[] = [];
  private bstNodes: BSTNode[] = [];

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

  // --- BST Operations ---
  insertNode() {
    if (!this.treeValue.trim()) return;
    const value = Number(this.treeValue.trim());
    if (isNaN(value)) return;
    if (this.findNode(value)) return; // No duplicates
    const pos = this.getInsertPosition(value);
    const node = Matter.Bodies.circle(pos.x, pos.y, 30, {
      render: {
        fillStyle: '#02D4E3',
        strokeStyle: '#1f6feb',
        lineWidth: 4,
      },
      label: String(value)
    });
    const bstNode: BSTNode = { value, left: null, right: null, body: node, parent: null };
    if (!this.rootNode) {
      this.rootNode = bstNode;
    } else {
      this.insertBST(this.rootNode, bstNode);
    }
    this.bstNodes.push(bstNode);
    this.nodeBodies.push(node);
    Matter.World.add(this.engine.world, node);
    this.updateEdges();
    this.lastInserted = String(value);
    this.treeValue = '';
  }

  private insertBST(root: BSTNode, node: BSTNode) {
    if (node.value < root.value) {
      if (root.left) {
        this.insertBST(root.left, node);
      } else {
        root.left = node;
        node.parent = root;
      }
    } else {
      if (root.right) {
        this.insertBST(root.right, node);
      } else {
        root.right = node;
        node.parent = root;
      }
    }
  }

  private getInsertPosition(value: number): { x: number, y: number } {
    // Traverse BST to find position for new node
    if (!this.rootNode) return { x: this.canvasWidth / 2, y: 80 };
    let curr = this.rootNode;
    let x = this.canvasWidth / 2;
    let y = 80;
    let dx = 220;
    while (true) {
      if (value < curr.value) {
        dx /= 1.7;
        y += 100;
        x -= dx;
        if (!curr.left) break;
        curr = curr.left;
      } else {
        dx /= 1.7;
        y += 100;
        x += dx;
        if (!curr.right) break;
        curr = curr.right;
      }
    }
    return { x, y };
  }

  deleteNode() {
    if (!this.treeValue.trim()) return;
    const value = Number(this.treeValue.trim());
    if (isNaN(value)) return;
    const node = this.findNode(value);
    if (!node) return;
    this.removeBSTNode(node);
    this.lastDeleted = String(value);
    this.treeValue = '';
    this.updateEdges();
  }

  private removeBSTNode(node: BSTNode) {
    // Remove from Matter.js world
    Matter.World.remove(this.engine.world, node.body);
    this.nodeBodies = this.nodeBodies.filter(b => b !== node.body);
    this.bstNodes = this.bstNodes.filter(n => n !== node);
    // Remove from BST
    if (!node.parent) {
      // Root node
      if (!node.left && !node.right) {
        this.rootNode = null;
      } else if (node.left && !node.right) {
        this.rootNode = node.left;
        this.rootNode.parent = null;
      } else if (!node.left && node.right) {
        this.rootNode = node.right;
        this.rootNode.parent = null;
      } else {
        // Two children: find inorder successor
        if (node.right) {
          const succ = this.minNode(node.right);
          if (succ) {
            node.value = succ.value;
            node.body.label = String(succ.value);
            this.removeBSTNode(succ);
          }
        }
      }
    } else {
      // Not root
      const parent = node.parent;
      if (parent.left === node) {
        if (!node.left && !node.right) {
          parent.left = null;
        } else if (node.left && !node.right) {
          parent.left = node.left;
          node.left.parent = parent;
        } else if (!node.left && node.right) {
          parent.left = node.right;
          node.right.parent = parent;
        } else {
          if (node.right) {
            const succ = this.minNode(node.right);
            if (succ) {
              node.value = succ.value;
              node.body.label = String(succ.value);
              this.removeBSTNode(succ);
            }
          }
        }
      } else if (parent.right === node) {
        if (!node.left && !node.right) {
          parent.right = null;
        } else if (node.left && !node.right) {
          parent.right = node.left;
          node.left.parent = parent;
        } else if (!node.left && node.right) {
          parent.right = node.right;
          node.right.parent = parent;
        } else {
          if (node.right) {
            const succ = this.minNode(node.right);
            if (succ) {
              node.value = succ.value;
              node.body.label = String(succ.value);
              this.removeBSTNode(succ);
            }
          }
        }
      }
    }
  }

  private minNode(node: BSTNode): BSTNode | null {
    let curr = node;
    while (curr.left) curr = curr.left;
    return curr;
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
    const value = Number(this.treeValue.trim());
    if (isNaN(value)) return;
    let curr = this.rootNode;
    const path: BSTNode[] = [];
    // Reset all node colors
    this.bstNodes.forEach(n => n.body.render.fillStyle = '#02D4E3');
    const search = async () => {
      while (curr) {
        path.push(curr);
        this.bstNodes.forEach(n => {
          if (n.body.render.fillStyle !== '#43ea4a') {
            n.body.render.fillStyle = path.includes(n) ? '#ffb300' : '#02D4E3';
          }
        });
        await new Promise(res => setTimeout(res, 700));
        if (curr.value === value) {
          curr.body.render.fillStyle = '#43ea4a';
          this.ngZone.run(() => {
            this.searchMessage = `Found value \"${value}\"`;
            this.searching = false;
            setTimeout(() => { this.ngZone.run(() => { this.searchMessage = ''; }); }, 1800);
          });
          break;
        }
        curr = value < curr.value ? curr.left : curr.right;
      }
      if (!path.length || path[path.length - 1].value !== value) {
        this.bstNodes.forEach(n => n.body.render.fillStyle = '#02D4E3');
        this.ngZone.run(() => {
          this.searchMessage = `Value \"${value}\" not found in tree.`;
          this.searching = false;
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
    this.rootNode = null;
    this.bstNodes = [];
  }

  root(): string | null {
    return this.rootNode ? String(this.rootNode.value) : 'null';
  }

  size(): number {
    return this.bstNodes.length;
  }

  height(): number {
    const dfs = (node: BSTNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(dfs(node.left), dfs(node.right));
    };
    return dfs(this.rootNode);
  }

  get preorder(): string {
    const res: string[] = [];
    const dfs = (node: BSTNode | null) => {
      if (!node) return;
      res.push(String(node.value));
      dfs(node.left);
      dfs(node.right);
    };
    dfs(this.rootNode);
    return res.join(', ');
  }

  get inorder(): string {
    const res: string[] = [];
    const dfs = (node: BSTNode | null) => {
      if (!node) return;
      dfs(node.left);
      res.push(String(node.value));
      dfs(node.right);
    };
    dfs(this.rootNode);
    return res.join(', ');
  }

  get postorder(): string {
    const res: string[] = [];
    const dfs = (node: BSTNode | null) => {
      if (!node) return;
      dfs(node.left);
      dfs(node.right);
      res.push(String(node.value));
    };
    dfs(this.rootNode);
    return res.join(', ');
  }

  get levelorder(): string {
    const res: string[] = [];
    const queue: BSTNode[] = [];
    if (this.rootNode) queue.push(this.rootNode);
    while (queue.length > 0) {
      const node = queue.shift()!;
      res.push(String(node.value));
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return res.join(', ');
  }

  // --- Canvas Interactions ---
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

  updateEdges() {
    this.edges = [];
    const traverse = (node: BSTNode | null) => {
      if (!node) return;
      if (node.left) this.edges.push({ from: node.body, to: node.left.body });
      if (node.right) this.edges.push({ from: node.body, to: node.right.body });
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.rootNode);
  }

  private findNode(value: number): BSTNode | null {
    let curr = this.rootNode;
    while (curr) {
      if (curr.value === value) return curr;
      curr = value < curr.value ? curr.left : curr.right;
    }
    return null;
  }
}
