import { IDocument } from "./IDocument";

export interface IRelation extends IDocument {
  projectId: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
}

export interface CreateRelationDto {
  fromEntityName: string;
  toEntityName: string;
  relationType: string;
}
