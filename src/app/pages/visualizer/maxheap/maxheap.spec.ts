import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maxheap } from './maxheap';

describe('Maxheap', () => {
  let component: Maxheap;
  let fixture: ComponentFixture<Maxheap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maxheap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Maxheap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
