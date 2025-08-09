import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Binarysearchtree } from './binarysearchtree';

describe('Binarysearchtree', () => {
  let component: Binarysearchtree;
  let fixture: ComponentFixture<Binarysearchtree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Binarysearchtree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Binarysearchtree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
