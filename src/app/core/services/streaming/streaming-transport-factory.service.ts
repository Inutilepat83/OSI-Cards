/**
 * Streaming Transport Factory
 * 
 * Factory service for creating and managing streaming transports.
 * Supports protocol detection, fallback, and unified transport creation.
 * 
 * @since 2.0.0
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  StreamingTransport,
  StreamingProtocol,
  StreamingTransportFactory,
  StreamingTransportConfig
} from './streaming-transport.interface';
import { SseStreamingTransport } from './sse-streaming-transport.service';
import { FetchStreamingTransport } from './fetch-streaming-transport.service';
import { StreamProtocolError } from './streaming-errors';

/**
 * Protocol capability detection result
 */
export interface ProtocolCapabilities {
  sse: boolean;
  websocket: boolean;
  fetch: boolean;
  grpcWeb: boolean;
  compression: boolean;
  serviceWorker: boolean;
}

/**
 * Streaming Transport Factory Service
 * 
 * Creates streaming transports based on protocol type and environment capabilities.
 * Provides automatic protocol detection and fallback support.
 * 
 * @example
 * ```typescript
 * const factory = inject(StreamingTransportFactoryService);
 * 
 * // Auto-detect best protocol
 * const protocol = factory.detectBestProtocol();
 * const transport = factory.create(protocol);
 * 
 * // Or explicitly create a specific transport
 * const sseTransport = factory.create('sse');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class StreamingTransportFactoryService implements StreamingTransportFactory {
  private readonly sseTransport = inject(SseStreamingTransport);
  private readonly fetchTransport = inject(FetchStreamingTransport);
  
  // Cache for capabilities detection
  private capabilities?: ProtocolCapabilities;
  
  /**
   * Create a transport for the specified protocol
   */
  create(protocol: StreamingProtocol): StreamingTransport {
    switch (protocol) {
      case 'sse':
        return this.sseTransport;
      
      case 'fetch':
        return this.fetchTransport;
      
      case 'websocket':
        // WebSocket transport is created separately as it requires different lifecycle
        throw new StreamProtocolError(
          'WebSocket transport should be created via WebSocketStreamingTransport service',
          protocol
        );
      
      case 'grpc-web':
        throw new StreamProtocolError(
          'gRPC-Web transport not yet implemented',
          protocol
        );
      
      case 'long-polling':
        // Long polling can use fetch transport with special configuration
        return this.fetchTransport;
      
      default:
        throw new StreamProtocolError(
          `Unknown streaming protocol: ${protocol}`,
          protocol
        );
    }
  }
  
  /**
   * Create a transport that auto-connects to the specified URL
   */
  createAndConnect(
    protocol: StreamingProtocol, 
    config: StreamingTransportConfig
  ): Observable<StreamingTransport> {
    try {
      const transport = this.create(protocol);
      return new Observable(observer => {
        transport.connect(config).subscribe({
          next: () => {
            observer.next(transport);
            observer.complete();
          },
          error: err => observer.error(err)
        });
      });
    } catch (err) {
      return throwError(() => err);
    }
  }
  
  /**
   * Create transport with automatic protocol fallback
   */
  createWithFallback(
    config: StreamingTransportConfig,
    preferredProtocols: StreamingProtocol[] = ['websocket', 'sse', 'fetch']
  ): Observable<StreamingTransport> {
    return new Observable(observer => {
      let protocolIndex = 0;
      
      const tryNextProtocol = () => {
        if (protocolIndex >= preferredProtocols.length) {
          observer.error(new StreamProtocolError(
            'All streaming protocols failed',
            preferredProtocols.join(', ')
          ));
          return;
        }
        
        const protocol = preferredProtocols[protocolIndex];
        protocolIndex++;
        
        if (!protocol || !this.isSupported(protocol)) {
          tryNextProtocol();
          return;
        }
        
        try {
          const transport = this.create(protocol);
          transport.connect(config).subscribe({
            next: () => {
              observer.next(transport);
              observer.complete();
            },
            error: () => {
              // Try next protocol
              tryNextProtocol();
            }
          });
        } catch {
          tryNextProtocol();
        }
      };
      
      tryNextProtocol();
    });
  }
  
  /**
   * Detect the best available protocol for current environment
   */
  detectBestProtocol(): StreamingProtocol {
    const caps = this.getCapabilities();
    
    // Prefer WebSocket for bidirectional, but check if server supports it
    // For LLM streaming, SSE or Fetch is usually better (server push only)
    
    // For most LLM streaming scenarios, Fetch with ReadableStream is best
    if (caps.fetch) {
      return 'fetch';
    }
    
    // SSE is widely supported and has built-in reconnection
    if (caps.sse) {
      return 'sse';
    }
    
    // WebSocket as fallback (though it's overkill for unidirectional streaming)
    if (caps.websocket) {
      return 'websocket';
    }
    
    // Last resort
    return 'long-polling';
  }
  
  /**
   * Check if a protocol is supported in current environment
   */
  isSupported(protocol: StreamingProtocol): boolean {
    const caps = this.getCapabilities();
    
    switch (protocol) {
      case 'sse':
        return caps.sse;
      case 'websocket':
        return caps.websocket;
      case 'fetch':
        return caps.fetch;
      case 'grpc-web':
        return caps.grpcWeb;
      case 'long-polling':
        return true; // Always supported via fetch
      default:
        return false;
    }
  }
  
  /**
   * Get environment capabilities
   */
  getCapabilities(): ProtocolCapabilities {
    if (!this.capabilities) {
      this.capabilities = this.detectCapabilities();
    }
    return this.capabilities;
  }
  
  /**
   * Reset capabilities cache (useful for testing)
   */
  resetCapabilitiesCache(): void {
    this.capabilities = undefined;
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  private detectCapabilities(): ProtocolCapabilities {
    const isBrowser = typeof window !== 'undefined';
    
    return {
      sse: isBrowser && typeof EventSource !== 'undefined',
      websocket: isBrowser && typeof WebSocket !== 'undefined',
      fetch: isBrowser && typeof fetch !== 'undefined' && this.hasReadableStream(),
      grpcWeb: false, // Would require checking for grpc-web library
      compression: isBrowser && typeof CompressionStream !== 'undefined',
      serviceWorker: isBrowser && 'serviceWorker' in navigator
    };
  }
  
  private hasReadableStream(): boolean {
    try {
      // Check if ReadableStream is available and supports async iteration
      return typeof ReadableStream !== 'undefined' &&
             typeof ReadableStream.prototype.getReader === 'function';
    } catch {
      return false;
    }
  }
}

/**
 * Provider function for configuring streaming transport
 */
export function provideStreamingTransport(config?: {
  defaultProtocol?: StreamingProtocol;
  enableCompression?: boolean;
}): { provide: typeof StreamingTransportFactoryService; useClass: typeof StreamingTransportFactoryService }[] {
  return [
    { provide: StreamingTransportFactoryService, useClass: StreamingTransportFactoryService }
  ];
}

