import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
})
export class ButtonComponent {
  @Input() label = 'Button';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.isLoading && !this.disabled) this.clicked.emit();
  }
}
