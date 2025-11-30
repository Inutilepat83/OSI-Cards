/**
 * Utilities for working with Web Workers
 */

export interface WorkerMessage<T = any> {
  type: string;
  payload?: T;
  requestId?: string;
}

export interface WorkerResponse<T = any> {
  type: string;
  payload?: T;
  error?: string;
  requestId?: string;
}

/**
 * Create a worker from a blob URL
 */
export function createWorkerFromFunction(fn: Function): Worker {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

/**
 * Create a worker from a file path
 */
export function createWorkerFromFile(path: string): Worker {
  return new Worker(new URL(path, import.meta.url), { type: 'module' });
}

/**
 * Send a message to a worker and wait for response
 */
export function sendWorkerMessage<TRequest, TResponse>(
  worker: Worker,
  message: WorkerMessage<TRequest>
): Promise<WorkerResponse<TResponse>> {
  return new Promise((resolve, reject) => {
    const requestId = message.requestId || `${Date.now()}-${Math.random()}`;
    message.requestId = requestId;

    const timeout = setTimeout(() => {
      worker.removeEventListener('message', handler);
      reject(new Error('Worker timeout'));
    }, 30000); // 30 second timeout

    const handler = (event: MessageEvent<WorkerResponse<TResponse>>) => {
      if (event.data.requestId === requestId) {
        clearTimeout(timeout);
        worker.removeEventListener('message', handler);
        
        if (event.data.type === 'ERROR') {
          reject(new Error(event.data.error || 'Worker error'));
        } else {
          resolve(event.data);
        }
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage(message);
  });
}










