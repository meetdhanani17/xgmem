export interface FilterQuery {
  [key: string]: any;
  $and?: FilterQuery[];
  $or?: FilterQuery[];
  $in?: any[];
  $regex?: string;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  page?: number;
  sort?: SortOptions;
  projection?: { [key: string]: 1 | 0 };
}

export interface SortOptions {
  [key: string]: 1 | -1;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectKnowledgeResult {
  entities: any[];
  observations: any[];
  relations: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
