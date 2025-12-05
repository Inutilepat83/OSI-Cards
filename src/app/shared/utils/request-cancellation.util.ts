/**
 * Request Cancellation Utility
 * Stub for backward compatibility
 */

import { Subject } from 'rxjs';

export class RequestCanceller {
  cancel$ = new Subject<void>();

  cancel(): void {
    console.warn('RequestCanceller: Implement in your app');
    this.cancel$.next();
  }
}

export function createCancellableRequest(): RequestCanceller {
  return new RequestCanceller();
}
