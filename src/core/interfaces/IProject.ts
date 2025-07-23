import { IDocument } from "./IDocument";

export interface IProject extends IDocument {
  name: string;
  description?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}
