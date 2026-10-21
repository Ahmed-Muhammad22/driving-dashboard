import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardData, DriveRoute, Driver } from '../Models/models';

/**
 * Local-state store for the dashboard. Seed data comes from a mock JSON file
 * (src/assets/data.json); every mutation afterwards lives in memory only.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly sourceUrl = '/assets/data.json';
  private loadStarted = false;

  readonly drivers = signal<Driver[]>([]);
  readonly routes = signal<DriveRoute[]>([]);
  readonly loaded = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loadStarted) {
      return;
    }
    this.loadStarted = true;
    firstValueFrom(this.http.get<DashboardData>(this.sourceUrl))
      .then((data) => {
        this.drivers.set(data.drivers ?? []);
        this.routes.set(data.routes ?? []);
        this.loaded.set(true);
      })
      .catch(() => {
        // Allow a retry on the next attempt (e.g. transient network error).
        this.loadStarted = false;
      });
  }

  driverById(id: string | null): Driver | undefined {
    return id ? this.drivers().find((driver) => driver.id === id) : undefined;
  }

  driverName(id: string | null): string {
    return this.driverById(id)?.name ?? '';
  }

  addDriver(input: Omit<Driver, 'id'>): void {
    const driver: Driver = { ...input, id: this.nextId('d', this.drivers()) };
    this.drivers.update((drivers) => [driver, ...drivers]);
  }

  addRoute(input: Omit<DriveRoute, 'id' | 'assignedDriverId'>): void {
    const route: DriveRoute = { ...input, assignedDriverId: null, id: this.nextId('r', this.routes()) };
    this.routes.update((routes) => [route, ...routes]);
  }

  assignDriver(routeId: string, driverId: string | null): void {
    this.routes.update((routes) =>
      routes.map((route) => (route.id === routeId ? { ...route, assignedDriverId: driverId } : route)),
    );
  }

  toggleAvailability(driverId: string): void {
    this.drivers.update((drivers) =>
      drivers.map((driver) => (driver.id === driverId ? { ...driver, available: !driver.available } : driver)),
    );
  }

  toggleDriverDate(driverId: string, dateIso: string): void {
    this.drivers.update((drivers) =>
      drivers.map((driver) => {
        if (driver.id !== driverId) {
          return driver;
        }
        const marked = driver.unavailableDates.includes(dateIso);
        return {
          ...driver,
          unavailableDates: marked
            ? driver.unavailableDates.filter((date) => date !== dateIso)
            : [...driver.unavailableDates, dateIso],
        };
      }),
    );
  }

  isAvailableOn(driver: Driver, dateIso: string): boolean {
    return driver.available && !driver.unavailableDates.includes(dateIso);
  }

  private nextId(prefix: string, existing: { id: string }[]): string {
    const max = existing.reduce((acc, item) => {
      const numeric = Number.parseInt(item.id.replace(/\D/g, ''), 10);
      return Number.isNaN(numeric) ? acc : Math.max(acc, numeric);
    }, 0);
    return `${prefix}${max + 1}`;
  }
}
