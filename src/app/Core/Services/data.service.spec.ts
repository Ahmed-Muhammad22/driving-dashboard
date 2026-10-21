import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DataService } from './data.service';
import { DashboardData } from '../Models/models';

describe('DataService', () => {
  let service: DataService;
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads drivers and routes from the mock JSON', () => {
    const req = httpMock.expectOne('/assets/data.json');
    expect(req.request.method).toBe('GET');
    req.flush(seed);

    expect(service.loaded()).toBeTrue();
    expect(service.drivers().length).toBe(2);
    expect(service.routes().length).toBe(2);
    expect(service.driverName('d1')).toBe('Alice Johnson');
  });

  it('adds a new driver with a generated id', () => {
    httpMock.expectOne('/assets/data.json').flush(seed);

    service.addDriver({ name: 'Maria Chen', license: 'DL-9', phone: '+1 555-0103', available: true, unavailableDates: [] });

    const added = service.drivers().find((driver) => driver.name === 'Maria Chen');
    expect(added?.id).toBe('d3');
    expect(service.drivers().length).toBe(3);
  });

  it('adds a new route as unassigned', () => {
    httpMock.expectOne('/assets/data.json').flush(seed);

    service.addRoute({ name: 'Route E', origin: 'E', destination: 'F', scheduledTime: '10:00' });

    const added = service.routes().find((route) => route.name === 'Route E');
    expect(added?.id).toBe('r3');
    expect(added?.assignedDriverId).toBeNull();
  });

  it('assigns and unassigns drivers on a route', () => {
    httpMock.expectOne('/assets/data.json').flush(seed);

    service.assignDriver('r2', 'd2');
    expect(service.routes().find((route) => route.id === 'r2')?.assignedDriverId).toBe('d2');

    service.assignDriver('r2', null);
    expect(service.routes().find((route) => route.id === 'r2')?.assignedDriverId).toBeNull();
  });

  it('toggles overall and per-day driver availability', () => {
    httpMock.expectOne('/assets/data.json').flush(seed);

    service.toggleAvailability('d1');
    expect(service.drivers().find((driver) => driver.id === 'd1')?.available).toBeFalse();

    service.toggleDriverDate('d1', '2026-10-05');
    const driver = service.drivers().find((d) => d.id === 'd1');
    expect(driver?.unavailableDates).toEqual(['2026-10-05']);
    expect(service.isAvailableOn(driver!, '2026-10-05')).toBeFalse();

    service.toggleDriverDate('d1', '2026-10-05');
    expect(driver?.unavailableDates).toEqual([]);
  });
});
