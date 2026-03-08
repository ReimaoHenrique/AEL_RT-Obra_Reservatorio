import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CurvaS } from './curva-s';

describe('CurvaS', () => {
  let component: CurvaS;
  let fixture: ComponentFixture<CurvaS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurvaS],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CurvaS);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
