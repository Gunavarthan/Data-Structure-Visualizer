import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Visualizer } from './visualizer';

describe('Visualizer', () => {
  let component: Visualizer;
  let fixture: ComponentFixture<Visualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Visualizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Visualizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
