import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe, CommonModule, NgComponentOutlet } from '@angular/common';
import { Stack } from './stack/stack';
import { Queue } from './queue/queue';
import { Linkedlist } from './linkedlist/linkedlist';
import { Binarytree } from './binarytree/binarytree';

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
      // Add more cases for other data structures
      default:
        this.componentType = null;
    }
  }
}
