import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
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
export class JsonEditorComponent {
  @ViewChild('textareaRef', { static: false }) textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() jsonInput = '{}';
  @Input() jsonError = '';
  @Input() isJsonValid = true;

  @Output() jsonInputChange = new EventEmitter<string>();

  onJsonInputChange(): void {
    this.jsonInputChange.emit(this.jsonInput);
  }
}
