import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AppStoreService } from '../../store/app-store.service';
import { map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private store = inject(AppStoreService);

  stats$ = combineLatest([this.store.users$, this.store.dashboard$]).pipe(
    map(([users, dashboard]) => [
      {
        label: 'Revenue',
        value: '$' + dashboard.revenue.toLocaleString(),
        change: dashboard.revenueChange,
        subtitle: 'from last month',
      },
      {
        label: 'Users',
        value: users.length.toString(),
        change: null,
        subtitle: users.filter((u) => u.status === 'Active').length + ' active',
      },
      {
        label: 'Orders',
        value: dashboard.ordersCount.toString(),
        change: dashboard.ordersChange,
        subtitle: 'from last month',
      },
      {
        label: 'Conversion',
        value: dashboard.conversionRate + '%',
        change: dashboard.conversionChange,
        subtitle: 'from last month',
      },
    ]),
  );
}
