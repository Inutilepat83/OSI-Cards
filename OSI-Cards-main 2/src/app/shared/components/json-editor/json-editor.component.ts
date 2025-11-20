import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('textareaRef', { static: false }) textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() jsonInput = '{}';
  @Input() jsonError = '';
  @Input() isJsonValid = true;

  @Output() jsonInputChange = new EventEmitter<string>();

  editorStatus = '';
  isStatusAssertive = false;

  ngAfterViewInit(): void {
    // Initial focus provides quick keyboard access when the editor is first rendered.
    this.focusEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jsonError']) {
      const currentError = changes['jsonError'].currentValue as string;
      const previousError = changes['jsonError'].previousValue as string;

      if (currentError && currentError !== previousError) {
        this.focusEditor(true);
      }

      if (!currentError && previousError) {
        this.announceStatus('', false);
      }
    }
  }

  onJsonInputChange(): void {
    this.jsonInputChange.emit(this.jsonInput);
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.formatJson();
    }
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonInput = JSON.stringify(parsed, null, 2);
      this.jsonInputChange.emit(this.jsonInput);
      this.announceStatus('JSON formatted successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown formatting issue.';
      this.announceStatus(`Unable to format JSON: ${message}`, true);
    }
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
