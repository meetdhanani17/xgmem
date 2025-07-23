import { FilterQuery, QueryOptions, PaginatedResult } from "./IFilterQuery";
import { IDocument } from "./IDocument";

export interface IReadOnlyRepository<T extends IDocument> {
  findById(id: string): Promise<T | null>;
  findMany(
    filter: FilterQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;
  exists(filter: FilterQuery): Promise<boolean>;
}

export interface IWriteRepository<T extends IDocument> {
  create(data: Omit<T, "_id" | "created_at" | "updated_at">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRepository<T extends IDocument>
  extends IReadOnlyRepository<T>,
    IWriteRepository<T> {}
