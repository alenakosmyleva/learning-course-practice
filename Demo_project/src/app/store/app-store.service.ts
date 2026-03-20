import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppState, User, DashboardStats, ActionLogEntry, OnboardingWizard } from './app-state.model';
import { INITIAL_STATE } from './initial-state';

@Injectable({ providedIn: 'root' })
export class AppStoreService {
  private stateSubject = new BehaviorSubject<AppState>(structuredClone(INITIAL_STATE));
  private logSubject = new BehaviorSubject<ActionLogEntry[]>([]);

  state$ = this.stateSubject.asObservable();
  actionLog$ = this.logSubject.asObservable();

  users$ = this.state$.pipe(map((s) => s.users));
  dashboard$ = this.state$.pipe(map((s) => s.dashboard));
  currentUserId$ = this.state$.pipe(map((s) => s.currentUserId));
  currentUserRole$ = this.state$.pipe(
    map((s) => {
      if (s.currentUserId === null) return null;
      const user = s.users.find((u) => u.id === s.currentUserId);
      return user?.role ?? null;
    }),
  );

  get snapshot(): AppState {
    return this.stateSubject.getValue();
  }

  addUser(data: Omit<User, 'id' | 'createdAt'>) {
    const state = this.snapshot;
    const newUser: User = {
      ...data,
      id: state.nextUserId,
      createdAt: new Date().toISOString(),
    };
    this.updateState(
      {
        ...state,
        users: [...state.users, newUser],
        nextUserId: state.nextUserId + 1,
      },
      'ADD_USER',
      data,
    );
  }

  updateUser(id: number, changes: Partial<User>) {
    const state = this.snapshot;
    this.updateState(
      {
        ...state,
        users: state.users.map((u) => (u.id === id ? { ...u, ...changes } : u)),
      },
      'UPDATE_USER',
      { id, changes },
    );
  }

  deleteUser(id: number) {
    const state = this.snapshot;
    this.updateState(
      {
        ...state,
        users: state.users.filter((u) => u.id !== id),
      },
      'DELETE_USER',
      { id },
    );
  }

  toggleUserStatus(id: number) {
    const state = this.snapshot;
    this.updateState(
      {
        ...state,
        users: state.users.map((u) =>
          u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u,
        ),
      },
      'TOGGLE_STATUS',
      { id },
    );
  }

  onboarding$ = this.state$.pipe(map((s) => s.onboarding));

  updateOnboarding(changes: Partial<OnboardingWizard>) {
    const state = this.snapshot;
    this.updateState(
      { ...state, onboarding: { ...state.onboarding, ...changes } },
      'UPDATE_ONBOARDING',
      changes,
    );
  }

  resetOnboarding() {
    const state = this.snapshot;
    this.updateState(
      { ...state, onboarding: { step: 1, name: '', email: '', role: '' } },
      'RESET_ONBOARDING',
    );
  }

  setCurrentUser(userId: number | null) {
    const state = this.snapshot;
    this.updateState(
      { ...state, currentUserId: userId },
      'SET_CURRENT_USER',
      { userId },
    );
  }

  updateDashboard(changes: Partial<DashboardStats>) {
    const state = this.snapshot;
    this.updateState(
      {
        ...state,
        dashboard: { ...state.dashboard, ...changes },
      },
      'UPDATE_DASHBOARD',
      changes,
    );
  }

  resetState() {
    this.updateState(structuredClone(INITIAL_STATE), 'RESET_STATE');
  }

  loadState(newState: AppState) {
    this.updateState(newState, 'LOAD_STATE');
  }

  clearLog() {
    this.logSubject.next([]);
  }

  private updateState(newState: AppState, actionName: string, payload?: unknown) {
    this.stateSubject.next(newState);
    const entry: ActionLogEntry = {
      timestamp: new Date().toISOString(),
      actionName,
      payload,
    };
    this.logSubject.next([entry, ...this.logSubject.getValue()]);
  }
}
