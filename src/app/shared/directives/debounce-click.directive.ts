import { Directive, HostListener, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective implements OnDestroy {
  @Input() debounceTime = 400;
  @Output() debounceClick = new EventEmitter<MouseEvent>();

  private clicks$ = new Subject<MouseEvent>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.clicks$
      .pipe(
        debounceTime(this.debounceTime),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.debounceClick.emit(event);
      });
  }

  @HostListener('click', ['$event'])
  onMouseClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks$.next(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

