import { IDocument } from "./IDocument";

export interface IEntity extends IDocument {
  projectId: string;
  name: string;
  entityType: string;
}

export interface CreateEntityDto {
  name: string;
  entityType: string;
  observations?: string[];
}

export interface UpdateEntityDto {
  name?: string;
  entityType?: string;
}
