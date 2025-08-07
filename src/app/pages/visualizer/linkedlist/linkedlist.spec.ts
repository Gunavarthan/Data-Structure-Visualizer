import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Linkedlist } from './linkedlist';

describe('Linkedlist', () => {
  let component: Linkedlist;
  let fixture: ComponentFixture<Linkedlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Linkedlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Linkedlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
