/**
 * Common Directives Collection
 *
 * A collection of useful directives for common UI patterns.
 *
 * Includes 10 directives:
 * 1. ClickOutside
 * 2. AutoFocus
 * 3. CopyToClipboard
 * 4. InfiniteScroll
 * 5. LazyLoad
 * 6. Tooltip
 * 7. ConfirmClick
 * 8. Debounce
 * 9. LongPress
 * 10. ResizeObserver
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

/**
 * 1. Click Outside Directive
 * Emits event when clicking outside the element
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<MouseEvent>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.clickOutside.emit(event);
    }
  }
}

/**
 * 2. Auto Focus Directive
 * Automatically focuses the element when rendered
 */
@Directive({
  selector: '[autoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements OnInit {
  @Input() autoFocusDelay = 0;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, this.autoFocusDelay);
  }
}

/**
 * 3. Copy to Clipboard Directive
 * Copies text to clipboard on click
 */
@Directive({
  selector: '[copyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  @Input() copyToClipboard!: string;
  @Output() copied = new EventEmitter<boolean>();

  @HostListener('click')
  async onClick(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.copyToClipboard);
      this.copied.emit(true);
    } catch (error) {
      this.copied.emit(false);
    }
  }
}

/**
 * 4. Infinite Scroll Directive
 * Triggers event when scrolling near the bottom
 */
@Directive({
  selector: '[infiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() infiniteScrollDistance = 100;
  @Output() scrolled = new EventEmitter<void>();

  private observer!: IntersectionObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const options = {
      root: null,
      rootMargin: `${this.infiniteScrollDistance}px`,
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.scrolled.emit();
        }
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * 5. Lazy Load Directive
 * Lazy loads images when they enter viewport
 */
@Directive({
  selector: 'img[lazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() lazyLoad!: string;

  private observer!: IntersectionObserver;

  constructor(private elementRef: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.observer.disconnect();
        }
      });
    });

    this.observer.observe(this.elementRef.nativeElement);
  }

  private loadImage(): void {
    this.elementRef.nativeElement.src = this.lazyLoad;
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * 6. Tooltip Directive
 * Shows tooltip on hover
 */
@Directive({
  selector: '[tooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input() tooltip = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  @HostListener('mouseenter')
  onMouseEnter(): void {
    // Show tooltip logic
    console.log('Show tooltip:', this.tooltip);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    // Hide tooltip logic
    console.log('Hide tooltip');
  }
}

/**
 * 7. Confirm Click Directive
 * Requires confirmation before executing click
 */
@Directive({
  selector: '[confirmClick]',
  standalone: true,
})
export class ConfirmClickDirective {
  @Input() confirmMessage = 'Are you sure?';
  @Output() confirmed = new EventEmitter<void>();

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.preventDefault();
    if (confirm(this.confirmMessage)) {
      this.confirmed.emit();
    }
  }
}

/**
 * 8. Debounce Directive
 * Debounces input events
 */
@Directive({
  selector: '[debounceInput]',
  standalone: true,
})
export class DebounceInputDirective implements OnDestroy {
  @Input() debounceTime = 300;
  @Output() debounceInput = new EventEmitter<Event>();

  private timeout?: ReturnType<typeof setTimeout>;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.debounceInput.emit(event);
    }, this.debounceTime);
  }

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

/**
 * 9. Long Press Directive
 * Triggers event on long press
 */
@Directive({
  selector: '[longPress]',
  standalone: true,
})
export class LongPressDirective implements OnDestroy {
  @Input() longPressDuration = 500;
  @Output() longPress = new EventEmitter<void>();

  private timeout?: ReturnType<typeof setTimeout>;

  @HostListener('mousedown')
  @HostListener('touchstart')
  onPress(): void {
    this.timeout = setTimeout(() => {
      this.longPress.emit();
    }, this.longPressDuration);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  onRelease(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}

/**
 * 10. Resize Observer Directive
 * Emits event when element is resized
 */
@Directive({
  selector: '[resizeObserver]',
  standalone: true,
})
export class ResizeObserverDirective implements OnInit, OnDestroy {
  @Output() resized = new EventEmitter<ResizeObserverEntry>();

  private observer!: ResizeObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => this.resized.emit(entry));
    });

    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export all directives as an array for easy importing
export const COMMON_DIRECTIVES = [
  ClickOutsideDirective,
  AutoFocusDirective,
  CopyToClipboardDirective,
  InfiniteScrollDirective,
  LazyLoadDirective,
  TooltipDirective,
  ConfirmClickDirective,
  DebounceInputDirective,
  LongPressDirective,
  ResizeObserverDirective,
];



