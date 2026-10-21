import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../Core/Services/data.service';
import { initialsOf } from '../../../Core/Models/models';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.css'
})
export class DriversComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly data = inject(DataService);

  protected readonly search = signal('');
  protected readonly successMessage = signal('');

  protected readonly driverForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    license: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9-]{2,11}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9][0-9\s()-]{6,16}$/)]],
    available: [true],
  });

  protected readonly filteredDrivers = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.data.drivers().filter(
      (driver) =>
        !query ||
        driver.name.toLowerCase().includes(query) ||
        driver.license.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query),
    );
  });

  protected submit(): void {
    if (this.driverForm.invalid) {
      this.driverForm.markAllAsTouched();
      this.successMessage.set('');
      return;
    }
    const value = this.driverForm.getRawValue();
    this.data.addDriver({ ...value, unavailableDates: [] });
    this.successMessage.set(`Driver “${value.name}” was added.`);
    this.driverForm.reset({ name: '', license: '', phone: '', available: true });
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.driverForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected routeCount(driverId: string): number {
    return this.data.routes().filter((route) => route.assignedDriverId === driverId).length;
  }
}
