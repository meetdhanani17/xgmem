import { IEntity } from "../../core/interfaces/IEntity";
import {
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  SortOptions,
} from "../../core/interfaces/IFilterQuery";
import { BaseRepository } from "./BaseRepository";

export class EntityRepository extends BaseRepository<IEntity> {
  protected collectionName = "entities";

  protected applyFilter(documents: IEntity[], filter: FilterQuery): IEntity[] {
    return documents.filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
          return this.handleSpecialOperator(doc, key, value);
        } else {
          if (doc[key as keyof IEntity] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  protected applySort(documents: IEntity[], sort?: SortOptions): IEntity[] {
    if (!sort) return documents;

    return documents.sort((a, b) => {
      for (const [field, direction] of Object.entries(sort)) {
        const aValue = a[field as keyof IEntity];
        const bValue = b[field as keyof IEntity];

        if (aValue < bValue) return direction === 1 ? -1 : 1;
        if (aValue > bValue) return direction === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  protected applyPagination(
    documents: IEntity[],
    options: QueryOptions
  ): PaginatedResult<IEntity> {
    const { limit = 50, skip = 0 } = options;
    const total = documents.length;
    const data = documents.slice(skip, skip + limit);

    return {
      data,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  protected handleSpecialOperator(
    doc: IEntity,
    operator: string,
    value: any
  ): boolean {
    switch (operator) {
      case "$regex":
        return new RegExp(value as string).test(doc.name);
      case "$in":
        return (value as any[]).includes(doc.name);
      case "$or":
        return (value as FilterQuery[]).some((f) => this.matchesFilter(doc, f));
      case "$and":
        return (value as FilterQuery[]).every((f) =>
          this.matchesFilter(doc, f)
        );
      default:
        return true;
    }
  }

  private matchesFilter(doc: IEntity, filter: FilterQuery): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key.startsWith("$")) {
        return this.handleSpecialOperator(doc, key, value);
      } else {
        if (doc[key as keyof IEntity] !== value) {
          return false;
        }
      }
    }
    return true;
  }
}
