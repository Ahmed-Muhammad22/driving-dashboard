import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RoutesComponent } from './routes.component';
import { DashboardData } from '../../../Core/Models/models';

describe('RoutesComponent', () => {
  let component: RoutesComponent;
  let fixture: ComponentFixture<RoutesComponent>;
  let httpMock: HttpTestingController;

  const seed: DashboardData = {
    drivers: [
      { id: 'd1', name: 'Alice Johnson', license: 'DL-1', phone: '+1 555-0101', available: true, unavailableDates: [] },
    ],
    routes: [
      { id: 'r1', name: 'Route A', origin: 'A', destination: 'B', scheduledTime: '08:00', assignedDriverId: 'd1' },
      { id: 'r2', name: 'Route B', origin: 'C', destination: 'D', scheduledTime: '09:00', assignedDriverId: null },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RoutesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/assets/data.json').flush(seed);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the add-route form and route statuses', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Add route');
    expect(compiled.textContent).toContain('Assigned');
    expect(compiled.textContent).toContain('Unassigned');
  });
});
