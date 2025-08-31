import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotificationService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class PrimeNgNotificationService implements NotificationService {
  constructor(private messageService: MessageService) {}

  showSuccess(message: string, title: string = 'Success'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 5000,
    });
  }

  showError(message: string, title: string = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 8000,
    });
  }

  showWarning(message: string, title: string = 'Warning'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 6000,
    });
  }

  showInfo(message: string, title: string = 'Info'): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 5000,
    });
  }

  clear(): void {
    this.messageService.clear();
  }
}
