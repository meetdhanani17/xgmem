import { IRelationService } from "../../core/interfaces/IServices";
import { IRelation, CreateRelationDto } from "../../core/interfaces/IRelation";
import { IRepository } from "../../core/interfaces/IRepository";
import { IEntity } from "../../core/interfaces/IEntity";

export class RelationService implements IRelationService {
  constructor(
    private relationRepository: IRepository<IRelation>,
    private entityRepository: IRepository<IEntity>
  ) {}

  async createRelation(
    projectId: string,
    relationData: CreateRelationDto
  ): Promise<IRelation> {
    // Get entity IDs by name
    const fromEntityResult = await this.entityRepository.findMany(
      { projectId, name: relationData.fromEntityName },
      { limit: 1 }
    );
    const toEntityResult = await this.entityRepository.findMany(
      { projectId, name: relationData.toEntityName },
      { limit: 1 }
    );

    const fromEntity = fromEntityResult.data[0];
    const toEntity = toEntityResult.data[0];

    if (!fromEntity || !toEntity) {
      throw new Error(
        `Entity not found for relation: ${relationData.fromEntityName} -> ${relationData.toEntityName}`
      );
    }

    const fromEntityId = fromEntity._id;
    const toEntityId = toEntity._id;

    return await this.relationRepository.create({
      projectId,
      fromEntityId,
      toEntityId,
      relationType: relationData.relationType,
    });
  }

  async findRelationsByProject(projectId: string): Promise<IRelation[]> {
    const result = await this.relationRepository.findMany({ projectId });
    return result.data;
  }

  async findRelationsByEntity(entityId: string): Promise<IRelation[]> {
    const result = await this.relationRepository.findMany({
      $or: [{ fromEntityId: entityId }, { toEntityId: entityId }],
    });
    return result.data;
  }

  async findRelationsByEntities(entityIds: string[]): Promise<IRelation[]> {
    const result = await this.relationRepository.findMany({
      $or: [
        { fromEntityId: { $in: entityIds } },
        { toEntityId: { $in: entityIds } },
      ],
    });
    return result.data;
  }

  async deleteRelation(id: string): Promise<boolean> {
    return await this.relationRepository.delete(id);
  }

  async deleteRelationsByEntity(entityId: string): Promise<boolean> {
    const relations = await this.findRelationsByEntity(entityId);
    let success = true;

    for (const relation of relations) {
      const deleted = await this.relationRepository.delete(relation._id);
      if (!deleted) {
        success = false;
      }
    }

    return success;
  }
}
