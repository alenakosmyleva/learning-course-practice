import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStoreService } from '../../store/app-store.service';
import { User } from '../../store/app-state.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class OnboardingComponent implements OnInit {
  private store = inject(AppStoreService);
  private router = inject(Router);

  onboarding$ = this.store.onboarding$;

  name = '';
  email = '';
  role: User['role'] | '' = '';
  showErrors = false;

  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  get isEmailValid(): boolean {
    return this.emailPattern.test(this.email.trim());
  }

  ngOnInit() {
    this.store.resetOnboarding();
  }

  get step(): number {
    return this.store.snapshot.onboarding.step;
  }

  get progressPercent(): number {
    return Math.round((this.step / 3) * 100);
  }

  next() {
    if (!this.canNext) {
      this.showErrors = true;
      return;
    }
    this.showErrors = false;
    if (this.step === 1) {
      this.store.updateOnboarding({ name: this.name, email: this.email, step: 2 });
    } else if (this.step === 2) {
      this.store.updateOnboarding({ role: this.role, step: 3 });
    }
  }

  back() {
    if (this.step === 2) {
      this.store.updateOnboarding({ step: 1 });
    } else if (this.step === 3) {
      this.store.updateOnboarding({ step: 2 });
    }
  }

  create() {
    const ob = this.store.snapshot.onboarding;
    if (ob.name && ob.email && ob.role) {
      this.store.addUser({
        name: ob.name,
        email: ob.email,
        role: ob.role as User['role'],
        status: 'Active',
        company: '',
        phone: '',
      });
      this.store.resetOnboarding();
      this.router.navigate(['/list']);
    }
  }

  get canNext(): boolean {
    if (this.step === 1) {
      return this.name.trim() !== '' && this.isEmailValid;
    }
    if (this.step === 2) {
      return this.role !== '';
    }
    return false;
  }
}
