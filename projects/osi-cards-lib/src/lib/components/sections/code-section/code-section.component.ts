import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Code snippet field
 */
export interface CodeField extends CardField {
  /** The code content */
  code?: string;
  /** Programming language */
  language?: string;
  /** File name */
  filename?: string;
  /** Line numbers to highlight */
  highlightLines?: number[];
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Starting line number */
  startLine?: number;
}

/**
 * Code Section Component
 *
 * Displays code snippets with syntax highlighting,
 * line numbers, and copy functionality.
 *
 * @example
 * ```html
 * <app-code-section [section]="codeSection"></app-code-section>
 * ```
 */
@Component({
  selector: 'app-code-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './code-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeSectionComponent extends BaseSectionComponent<CodeField> {
  /** Code sections typically need more width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 3,
    expandOnDescriptionLength: 200,
  };

  /** Track copy state for feedback */
  copiedIndex = signal<number | null>(null);

  get fields(): CodeField[] {
    return super.getFields() as CodeField[];
  }

  /**
   * Get the code content from a field
   */
  getCode(field: CodeField): string {
    return field.code || field.value?.toString() || '';
  }

  /**
   * Get the programming language
   */
  getLanguage(field: CodeField): string {
    return field.language || 'plaintext';
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(field: CodeField): string {
    const lang = this.getLanguage(field).toLowerCase();
    const displayNames: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'csharp': 'C#',
      'cpp': 'C++',
      'go': 'Go',
      'rust': 'Rust',
      'ruby': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'bash': 'Bash',
      'shell': 'Shell',
      'sql': 'SQL',
      'graphql': 'GraphQL',
      'plaintext': 'Plain Text',
    };
    return displayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  /**
   * Get language class for styling
   */
  getLanguageClass(field: CodeField): string {
    return `language-${this.getLanguage(field)}`;
  }

  /**
   * Get the code lines for rendering
   */
  getCodeLines(field: CodeField): string[] {
    return this.getCode(field).split('\n');
  }

  /**
   * Get line number for display
   */
  getLineNumber(field: CodeField, index: number): number {
    const startLine = field.startLine ?? 1;
    return startLine + index;
  }

  /**
   * Check if a line should be highlighted
   */
  isLineHighlighted(field: CodeField, index: number): boolean {
    if (!field.highlightLines) return false;
    const lineNumber = this.getLineNumber(field, index);
    return field.highlightLines.includes(lineNumber);
  }

  /**
   * Copy code to clipboard
   */
  async copyCode(field: CodeField, index: number): Promise<void> {
    const code = this.getCode(field);

    try {
      await navigator.clipboard.writeText(code);
      this.copiedIndex.set(index);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        if (this.copiedIndex() === index) {
          this.copiedIndex.set(null);
        }
      }, 2000);

      this.emitFieldInteraction(field, {
        sectionTitle: this.section.title,
        action: 'copy',
        success: true
      });
    } catch {
      this.emitFieldInteraction(field, {
        sectionTitle: this.section.title,
        action: 'copy',
        success: false
      });
    }
  }

  /**
   * Check if copy was successful
   */
  isCopied(index: number): boolean {
    return this.copiedIndex() === index;
  }

  /**
   * Get icon for language
   */
  getLanguageIcon(field: CodeField): string {
    const lang = this.getLanguage(field).toLowerCase();
    const iconMap: Record<string, string> = {
      'javascript': 'file-code',
      'typescript': 'file-code',
      'python': 'file-code',
      'html': 'file-code',
      'css': 'palette',
      'json': 'braces',
      'bash': 'terminal',
      'shell': 'terminal',
      'sql': 'database',
    };
    return iconMap[lang] || 'code';
  }

  override trackField(index: number, field: CodeField): string {
    return field.id ?? `code-${index}-${field.filename || field.language || ''}`;
  }
}

