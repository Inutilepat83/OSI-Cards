/**
 * Design Patterns Module
 * 
 * This module provides reusable design pattern implementations for OSI Cards:
 * - Facade Pattern: Simplified APIs for complex subsystems
 * - Repository Pattern: Abstract data persistence
 * - Strategy Pattern: Interchangeable algorithms
 * - Circuit Breaker: Fault tolerance for external services
 * - Builder Pattern: Fluent configuration builders
 * - Observer Pattern: Event-driven communication
 * 
 * @example
 * ```typescript
 * import { 
 *   CircuitBreaker,
 *   createRepository,
 *   createEventChannel
 * } from 'osi-cards-lib';
 * ```
 */

export * from './circuit-breaker';
export * from './repository';
export * from './event-channel';
export * from './result';

