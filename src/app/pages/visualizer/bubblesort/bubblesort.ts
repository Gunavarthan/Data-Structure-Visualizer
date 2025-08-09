
import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import * as Matter from 'matter-js';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bubblesort',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bubblesort.html',
  styleUrl: './bubblesort.css'
})
export class Bubblesort implements AfterViewInit {
  @ViewChild('sortCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  canvasWidth = 1000;
  canvasHeight = 500;
  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private runner!: Matter.Runner;
  private bars: Matter.Body[] = [];
  array: number[] = [];
  numBars = 20;
  sorting = false;
  swapColor = '#ffb300';
  defaultColor = '#7ee787';
  sortedColor = '#43ea4a';
  speed = 1; // 1=normal, 2=fast, 0.5=slow
  stepMode = false;
  currentStep = 0;
  steps: {i: number, j: number, swapped: boolean, arr: number[]}[] = [];
  stepSorting = false;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.engine = Matter.Engine.create();
    this.render = Matter.Render.create({
      canvas: this.canvasRef.nativeElement,
      engine: this.engine,
      options: {
        width: this.canvasWidth,
        height: this.canvasHeight,
        wireframes: false,
        background: '#23233a',
      }
    });
    Matter.Render.run(this.render);
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
    this.resetArray();
    this.drawHistogram();
  }

  resetArray() {
    this.array = Array.from({ length: this.numBars }, () => Math.floor(Math.random() * 400) + 40);
    this.clearBars();
    this.drawHistogram();
  }

  clearBars() {
    for (const bar of this.bars) {
      Matter.World.remove(this.engine.world, bar);
    }
    this.bars = [];
  }

  drawHistogram() {
    this.clearBars();
    // Calculate bar width and spacing for clarity
    const maxBarWidth = 32;
    const minSpacing = 6;
    let barWidth = Math.min(maxBarWidth, (this.canvasWidth - (this.array.length + 1) * minSpacing) / this.array.length);
    let spacing = (this.canvasWidth - this.array.length * barWidth) / (this.array.length + 1);
    if (barWidth < 8) barWidth = 8; // minimum readable
    for (let i = 0; i < this.array.length; i++) {
      const height = this.array[i];
      const x = spacing + i * (barWidth + spacing) + barWidth / 2;
      const y = this.canvasHeight - height / 2 - 8; // leave space for label
      const bar = Matter.Bodies.rectangle(x, y, barWidth, height, {
        isStatic: true,
        render: {
          fillStyle: this.defaultColor,
        },
        label: String(this.array[i])
      });
      this.bars.push(bar);
    }
    Matter.World.add(this.engine.world, this.bars);
    this.overrideRenderLabels();
  }

  // Custom rendering for value labels on bars
  private overrideRenderLabels() {
    // Remove previous event listeners to avoid stacking
    Matter.Events.off(this.render, 'afterRender');
    Matter.Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      ctx.save();
      ctx.font = 'bold 15px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (let i = 0; i < this.bars.length; i++) {
        const bar = this.bars[i];
        // Always show label above bar, even if narrow
        ctx.fillStyle = '#fff';
        ctx.fillText(String(this.array[i]), bar.position.x, bar.position.y - (bar.bounds.max.y - bar.position.y) - 4);
      }
      ctx.restore();
    });
  }

  setSpeed(val: number) {
    this.speed = val;
  }

  // --- Step-by-step Bubble Sort ---
  prepareSteps() {
    this.steps = [];
    let arr = this.array.slice();
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        let swapped = false;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swapped = true;
        }
        this.steps.push({ i: j, j: j + 1, swapped, arr: arr.slice() });
      }
    }
    this.currentStep = 0;
    this.stepMode = true;
    this.stepSorting = false;
  }

  nextStep() {
    if (!this.stepMode || this.currentStep >= this.steps.length) return;
    const step = this.steps[this.currentStep];
    this.array = step.arr.slice();
    this.drawHistogram();
    // Highlight bars
    this.setBarColor(step.i, this.swapColor);
    this.setBarColor(step.j, this.swapColor);
    if (step.swapped) {
      this.setBarColor(step.j, '#1f6feb');
    }
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.stepSorting = false;
      this.stepMode = false;
    }
  }

  prevStep() {
    if (!this.stepMode || this.currentStep <= 1) return;
    this.currentStep -= 2;
    this.nextStep();
  }

  startStepSort() {
    this.prepareSteps();
    this.stepSorting = true;
    this.nextStep();
  }

  // Bubble Sort animation
  async bubbleSort() {
    if (this.sorting) return;
    this.sorting = true;
    const delay = 300 / this.speed;
    for (let i = 0; i < this.array.length - 1; i++) {
      for (let j = 0; j < this.array.length - i - 1; j++) {
        this.setBarColor(j, this.swapColor);
        this.setBarColor(j + 1, this.swapColor);
        await this.sleep(delay);
        if (this.array[j] > this.array[j + 1]) {
          this.swap(j, j + 1);
          await this.animateSwap(j, j + 1, delay);
        }
        this.setBarColor(j, this.defaultColor);
        this.setBarColor(j + 1, this.defaultColor);
      }
      this.setBarColor(this.array.length - i - 1, this.sortedColor);
    }
    this.setBarColor(0, this.sortedColor);
    this.sorting = false;
  }

  private swap(i: number, j: number) {
    [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
    [this.bars[i], this.bars[j]] = [this.bars[j], this.bars[i]];
  }

  private async animateSwap(i: number, j: number, delay = 300) {
    // Animate the bars swapping positions horizontally
    const maxBarWidth = 32;
    const minSpacing = 6;
    let barWidth = Math.min(maxBarWidth, (this.canvasWidth - (this.array.length + 1) * minSpacing) / this.array.length);
    let spacing = (this.canvasWidth - this.array.length * barWidth) / (this.array.length + 1);
    if (barWidth < 8) barWidth = 8;
    const x1 = spacing + i * (barWidth + spacing) + barWidth / 2;
    const x2 = spacing + j * (barWidth + spacing) + barWidth / 2;
    const barA = this.bars[i];
    const barB = this.bars[j];
    const steps = 12;
    for (let s = 1; s <= steps; s++) {
      Matter.Body.setPosition(barA, { x: x1 + ((x2 - x1) * s) / steps, y: barA.position.y });
      Matter.Body.setPosition(barB, { x: x2 + ((x1 - x2) * s) / steps, y: barB.position.y });
      await this.sleep(delay / steps);
    }
    // Snap to final positions
    Matter.Body.setPosition(barA, { x: x2, y: barA.position.y });
    Matter.Body.setPosition(barB, { x: x1, y: barB.position.y });
  }

  private setBarColor(i: number, color: string) {
    if (this.bars[i]) {
      this.bars[i].render.fillStyle = color;
    }
  }

  private sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}
