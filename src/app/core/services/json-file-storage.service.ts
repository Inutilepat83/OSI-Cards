/**
 * JSON File Storage Service
 *
 * Stub implementation for backward compatibility.
 * Apps should implement their own storage strategy.
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JsonFileStorageService {
  exportCard(card: any, filename: string): void {
    console.warn('JsonFileStorageService: Implement export functionality in your app');
    // Stub implementation
    const dataStr = JSON.stringify(card, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = filename;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  importCard(file: File): Promise<any> {
    console.warn('JsonFileStorageService: Implement import functionality in your app');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const card = JSON.parse(e.target.result);
          resolve(card);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  saveCard(card: any): any {
    console.warn('JsonFileStorageService: Implement save functionality in your app');
    return {
      pipe: () => ({
        subscribe: () => ({ unsubscribe: () => undefined }),
      }),
    };
  }

  loadAllCards(): any {
    console.warn('JsonFileStorageService: Implement loadAllCards functionality in your app');
    return {
      pipe: () => ({
        subscribe: () => ({ unsubscribe: () => undefined }),
      }),
    };
  }
}
