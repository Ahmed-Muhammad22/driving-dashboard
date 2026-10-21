import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../../Core/Services/data.service';
import { Driver, firstNameOf } from '../../../Core/Models/models';

interface CalendarDriverEntry {
  driver: Driver;
  availableToday: boolean;
}

interface CalendarDay {
  iso: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  drivers: CalendarDriverEntry[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  protected readonly data = inject(DataService);

  /** First day of the month currently displayed. */
  protected readonly viewDate = signal(new Date());
  protected readonly todayIso = toIsoDate(new Date());

  protected readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  /** Six full weeks (42 cells) covering the displayed month. */
  protected readonly weeks = computed<CalendarWeek[]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const drivers = this.data.drivers().filter((driver) => driver.available);
    const firstWeekday = new Date(year, month, 1).getDay();

    const weeks: CalendarWeek[] = [];
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const days: CalendarDay[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(year, month, 1 - firstWeekday + weekIndex * 7 + dayIndex);
        const iso = toIsoDate(date);
        days.push({
          iso,
          dayOfMonth: date.getDate(),
          inMonth: date.getMonth() === month,
          isToday: iso === this.todayIso,
          drivers: drivers.map((driver) => ({
            driver,
            availableToday: this.data.isAvailableOn(driver, iso),
          })),
        });
      }
      weeks.push({ days });
    }
    return weeks;
  });

  protected changeMonth(delta: number): void {
    const next = new Date(this.viewDate());
    next.setMonth(next.getMonth() + delta);
    this.viewDate.set(next);
  }

  protected goToToday(): void {
    this.viewDate.set(new Date());
  }

  protected firstName(name: string): string {
    return firstNameOf(name);
  }
}
