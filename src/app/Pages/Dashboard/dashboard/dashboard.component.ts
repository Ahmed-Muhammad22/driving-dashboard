import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../Core/Services/data.service';
import { initialsOf } from '../../../Core/Models/models';

type RouteStatusFilter = 'all' | 'assigned' | 'unassigned';
type DriverStatusFilter = 'all' | 'available' | 'unavailable';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  protected readonly data = inject(DataService);

  protected readonly search = signal('');
  protected readonly routeFilter = signal<RouteStatusFilter>('all');
  protected readonly driverFilter = signal<DriverStatusFilter>('all');

  // KPI cards pulsed whenever an assignment changes their counts.
  @ViewChild('statAssigned') protected statAssignedCard?: ElementRef<HTMLElement>;
  @ViewChild('statUnassigned') protected statUnassignedCard?: ElementRef<HTMLElement>;

  protected readonly routeFilterOptions: { value: RouteStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'unassigned', label: 'Unassigned' },
  ];

  protected readonly totalRoutes = computed(() => this.data.routes().length);
  protected readonly assignedCount = computed(
    () => this.data.routes().filter((route) => route.assignedDriverId !== null).length,
  );
  protected readonly unassignedCount = computed(() => this.totalRoutes() - this.assignedCount());
  protected readonly totalDrivers = computed(() => this.data.drivers().length);
  protected readonly availableDriverCount = computed(
    () => this.data.drivers().filter((driver) => driver.available).length,
  );

  protected readonly filteredRoutes = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.routeFilter();
    return this.data.routes().filter((route) => {
      const matchesSearch =
        !query ||
        route.name.toLowerCase().includes(query) ||
        route.origin.toLowerCase().includes(query) ||
        route.destination.toLowerCase().includes(query) ||
        this.data.driverName(route.assignedDriverId).toLowerCase().includes(query);
      const assigned = route.assignedDriverId !== null;
      const matchesStatus = status === 'all' || (status === 'assigned' ? assigned : !assigned);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filteredDrivers = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.driverFilter();
    return this.data.drivers().filter((driver) => {
      const matchesSearch =
        !query ||
        driver.name.toLowerCase().includes(query) ||
        driver.license.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' || (status === 'available' ? driver.available : !driver.available);
      return matchesSearch && matchesStatus;
    });
  });

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected assign(routeId: string, driverId: string | null): void {
    this.data.assignDriver(routeId, driverId);
    this.pulseCard(this.statAssignedCard);
    this.pulseCard(this.statUnassignedCard);
  }

  private pulseCard(card: ElementRef<HTMLElement> | undefined): void {
    card?.nativeElement.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.045)' },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
  }
}
