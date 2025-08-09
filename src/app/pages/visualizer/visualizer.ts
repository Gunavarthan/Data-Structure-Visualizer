import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe, CommonModule, NgComponentOutlet } from '@angular/common';
import { Stack } from './stack/stack';
import { Queue } from './queue/queue';
import { Linkedlist } from './linkedlist/linkedlist';
import { Binarytree } from './binarytree/binarytree';
import { Binarysearchtree } from './binarysearchtree/binarysearchtree';
import { Maxheap } from './maxheap/maxheap';
import { Bubblesort } from './bubblesort/bubblesort';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, NgComponentOutlet, Stack],
  templateUrl: './visualizer.html',
})
export class VisualizerComponent implements OnInit {
  dsType: string = '';
  componentType: any = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.dsType = this.route.snapshot.paramMap.get('dsType') || '';
    switch (this.dsType) {
      case 'stack':
        this.componentType = Stack;
        break;

      case 'queue':
        this.componentType = Queue;
        break;
      
      case 'linked-list':
        this.componentType = Linkedlist;
        break;

      case 'binary-tree':
        this.componentType = Binarytree;
        break;
      
      case 'binary-search-tree':
        this.componentType = Binarysearchtree;
        break;
      
      case 'max-heap':
        this.componentType = Maxheap; // Assuming MaxHeap uses BinaryTree logic
        break;
      
      case 'bubble-sort':
        this.componentType = Bubblesort;
        break;
      // Add more cases for other data structures
      default:
        this.componentType = null;
    }
  }
}
