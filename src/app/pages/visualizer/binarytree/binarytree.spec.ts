import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Binarytree } from './binarytree';

describe('Binarytree', () => {
  let component: Binarytree;
  let fixture: ComponentFixture<Binarytree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Binarytree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Binarytree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
