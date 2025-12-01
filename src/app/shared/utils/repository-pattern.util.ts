/**
 * Repository pattern utilities
 * Abstracts data access logic from components
 */

export interface Repository<T, ID = string> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(entity: T): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  search(query: string): Promise<T[]>;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepository<T, ID = string> implements Repository<T, ID> {
  protected abstract storage: Map<ID, T> | T[];

  abstract findAll(): Promise<T[]>;
  abstract findById(id: ID): Promise<T | null>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: ID, entity: Partial<T>): Promise<T>;
  abstract delete(id: ID): Promise<void>;
  abstract search(query: string): Promise<T[]>;
}

/**
 * In-memory repository implementation
 */
export class InMemoryRepository<T extends { id: ID }, ID = string> extends BaseRepository<T, ID> {
  protected storage = new Map<ID, T>();

  async findAll(): Promise<T[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: ID): Promise<T | null> {
    return this.storage.get(id) || null;
  }

  async create(entity: T): Promise<T> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(id: ID, entity: Partial<T>): Promise<T> {
    const existing = this.storage.get(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }
    const updated = { ...existing, ...entity, id };
    this.storage.set(id, updated);
    return updated;
  }

  async delete(id: ID): Promise<void> {
    this.storage.delete(id);
  }

  async search(query: string): Promise<T[]> {
    const results: T[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entity of this.storage.values()) {
      const entityString = JSON.stringify(entity).toLowerCase();
      if (entityString.includes(lowerQuery)) {
        results.push(entity);
      }
    }

    return results;
  }
}
