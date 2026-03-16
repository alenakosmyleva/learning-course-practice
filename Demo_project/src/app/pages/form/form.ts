import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStoreService } from '../../store/app-store.service';
import { User } from '../../store/app-state.model';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form.html',
})
export class FormComponent {
  private store = inject(AppStoreService);
  private router = inject(Router);

  name = '';
  email = '';
  phone = '';
  company = '';
  role: User['role'] = 'Viewer';
  submitted = false;

  onSubmit() {
    if (!this.name || !this.email) return;

    this.store.addUser({
      name: this.name,
      email: this.email,
      phone: this.phone,
      company: this.company,
      role: this.role,
      status: 'Active',
    });

    this.submitted = true;
    setTimeout(() => {
      this.submitted = false;
      this.router.navigate(['/list']);
    }, 1000);
  }

  onCancel() {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.company = '';
    this.role = 'Viewer';
  }
}
