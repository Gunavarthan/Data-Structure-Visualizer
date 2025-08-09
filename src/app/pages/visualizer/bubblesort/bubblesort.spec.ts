import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bubblesort } from './bubblesort';

describe('Bubblesort', () => {
  let component: Bubblesort;
  let fixture: ComponentFixture<Bubblesort>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bubblesort]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bubblesort);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
