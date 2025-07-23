import { IObservation } from "../../core/interfaces/IObservation";
import {
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  SortOptions,
} from "../../core/interfaces/IFilterQuery";
import { BaseRepository } from "./BaseRepository";

export class ObservationRepository extends BaseRepository<IObservation> {
  protected collectionName = "observations";

  protected applyFilter(
    documents: IObservation[],
    filter: FilterQuery
  ): IObservation[] {
    return documents.filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
          return this.handleSpecialOperator(doc, key, value);
        } else {
          if (doc[key as keyof IObservation] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  protected applySort(
    documents: IObservation[],
    sort?: SortOptions
  ): IObservation[] {
    if (!sort) return documents;

    return documents.sort((a, b) => {
      for (const [field, direction] of Object.entries(sort)) {
        const aValue = a[field as keyof IObservation];
        const bValue = b[field as keyof IObservation];

        if (aValue < bValue) return direction === 1 ? -1 : 1;
        if (aValue > bValue) return direction === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  protected applyPagination(
    documents: IObservation[],
    options: QueryOptions
  ): PaginatedResult<IObservation> {
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
    doc: IObservation,
    operator: string,
    value: any
  ): boolean {
    switch (operator) {
      case "$in":
        return (value as any[]).includes(doc.entityId);
      case "$regex":
        return new RegExp(value as string).test(doc.content);
      default:
        return true;
    }
  }
}
