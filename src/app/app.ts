import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurvaS } from './curva-s/curva-s';
import { Gantt } from './gantt/gantt';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurvaS, Gantt, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Relatório Técnico');
  readonly theme = signal<'dark' | 'light'>('dark');
  readonly isLoggedIn = signal(false);
  readonly password = signal('');

  private readonly VALID_HASH = environment.hash;

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
    });
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  login(): void {
    if (this.password() === this.VALID_HASH) {
      this.isLoggedIn.set(true);
    } else {
      alert('Hash inválido');
    }
  }
}
