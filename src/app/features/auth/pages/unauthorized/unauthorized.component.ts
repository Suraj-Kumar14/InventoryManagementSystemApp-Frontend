import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-danger-50 via-white to-danger-50 px-4">
      <div class="text-center">
        <div class="mb-6">
          <h1 class="text-9xl font-bold text-danger-600">403</h1>
          <p class="text-3xl font-bold text-neutral-900 mt-4">Access Denied</p>
        </div>
        <p class="text-neutral-600 text-lg mb-8 max-w-md">
          You are not allowed to access this module.
        </p>
        <div class="flex gap-4 justify-center">
          <a routerLink="/settings" class="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all">
            Go to Settings
          </a>
          <a routerLink="/login" class="px-6 py-3 bg-neutral-200 text-neutral-900 font-medium rounded-lg hover:bg-neutral-300 transition-all">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {}
