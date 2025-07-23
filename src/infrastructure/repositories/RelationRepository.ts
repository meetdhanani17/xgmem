import { IRelation } from "../../core/interfaces/IRelation";
import {
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  SortOptions,
} from "../../core/interfaces/IFilterQuery";
import { BaseRepository } from "./BaseRepository";

export class RelationRepository extends BaseRepository<IRelation> {
  protected collectionName = "relations";

  protected applyFilter(
    documents: IRelation[],
    filter: FilterQuery
  ): IRelation[] {
    return documents.filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
          return this.handleSpecialOperator(doc, key, value);
        } else {
          if (doc[key as keyof IRelation] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  protected applySort(documents: IRelation[], sort?: SortOptions): IRelation[] {
    if (!sort) return documents;

    return documents.sort((a, b) => {
      for (const [field, direction] of Object.entries(sort)) {
        const aValue = a[field as keyof IRelation];
        const bValue = b[field as keyof IRelation];

        if (aValue < bValue) return direction === 1 ? -1 : 1;
        if (aValue > bValue) return direction === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  protected applyPagination(
    documents: IRelation[],
    options: QueryOptions
  ): PaginatedResult<IRelation> {
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
    doc: IRelation,
    operator: string,
    value: any
  ): boolean {
    switch (operator) {
      case "$in":
        return (
          (value as any[]).includes(doc.fromEntityId) ||
          (value as any[]).includes(doc.toEntityId)
        );
      default:
        return true;
    }
  }
}
