import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe, CommonModule, NgComponentOutlet } from '@angular/common';
import { Stack } from './stack/stack';

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
      // Add more cases for other data structures
      default:
        this.componentType = null;
    }
  }
}
