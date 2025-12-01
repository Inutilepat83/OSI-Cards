import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Kanban card/task item
 */
export interface KanbanCard extends CardItem {
  /** Column/status this card belongs to */
  column?: string;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** Assignee name */
  assignee?: string;
  /** Assignee avatar URL */
  assigneeAvatar?: string;
  /** Due date */
  dueDate?: string;
  /** Tags/labels */
  tags?: string[];
  /** Progress percentage (0-100) */
  progress?: number;
  /** Subtask count */
  subtasks?: { completed: number; total: number };
  /** Comments count */
  comments?: number;
  /** Attachments count */
  attachments?: number;
}

/**
 * Kanban column definition
 */
export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  limit?: number;
}

/**
 * Kanban Section Component
 *
 * Displays items in a kanban board format with columns
 * representing different stages/statuses.
 *
 * @example
 * ```html
 * <app-kanban-section [section]="kanbanSection"></app-kanban-section>
 * ```
 */
@Component({
  selector: 'app-kanban-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './kanban-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSectionComponent extends BaseSectionComponent<KanbanCard> {
  /** Kanban sections need full width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 4,
    minColumns: 2,
    maxColumns: 4,
  };

  /** Default columns if not specified in section */
  private readonly defaultColumns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', color: '#94a3b8' },
    { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'review', title: 'Review', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' }
  ];

  /** Collapsed columns */
  collapsedColumns = signal<Set<string>>(new Set());

  get items(): KanbanCard[] {
    return super.getItems() as KanbanCard[];
  }

  /**
   * Get columns from section metadata or use defaults
   */
  get columns(): KanbanColumn[] {
    const sectionColumns = this.section.meta?.['columns'] as KanbanColumn[] | undefined;
    if (sectionColumns && Array.isArray(sectionColumns)) {
      return sectionColumns;
    }

    // Auto-detect columns from items
    const columnSet = new Set<string>();
    this.items.forEach(item => {
      if (item.column) columnSet.add(item.column);
    });

    if (columnSet.size > 0) {
      return Array.from(columnSet).map(col => ({
        id: col.toLowerCase().replace(/\s+/g, '-'),
        title: col
      }));
    }

    return this.defaultColumns;
  }

  /**
   * Get cards for a specific column
   */
  getColumnCards(column: KanbanColumn): KanbanCard[] {
    return this.items.filter(item => {
      const itemColumn = item.column?.toLowerCase().replace(/\s+/g, '-');
      return itemColumn === column.id || item.column === column.title;
    });
  }

  /**
   * Get card count for column
   */
  getColumnCount(column: KanbanColumn): number {
    return this.getColumnCards(column).length;
  }

  /**
   * Check if column is at or over limit
   */
  isColumnAtLimit(column: KanbanColumn): boolean {
    if (!column.limit) return false;
    return this.getColumnCount(column) >= column.limit;
  }

  /**
   * Toggle column collapsed state
   */
  toggleColumn(columnId: string): void {
    this.collapsedColumns.update(set => {
      const newSet = new Set(set);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }

  /**
   * Check if column is collapsed
   */
  isCollapsed(columnId: string): boolean {
    return this.collapsedColumns().has(columnId);
  }

  /**
   * Get priority class
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    return `kanban-card--priority-${priority}`;
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'urgent': return 'alert-circle';
      case 'high': return 'arrow-up';
      case 'medium': return 'minus';
      case 'low': return 'arrow-down';
      default: return '';
    }
  }

  /**
   * Format due date
   */
  formatDueDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  /**
   * Check if due date is overdue
   */
  isOverdue(dateStr?: string): boolean {
    if (!dateStr) return false;
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  }

  /**
   * Get initials for avatar fallback
   */
  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  onCardClick(card: KanbanCard): void {
    this.emitItemInteraction(card, {
      sectionTitle: this.section.title,
      column: card.column,
      priority: card.priority
    });
  }

  override trackItem(index: number, item: KanbanCard): string {
    return item.id ?? `kanban-${index}-${item.title || ''}`;
  }
}

