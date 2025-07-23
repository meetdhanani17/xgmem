import { IProjectMemoryApplication } from "../core/interfaces/IServices";
import {
  IProjectService,
  IEntityService,
  IObservationService,
  IRelationService,
} from "../core/interfaces/IServices";
import { CreateEntityDto, IEntity } from "../core/interfaces/IEntity";
import { CreateProjectDto, IProject } from "../core/interfaces/IProject";
import {
  QueryOptions,
  ProjectKnowledgeResult,
} from "../core/interfaces/IFilterQuery";

export class ProjectMemoryApplication implements IProjectMemoryApplication {
  constructor(
    private _projectService: IProjectService,
    private _entityService: IEntityService,
    private _observationService: IObservationService,
    private _relationService: IRelationService
  ) {}

  // Expose services for direct access
  get projectService(): IProjectService {
    return this._projectService;
  }

  get entityService(): IEntityService {
    return this._entityService;
  }

  get observationService(): IObservationService {
    return this._observationService;
  }

  get relationService(): IRelationService {
    return this._relationService;
  }

  async createProjectWithEntities(
    projectData: CreateProjectDto,
    entities: CreateEntityDto[]
  ): Promise<{ project: IProject; entities: IEntity[] }> {
    // Create project
    const project = await this._projectService.createProject(projectData);

    // Create entities
    const createdEntities = await this._entityService.createMany(
      project._id,
      entities
    );

    return { project, entities: createdEntities };
  }

  async searchProjectKnowledge(
    projectId: string,
    query: string,
    options?: QueryOptions
  ): Promise<ProjectKnowledgeResult> {
    // Search entities
    const entities = await this._entityService.search(projectId, query, options);

    // Get entity IDs
    const entityIds = entities.data.map((e) => e._id);

    // Get observations for entities
    const observations =
      await this._observationService.findObservationsByEntities(entityIds);

    // Get relations for entities
    const relations = await this._relationService.findRelationsByEntities(
      entityIds
    );

    return {
      entities: entities.data,
      observations,
      relations,
      pagination: entities.pagination,
    };
  }
}
