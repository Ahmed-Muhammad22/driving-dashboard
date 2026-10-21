export interface Driver {
  id: string;
  name: string;
  license: string;
  phone: string;
  /** Overall availability flag shown on the dashboard. */
  available: boolean;
  /** ISO dates (yyyy-MM-dd) on which the driver is individually marked off. */
  unavailableDates: string[];
}

export interface DriveRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  /** Departure time in 24h HH:mm format. */
  scheduledTime: string;
  assignedDriverId: string | null;
}

export interface DashboardData {
  drivers: Driver[];
  routes: DriveRoute[];
}

/** Returns "AJ" for "Alice Johnson". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Returns "Alice" for "Alice Johnson". */
export function firstNameOf(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
