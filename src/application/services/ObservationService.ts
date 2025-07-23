import { IObservationService } from "../../core/interfaces/IServices";
import { IObservation } from "../../core/interfaces/IObservation";
import { IRepository } from "../../core/interfaces/IRepository";

export class ObservationService implements IObservationService {
  constructor(private observationRepository: IRepository<IObservation>) {}

  async addObservations(
    entityId: string,
    observations: string[]
  ): Promise<IObservation[]> {
    const createdObservations: IObservation[] = [];

    for (const content of observations) {
      // Check if observation already exists
      const existing = await this.observationRepository.findMany(
        {
          entityId,
          content,
        },
        { limit: 1 }
      );

      if (existing.data.length === 0) {
        const observation = await this.observationRepository.create({
          entityId,
          content,
        });
        createdObservations.push(observation);
      }
    }

    return createdObservations;
  }

  async findObservationsByEntity(entityId: string): Promise<IObservation[]> {
    const result = await this.observationRepository.findMany({ entityId });
    return result.data;
  }

  async findObservationsByEntities(
    entityIds: string[]
  ): Promise<IObservation[]> {
    const result = await this.observationRepository.findMany({
      entityId: { $in: entityIds },
    });
    return result.data;
  }

  async removeObservations(
    entityId: string,
    observations: string[]
  ): Promise<boolean> {
    let success = true;

    for (const content of observations) {
      const existing = await this.observationRepository.findMany(
        {
          entityId,
          content,
        },
        { limit: 1 }
      );

      if (existing.data.length > 0) {
        const deleted = await this.observationRepository.delete(
          existing.data[0]._id
        );
        if (!deleted) {
          success = false;
        }
      }
    }

    return success;
  }

  async removeObservationsByEntity(entityId: string): Promise<boolean> {
    const observations = await this.findObservationsByEntity(entityId);
    let success = true;

    for (const observation of observations) {
      const deleted = await this.observationRepository.delete(observation._id);
      if (!deleted) {
        success = false;
      }
    }

    return success;
  }
}
