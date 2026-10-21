import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DriversComponent } from './drivers.component';
import { DashboardData } from '../../../Core/Models/models';

describe('DriversComponent', () => {
  let component: DriversComponent;
  let fixture: ComponentFixture<DriversComponent>;
  let httpMock: HttpTestingController;

  const seed: DashboardData = {
    drivers: [
      { id: 'd1', name: 'Alice Johnson', license: 'DL-1', phone: '+1 555-0101', available: true, unavailableDates: [] },
    ],
    routes: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriversComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DriversComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/assets/data.json').flush(seed);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the add-driver form and the seeded driver', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Add driver');
    expect(compiled.textContent).toContain('Alice Johnson');
  });
});
