import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AppStoreService } from '../../store/app-store.service';
import { User } from '../../store/app-state.model';
import { RoleIconComponent } from '../../components/role-icon/role-icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AsyncPipe, RoleIconComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private store = inject(AppStoreService);

  users$ = this.store.users$;
  hoveredUserId: number | null = null;

  onRoleChange(userId: number, event: Event) {
    const role = (event.target as HTMLSelectElement).value as User['role'];
    this.store.updateUser(userId, { role });
  }
}
