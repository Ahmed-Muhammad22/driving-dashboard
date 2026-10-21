import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../Core/Services/data.service';

type RouteStatusFilter = 'all' | 'assigned' | 'unassigned';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './routes.component.html',
  styleUrl: './routes.component.css'
})
export class RoutesComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly data = inject(DataService);

  protected readonly search = signal('');
  protected readonly routeFilter = signal<RouteStatusFilter>('all');
  protected readonly successMessage = signal('');

  protected readonly routeFilterOptions: { value: RouteStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'unassigned', label: 'Unassigned' },
  ];

  protected readonly routeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    origin: ['', [Validators.required, Validators.maxLength(40)]],
    destination: ['', [Validators.required, Validators.maxLength(40)]],
    scheduledTime: ['08:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
  });

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

  protected submit(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      this.successMessage.set('');
      return;
    }
    const value = this.routeForm.getRawValue();
    this.data.addRoute(value);
    this.successMessage.set(`Route “${value.name}” was added and is currently unassigned.`);
    this.routeForm.reset({ name: '', origin: '', destination: '', scheduledTime: '08:00' });
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.routeForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected assign(routeId: string, driverId: string | null): void {
    this.data.assignDriver(routeId, driverId);
  }
}
