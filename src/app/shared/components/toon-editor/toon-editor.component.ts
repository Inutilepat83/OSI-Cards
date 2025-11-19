import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { decode, encode } from '@toon-format/toon';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as CardSelectors from '../../../store/cards/cards.selectors';
import type { AppState } from '../../../store/app.state';

@Component({
  selector: 'app-toon-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toon-editor.component.html',
  styleUrls: ['./toon-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToonEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('textareaRef', { static: false }) textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() toonInput = '';
  @Input() toonError = '';
  @Input() isToonValid = true;
  @Input() isSimulatingLLM = false;
  @Input() llmStatusMessage = '';
  isBusy = false;

  @Output() toonInputChange = new EventEmitter<string>();
  @Output() simulateLLMStart = new EventEmitter<void>();
  @Output() simulateLLMCancel = new EventEmitter<void>();

  editorStatus = '';
  isStatusAssertive = false;

  ngAfterViewInit(): void {
    this.focusEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['toonError']) {
      const currentError = changes['toonError'].currentValue as string;
      const previousError = changes['toonError'].previousValue as string;

      if (currentError && currentError !== previousError) {
        this.focusEditor(true);
      }

      if (!currentError && previousError) {
        this.announceStatus('', false);
      }
    }
  }

  private readonly store: Store<AppState> = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Subscribe to global loading state to show a spinner overlay
    this.store.select(CardSelectors.selectIsBusy).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((busy) => {
      this.isBusy = busy;
    });
  }

  onToonInputChange(): void {
    this.toonInputChange.emit(this.toonInput);
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.formatToon();
    }
  }

  formatToon(): void {
    try {
      const parsed = decode(this.toonInput, { expandPaths: 'safe' });
      this.toonInput = `${encode(parsed, { indent: 2, keyFolding: 'safe' })}\n`;
      this.toonInputChange.emit(this.toonInput);
      this.announceStatus('TOON formatted successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown formatting issue.';
      this.announceStatus(`Unable to format TOON: ${message}`, true);
    }
  }

  onSimulationClick(): void {
    if (this.isSimulatingLLM) {
      this.simulateLLMCancel.emit();
      return;
    }

    this.simulateLLMStart.emit();
  }

  focusEditor(force = false): void {
    queueMicrotask(() => {
      const textarea = this.textareaRef?.nativeElement;
      if (!textarea) return;

      if (typeof document === 'undefined') {
        textarea.focus();
        return;
      }

      if (!force) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body && activeElement !== document.documentElement && activeElement !== textarea) {
          return;
        }
      }

      textarea.focus();
    });
  }

  private announceStatus(message: string, assertive = false): void {
    this.editorStatus = message;
    this.isStatusAssertive = assertive;
  }
}
