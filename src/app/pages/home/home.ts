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
    { name: 'Binary Search Tree', type: 'binary-search-tree', description: 'Ordered hierarchical data' },
    { name: 'Max Heap', type: 'max-heap', description: 'Complete binary tree' },
    { name: 'Graph', type: 'graph', description: 'Nodes and edges' },
  ];

  algorithms = [
    { name: 'Bubble Sort', type: 'bubble-sort', description: 'Simple sorting algorithm' },
    { name: 'Quick Sort', type: 'quick-sort', description: 'Efficient sorting algorithm' },
    { name: 'Merge Sort', type: 'merge-sort', description: 'Divide and conquer sorting' },
    { name: 'Dijkstra', type: 'dijkstra', description: 'Shortest path algorithm' },
    { name: 'DFS', type: 'dfs', description: 'Depth-first search' },
    { name: 'BFS', type: 'bfs', description: 'Breadth-first search' },
  ];

  navigateTo(type: string) {
    this.router.navigate(['/visualizer', type]);
  }
}
