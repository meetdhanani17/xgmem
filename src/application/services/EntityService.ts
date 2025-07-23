import { IEntityService } from "../../core/interfaces/IServices";
import {
  IEntity,
  CreateEntityDto,
  UpdateEntityDto,
} from "../../core/interfaces/IEntity";
import { IRepository } from "../../core/interfaces/IRepository";
import {
  QueryOptions,
  PaginatedResult,
} from "../../core/interfaces/IFilterQuery";
import { IObservation } from "../../core/interfaces/IObservation";

export class EntityService implements IEntityService {
  constructor(
    private entityRepository: IRepository<IEntity>,
    private observationRepository: IRepository<IObservation>,
    private relationRepository: IRepository<any> // Using any for now, will be IRelation
  ) {}

  async findById(id: string): Promise<IEntity | null> {
    return await this.entityRepository.findById(id);
  }

  async findByProject(
    projectId: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<IEntity>> {
    return await this.entityRepository.findMany({ projectId }, options);
  }

  async search(
    projectId: string,
    query: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<IEntity>> {
    return await this.entityRepository.findMany(
      {
        projectId,
        $or: [{ name: { $regex: query } }, { entityType: { $regex: query } }],
      },
      options
    );
  }

  async findByName(projectId: string, name: string): Promise<IEntity | null> {
    const result = await this.entityRepository.findMany(
      { projectId, name },
      { limit: 1 }
    );
    return result.data.length > 0 ? result.data[0] : null;
  }

  async create(
    projectId: string,
    entityData: CreateEntityDto
  ): Promise<IEntity> {
    // Create entity
    const entity = await this.entityRepository.create({
      projectId,
      name: entityData.name,
      entityType: entityData.entityType,
    });

    // Add initial observations if provided
    if (entityData.observations && entityData.observations.length > 0) {
      for (const observationText of entityData.observations) {
        await this.observationRepository.create({
          entityId: entity._id,
          content: observationText,
        });
      }
    }

    return entity;
  }

  async createMany(
    projectId: string,
    entities: CreateEntityDto[]
  ): Promise<IEntity[]> {
    const createdEntities: IEntity[] = [];

    for (const entityData of entities) {
      const entity = await this.create(projectId, entityData);
      createdEntities.push(entity);
    }

    return createdEntities;
  }

  async update(id: string, updates: UpdateEntityDto): Promise<IEntity | null> {
    return await this.entityRepository.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    // Cascade delete observations and relations
    const observations = await this.observationRepository.findMany({
      entityId: id,
    });
    for (const observation of observations.data) {
      await this.observationRepository.delete(observation._id);
    }

    const relations = await this.relationRepository.findMany({
      $or: [{ fromEntityId: id }, { toEntityId: id }],
    });
    for (const relation of relations.data) {
      await this.relationRepository.delete(relation._id);
    }

    return await this.entityRepository.delete(id);
  }
}
