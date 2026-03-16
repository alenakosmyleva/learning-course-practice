import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStoreService } from '../../store/app-store.service';
import { AppState } from '../../store/app-state.model';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [AsyncPipe, JsonPipe, FormsModule],
  templateUrl: './debug-panel.html',
  styleUrl: './debug-panel.scss',
})
export class DebugPanelComponent {
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  private store = inject(AppStoreService);

  state$ = this.store.state$;
  actionLog$ = this.store.actionLog$;

  activeTab: 'state' | 'edit' | 'log' = 'state';
  editJson = '';
  editError = '';

  onOpen() {
    this.editJson = JSON.stringify(this.store.snapshot, null, 2);
    this.editError = '';
  }

  switchTab(tab: 'state' | 'edit' | 'log') {
    this.activeTab = tab;
    if (tab === 'edit') {
      this.editJson = JSON.stringify(this.store.snapshot, null, 2);
      this.editError = '';
    }
  }

  applyJson() {
    try {
      const parsed: AppState = JSON.parse(this.editJson);
      if (!Array.isArray(parsed.users) || typeof parsed.dashboard !== 'object') {
        this.editError = 'Invalid state structure: users must be an array, dashboard must be an object';
        return;
      }
      this.store.loadState(parsed);
      this.editError = '';
    } catch (e) {
      this.editError = 'Invalid JSON: ' + (e instanceof Error ? e.message : String(e));
    }
  }

  resetState() {
    this.store.resetState();
    this.editJson = JSON.stringify(this.store.snapshot, null, 2);
    this.editError = '';
  }

  clearLog() {
    this.store.clearLog();
  }

  close() {
    this.closePanel.emit();
  }

  formatPayload(payload: unknown): string {
    return payload ? JSON.stringify(payload, null, 2) : '';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
  }
}
