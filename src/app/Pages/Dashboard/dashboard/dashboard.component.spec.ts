import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { DashboardData } from '../../../Core/Models/models';
import { describe, beforeEach, afterEach, it } from 'node:test';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const seed: DashboardData = {
    drivers: [
      { id: 'd1', name: 'Alice Johnson', license: 'DL-1', phone: '+1 555-0101', available: true, unavailableDates: [] },
      { id: 'd2', name: 'Bob Smith', license: 'DL-2', phone: '+1 555-0102', available: false, unavailableDates: [] },
    ],
    routes: [
      { id: 'r1', name: 'Route A', origin: 'A', destination: 'B', scheduledTime: '08:00', assignedDriverId: 'd1' },
      { id: 'r2', name: 'Route B', origin: 'C', destination: 'D', scheduledTime: '09:00', assignedDriverId: null },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/assets/data.json').flush(seed);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows assignment status for assigned and unassigned routes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Assigned');
    expect(compiled.textContent).toContain('Unassigned');
    expect(compiled.textContent).toContain('Alice Johnson');
  });
});
