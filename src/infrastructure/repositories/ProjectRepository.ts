import { IProject } from "../../core/interfaces/IProject";
import {
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  SortOptions,
} from "../../core/interfaces/IFilterQuery";
import { BaseRepository } from "./BaseRepository";

export class ProjectRepository extends BaseRepository<IProject> {
  protected collectionName = "projects";

  protected applyFilter(
    documents: IProject[],
    filter: FilterQuery
  ): IProject[] {
    return documents.filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
          return this.handleSpecialOperator(doc, key, value);
        } else {
          if (doc[key as keyof IProject] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  protected applySort(documents: IProject[], sort?: SortOptions): IProject[] {
    if (!sort) return documents;

    return documents.sort((a, b) => {
      for (const [field, direction] of Object.entries(sort)) {
        const aValue = a[field as keyof IProject];
        const bValue = b[field as keyof IProject];

        if (aValue && bValue) {
          if (aValue < bValue) return direction === 1 ? -1 : 1;
          if (aValue > bValue) return direction === 1 ? 1 : -1;
        }
      }
      return 0;
    });
  }

  protected applyPagination(
    documents: IProject[],
    options: QueryOptions
  ): PaginatedResult<IProject> {
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
    doc: IProject,
    operator: string,
    value: any
  ): boolean {
    switch (operator) {
      case "$regex":
        return new RegExp(value as string).test(doc.name);
      default:
        return true;
    }
  }
}
