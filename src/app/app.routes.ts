import { Routes } from '@angular/router';
import { DashboardComponent } from './Pages/Dashboard/dashboard/dashboard.component';
import { DriversComponent } from './Pages/Drivers/drivers/drivers.component';
import { RoutesComponent } from './Pages/Routes/routes/routes.component';
import { CalendarComponent } from './Pages/calendar/calendar/calendar.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'Dashboard · Driving School' },
  { path: 'drivers', component: DriversComponent, title: 'Drivers · Driving School' },
  { path: 'routes', component: RoutesComponent, title: 'Routes · Driving School' },
  { path: 'calendar', component: CalendarComponent, title: 'Availability Calendar · Driving School' },
  { path: '**', redirectTo: '' },
];
