import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  dataStructures = [
    { name: 'Stack', type: 'stack', description: 'LIFO structure' },
    { name: 'Queue', type: 'queue', description: 'FIFO structure' },
    { name: 'Linked List', type: 'linked-list', description: 'Sequential data' },
    { name: 'Binary Tree', type: 'binary-tree', description: 'Hierarchical data' },
    { name: 'Graph', type: 'graph', description: 'Nodes and edges' },
  ];

  navigateTo(type: string) {
    this.router.navigate(['/visualizer', type]);
  }
}
