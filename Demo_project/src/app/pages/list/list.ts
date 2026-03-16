import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStoreService } from '../../store/app-store.service';
import { User } from '../../store/app-state.model';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './list.html',
})
export class ListComponent {
  private store = inject(AppStoreService);

  users$ = this.store.users$;

  editingUser: User | null = null;
  editForm = { name: '', email: '', role: '' as User['role'], company: '', phone: '' };

  toggleStatus(id: number) {
    this.store.toggleUserStatus(id);
  }

  startEdit(user: User) {
    this.editingUser = user;
    this.editForm = {
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
    };
  }

  saveEdit() {
    if (this.editingUser) {
      this.store.updateUser(this.editingUser.id, { ...this.editForm });
      this.editingUser = null;
    }
  }

  cancelEdit() {
    this.editingUser = null;
  }

  deleteUser(id: number) {
    this.store.deleteUser(id);
  }
}
