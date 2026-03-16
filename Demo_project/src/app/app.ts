import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DebugPanelComponent } from './components/debug-panel/debug-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DebugPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  debugPanelOpen = false;

  toggleDebugPanel() {
    this.debugPanelOpen = !this.debugPanelOpen;
  }
}
