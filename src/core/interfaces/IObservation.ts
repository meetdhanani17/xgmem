import { IDocument } from "./IDocument";

export interface IObservation extends IDocument {
  entityId: string;
  content: string;
}

export interface CreateObservationDto {
  entityId: string;
  content: string;
}
