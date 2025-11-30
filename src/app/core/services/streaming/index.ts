/**
 * Streaming Services Module
 * 
 * Exports all streaming-related services, interfaces, and utilities.
 * 
 * @since 2.0.0
 */

// Interfaces
export * from './streaming-transport.interface';

// Error types
export * from './streaming-errors';

// State machine
export * from './streaming-state-machine';

// JSON parser
export { 
  StreamingJsonParser,
  ParsedResult,
  ParserState,
  parseStreamingChunks,
  parseStreamingJson
} from './streaming-json-parser.service';

// Transport implementations
export { SseStreamingTransport } from './sse-streaming-transport.service';
export { FetchStreamingTransport } from './fetch-streaming-transport.service';
export { 
  WebSocketStreamingTransport,
  WebSocketMessage,
  WebSocketMessageType
} from './websocket-streaming-transport.service';

// Worker service
export { 
  StreamingWorkerService,
  WorkerStatus,
  WorkerConfig
} from './streaming-worker.service';

// Worker types (for advanced usage)
export type {
  WorkerMessage,
  WorkerResponse,
  WorkerMessageType,
  ParseJsonPayload,
  ParseJsonResult,
  ParseChunkPayload,
  ParseChunkResult,
  DiffCardsPayload,
  DiffCardsResult,
  ValidateCardPayload,
  ValidateCardResult,
  ExtractSectionsPayload,
  ExtractSectionsResult
} from './streaming-worker';

// Factory
export { 
  StreamingTransportFactoryService,
  ProtocolCapabilities,
  provideStreamingTransport
} from './streaming-transport-factory.service';

// Progress tracking
export {
  StreamingProgressService,
  StreamingProgress,
  SectionProgress,
  StreamingProgressStage,
  ProgressUpdate,
  formatProgress
} from './streaming-progress.service';

// Mock/Test utilities
export {
  MockStreamingService,
  MockChunk,
  MockStreamingConfig,
  createMockStreamingService,
  generateMockChunks,
  assertStateTransitions,
  waitForStreamingComplete,
  collectChunks
} from './mock-streaming.service';

// Orchestrator (high-level API)
export {
  StreamingOrchestratorService,
  StreamingOrchestratorConfig,
  CardStreamUpdate,
  StreamingSession
} from './streaming-orchestrator.service';

