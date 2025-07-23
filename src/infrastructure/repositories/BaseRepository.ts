import crypto from "crypto";
import { IDocument } from "../../core/interfaces/IDocument";
import {
  IRepository,
  IReadOnlyRepository,
  IWriteRepository,
} from "../../core/interfaces/IRepository";
import {
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  SortOptions,
} from "../../core/interfaces/IFilterQuery";
import { IStorageProvider } from "../../core/interfaces/IStorageProvider";

export abstract class BaseRepository<T extends IDocument>
  implements IRepository<T>
{
  protected abstract collectionName: string;
  protected storage: IStorageProvider;

  constructor(storage: IStorageProvider) {
    this.storage = storage;
  }

  async create(data: Omit<T, "_id" | "created_at" | "updated_at">): Promise<T> {
    const document: T = {
      _id: this.generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as T;

    await this.storage.write(this.collectionName, document._id, document);
    return document;
  }

  async findById(id: string): Promise<T | null> {
    return await this.storage.read<T>(this.collectionName, id);
  }

  async findMany(
    filter: FilterQuery,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const documents = await this.storage.readAll<T>(this.collectionName);
    const filtered = this.applyFilter(documents, filter);
    const sorted = this.applySort(filtered, options.sort);
    const paginated = this.applyPagination(sorted, options);

    return {
      data: paginated.data,
      pagination: paginated.pagination,
    };
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: T = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    } as T;

    await this.storage.write(this.collectionName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return await this.storage.delete(this.collectionName, id);
  }

  async exists(filter: FilterQuery): Promise<boolean> {
    const result = await this.findMany(filter, { limit: 1 });
    return result.data.length > 0;
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected abstract applyFilter(documents: T[], filter: FilterQuery): T[];
  protected abstract applySort(documents: T[], sort?: SortOptions): T[];
  protected abstract applyPagination(
    documents: T[],
    options: QueryOptions
  ): PaginatedResult<T>;

  protected getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  protected handleSpecialOperator(
    doc: T,
    operator: string,
    value: any
  ): boolean {
    switch (operator) {
      case "$regex":
        // Default implementation - override in specific repositories
        return true;
      case "$in":
        return (value as any[]).includes(doc._id);
      default:
        return true;
    }
  }
}
