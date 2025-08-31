import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  OfflineSupportService,
  SyncStatus,
  OfflineQueueItem,
} from '../../core/services/offline-support.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-dashboard">
      <div class="dashboard-header">
        <h2>Offline Status</h2>
        <div class="status-badge" [class]="syncStatus?.isOnline ? 'online' : 'offline'">
          {{ syncStatus?.isOnline ? 'Online' : 'Offline' }}
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Connection Status -->
        <div class="status-card">
          <h3>Connection Status</h3>
          <div class="status-details">
            <div class="status-item">
              <span class="label">Network:</span>
              <span class="value" [class]="syncStatus?.isOnline ? 'online' : 'offline'">
                {{ syncStatus?.isOnline ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">Background Sync:</span>
              <span
                class="value"
                [class]="syncStatus?.backgroundSyncEnabled ? 'enabled' : 'disabled'"
              >
                {{ syncStatus?.backgroundSyncEnabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">Last Sync:</span>
              <span class="value">
                {{
                  syncStatus?.lastSyncTime ? (syncStatus!.lastSyncTime | date: 'short') : 'Never'
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Sync Queue -->
        <div class="queue-card">
          <h3>Pending Requests ({{ syncStatus?.pendingItems || 0 }})</h3>
          <div class="queue-actions">
            <button
              class="btn btn-primary"
              (click)="forceSync()"
              [disabled]="!syncStatus?.isOnline || syncStatus?.isSyncing"
            >
              {{ syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now' }}
            </button>
            <button
              class="btn btn-secondary"
              (click)="clearQueue()"
              [disabled]="syncStatus?.pendingItems === 0"
            >
              Clear Queue
            </button>
          </div>

          <div class="queue-list" *ngIf="queueItems.length > 0">
            <div class="queue-item" *ngFor="let item of queueItems">
              <div class="item-info">
                <span class="method" [class]="item.method.toLowerCase()">{{ item.method }}</span>
                <span class="url">{{ item.url }}</span>
                <span class="priority" [class]="item.priority">{{ item.priority }}</span>
              </div>
              <div class="item-meta">
                <span class="timestamp">{{ item.timestamp | date: 'short' }}</span>
                <span class="retries">Retry: {{ item.retryCount }}/{{ item.maxRetries }}</span>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="queueItems.length === 0">
            <i class="pi pi-check-circle"></i>
            <p>No pending requests</p>
          </div>
        </div>

        <!-- Cache Status -->
        <div class="cache-card">
          <h3>Cache Status</h3>
          <div class="cache-details">
            <div class="cache-item">
              <span class="label">Cached Entries:</span>
              <span class="value">{{ cacheStats.totalEntries }}</span>
            </div>
            <div class="cache-item">
              <span class="label">Cache Size:</span>
              <span class="value">{{ formatBytes(cacheStats.totalSize) }}</span>
            </div>
            <div class="cache-item">
              <span class="label">Storage Quota:</span>
              <span class="value">{{ formatBytes(syncStatus?.storageQuota || 0) }}</span>
            </div>
          </div>

          <div class="cache-actions">
            <button class="btn btn-secondary" (click)="clearCache()">Clear Cache</button>
          </div>
        </div>

        <!-- Background Sync Controls -->
        <div class="controls-card">
          <h3>Background Sync</h3>
          <div class="control-item">
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="syncStatus?.backgroundSyncEnabled"
                (change)="toggleBackgroundSync($event)"
              />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Enable background sync</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .offline-dashboard {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      .dashboard-header h2 {
        margin: 0;
        color: #333;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
      }

      .status-badge.online {
        background: #4caf50;
        color: white;
      }

      .status-badge.offline {
        background: #f44336;
        color: white;
      }

      .dashboard-content {
        display: grid;
        gap: 20px;
      }

      .status-card,
      .queue-card,
      .cache-card,
      .controls-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .status-card h3,
      .queue-card h3,
      .cache-card h3,
      .controls-card h3 {
        margin: 0 0 15px 0;
        color: #333;
      }

      .status-details,
      .cache-details {
        display: grid;
        gap: 10px;
      }

      .status-item,
      .cache-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-item .label,
      .cache-item .label {
        font-weight: 500;
        color: #666;
      }

      .status-item .value {
        font-weight: 600;
      }

      .status-item .value.online {
        color: #4caf50;
      }

      .status-item .value.offline {
        color: #f44336;
      }

      .status-item .value.enabled {
        color: #2196f3;
      }

      .status-item .value.disabled {
        color: #666;
      }

      .queue-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #1976d2;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #1565c0;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e0e0e0;
      }

      .queue-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .queue-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .method {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .method.get {
        background: #4caf50;
        color: white;
      }
      .method.post {
        background: #2196f3;
        color: white;
      }
      .method.put {
        background: #ff9800;
        color: white;
      }
      .method.delete {
        background: #f44336;
        color: white;
      }

      .url {
        font-family: monospace;
        font-size: 14px;
        color: #666;
      }

      .priority {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .priority.high {
        background: #ffebee;
        color: #c62828;
      }
      .priority.normal {
        background: #e3f2fd;
        color: #1565c0;
      }
      .priority.low {
        background: #f3e5f5;
        color: #6a1b9a;
      }

      .item-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 12px;
        color: #666;
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .empty-state .pi {
        font-size: 48px;
        color: #4caf50;
        margin-bottom: 10px;
      }

      .cache-actions {
        margin-top: 15px;
      }

      .control-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toggle {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.4s;
        border-radius: 24px;
      }

      .toggle-slider:before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: #2196f3;
      }

      input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }

      .toggle-label {
        font-weight: 500;
        color: #333;
      }

      @media (max-width: 768px) {
        .offline-dashboard {
          padding: 10px;
        }

        .dashboard-header {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }

        .queue-actions {
          flex-direction: column;
        }

        .queue-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }

        .item-meta {
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class OfflineDashboardComponent implements OnInit, OnDestroy {
  syncStatus: SyncStatus | null = null;
  queueItems: OfflineQueueItem[] = [];
  cacheStats = { totalEntries: 0, totalSize: 0, hitRate: 0 };
  private subscription: Subscription = new Subscription();

  constructor(private offlineService: OfflineSupportService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.offlineService.getSyncStatus$().subscribe(status => {
        this.syncStatus = status;
        this.updateQueueItems();
        this.updateCacheStats();
      })
    );

    this.updateQueueItems();
    this.updateCacheStats();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  forceSync(): void {
    this.offlineService.forceSync();
  }

  clearQueue(): void {
    if (confirm('Are you sure you want to clear all pending requests?')) {
      this.offlineService.clearOfflineQueue();
      this.updateQueueItems();
    }
  }

  clearCache(): void {
    if (confirm('Are you sure you want to clear all cached data?')) {
      this.offlineService.clearAllCache();
      this.updateCacheStats();
    }
  }

  toggleBackgroundSync(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.offlineService.enableBackgroundSync();
    } else {
      this.offlineService.disableBackgroundSync();
    }
  }

  private updateQueueItems(): void {
    this.queueItems = this.offlineService.getOfflineQueue();
  }

  private updateCacheStats(): void {
    this.cacheStats = this.offlineService.getCacheStats();
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
