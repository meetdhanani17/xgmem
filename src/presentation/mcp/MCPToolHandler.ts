import { IProjectMemoryApplication } from "../../core/interfaces/IServices";

export class MCPToolHandler {
  constructor(private app: IProjectMemoryApplication) {}

  async handleListProjects(): Promise<string> {
    const projects = await this.app.projectService.listProjects();
    return JSON.stringify(projects, null, 2);
  }

  async handleCreateEntities(args: any): Promise<string> {
    const entities = await this.app.entityService.createMany(
      args.projectId,
      args.entities
    );
    return JSON.stringify(entities, null, 2);
  }

  async handleCreateRelations(args: any): Promise<string> {
    const relations = [];
    for (const relationData of args.relations) {
      const relation = await this.app.relationService.createRelation(
        args.projectId,
        relationData
      );
      relations.push(relation);
    }
    return JSON.stringify(relations, null, 2);
  }

  async handleSearchNodes(args: any): Promise<string> {
    const options: any = { limit: args.limit || 50 };
    if (args.page) {
      options.skip = (args.page - 1) * (args.limit || 50);
    }
    
    const result = await this.app.searchProjectKnowledge(
      args.projectId,
      args.query,
      options
    );
    return JSON.stringify(result, null, 2);
  }

  async handleReadGraph(args: any): Promise<string> {
    const entities = await this.app.entityService.findByProject(args.projectId);
    const entityIds = entities.data.map((e) => e._id);
    const observations =
      await this.app.observationService.findObservationsByEntities(entityIds);
    const relations = await this.app.relationService.findRelationsByEntities(
      entityIds
    );

    const graph = {
      entities: entities.data,
      observations,
      relations,
    };

    return JSON.stringify(graph, null, 2);
  }

  async handleAddObservations(args: any): Promise<string> {
    const results = [];
    for (const obs of args.observations) {
      const entity = await this.app.entityService.findById(obs.entityId);
      if (!entity) {
        throw new Error(`Entity with ID ${obs.entityId} not found`);
      }

      const addedObservations =
        await this.app.observationService.addObservations(
          obs.entityId,
          obs.contents
        );

      results.push({
        entityId: obs.entityId,
        addedObservations: addedObservations.map((o) => o.content),
      });
    }

    return JSON.stringify(results, null, 2);
  }

  async handleDeleteEntities(args: any): Promise<string> {
    let deletedCount = 0;
    for (const entityName of args.entityNames) {
      const entity = await this.app.entityService.findByName(args.projectId, entityName);
      if (entity) {
        const deleted = await this.app.entityService.delete(entity._id);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    return JSON.stringify({ deletedCount }, null, 2);
  }

  async handleCopyMemory(args: any): Promise<string> {
    // Get entities from source project
    const sourceEntities = await this.app.entityService.findByProject(
      args.sourceProjectId
    );
    const entitiesToCopy = sourceEntities.data.filter((e) =>
      args.entityNames.includes(e.name)
    );

    // Create entities in target project
    const createdEntities = [];
    for (const entity of entitiesToCopy) {
      const newEntity = await this.app.entityService.create(
        args.targetProjectId,
        {
          name: entity.name,
          entityType: entity.entityType,
        }
      );
      createdEntities.push(newEntity);
    }

    return JSON.stringify({ copiedEntities: createdEntities.length }, null, 2);
  }
}
