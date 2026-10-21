import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CalendarComponent } from './calendar.component';
import { DashboardData } from '../../../Core/Models/models';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let httpMock: HttpTestingController;

  const seed: DashboardData = {
    drivers: [
      { id: 'd1', name: 'Alice Johnson', license: 'DL-1', phone: '+1 555-0101', available: true, unavailableDates: [] },
      { id: 'd2', name: 'Bob Smith', license: 'DL-2', phone: '+1 555-0102', available: false, unavailableDates: [] },
    ],
    routes: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/assets/data.json').flush(seed);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a six-week month grid and weekday headers', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.cal-cell').length).toBe(42);
    expect(compiled.textContent).toContain('Mon');
  });

  it('only shows globally available drivers in the day cells', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alice');
    expect(compiled.textContent).not.toContain('Bob');
  });
});
