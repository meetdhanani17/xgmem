export interface IStorageProvider {
  write(collection: string, id: string, data: any): Promise<void>;
  read<T>(collection: string, id: string): Promise<T | null>;
  readAll<T>(collection: string): Promise<T[]>;
  delete(collection: string, id: string): Promise<boolean>;
  createCollection(collection: string): Promise<void>;
  dropCollection(collection: string): Promise<void>;
}
