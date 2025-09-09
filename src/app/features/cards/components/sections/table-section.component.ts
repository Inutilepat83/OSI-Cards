import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection, TableColumn, TableRow } from '../../../../models/card.model';

@Component({
  selector: 'app-table-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-section.component.html',
  styleUrls: ['./table-section.component.css']
})
export class TableSectionComponent {
  @Input() section!: CardSection;
  @Input() sortable = true;
  @Input() striped = true;
  @Input() responsive = true;
  @Output() rowInteraction = new EventEmitter<{ row: TableRow; section: CardSection; action: string }>();
  @Output() cellInteraction = new EventEmitter<{ row: TableRow; column: TableColumn; value: any; section: CardSection; action: string }>();

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  get columns(): TableColumn[] {
    return this.section.tableColumns || [];
  }

  get rows(): TableRow[] {
    const rows = this.section.tableRows || [];
    
    if (this.sortColumn) {
      return [...rows].sort((a, b) => {
        const aVal = a[this.sortColumn!];
        const bVal = b[this.sortColumn!];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    return rows;
  }

  trackByRowFn(index: number, item: TableRow): string {
    return item.id || index.toString();
  }

  trackByColumnFn(index: number, item: TableColumn): string {
    return item.key;
  }

  onSort(column: TableColumn): void {
    if (!this.sortable || !column.sortable) return;
    
    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }
  }

  onRowClick(row: TableRow): void {
    this.rowInteraction.emit({
      row: row,
      section: this.section,
      action: 'click'
    });
  }

  onCellClick(row: TableRow, column: TableColumn, value: any): void {
    this.cellInteraction.emit({
      row: row,
      column: column,
      value: value,
      section: this.section,
      action: 'click'
    });
  }

  formatCellValue(value: unknown, column: TableColumn): unknown {
    if (value === null || value === undefined) return '';
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      
      case 'percentage':
        return `${value}%`;
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      
      case 'date': {
        const date = new Date(value as string | number | Date);
        return date.toLocaleDateString('en-US');
      }
      
      default:
        return String(value);
    }
  }

  getCellClass(value: unknown, column: TableColumn): string {
    const classes = ['table-cell'];
    
    if (column.type === 'status') {
      classes.push(`status-${String(value).toLowerCase()}`);
    }
    
    if (column.align) {
      classes.push(`text-${column.align}`);
    }
    
    return classes.join(' ');
  }

  getSortIcon(column: TableColumn): string {
    if (!this.sortable || !column.sortable || this.sortColumn !== column.key) {
      return 'fas fa-sort';
    }
    
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
}
