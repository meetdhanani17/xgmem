import {
  QueryOptions,
  PaginatedResult,
  ProjectKnowledgeResult,
} from "./IFilterQuery";
import { IEntity, CreateEntityDto, UpdateEntityDto } from "./IEntity";
import { IObservation } from "./IObservation";
import { IRelation, CreateRelationDto } from "./IRelation";
import { IProject, CreateProjectDto, UpdateProjectDto } from "./IProject";

// Entity Service Interfaces
export interface IEntityQueryService {
  findById(id: string): Promise<IEntity | null>;
  findByProject(
    projectId: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<IEntity>>;
  search(
    projectId: string,
    query: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<IEntity>>;
  findByName(projectId: string, name: string): Promise<IEntity | null>;
}

export interface IEntityCommandService {
  create(projectId: string, entityData: CreateEntityDto): Promise<IEntity>;
  createMany(
    projectId: string,
    entities: CreateEntityDto[]
  ): Promise<IEntity[]>;
  update(id: string, updates: UpdateEntityDto): Promise<IEntity | null>;
  delete(id: string): Promise<boolean>;
}

export interface IEntityService
  extends IEntityQueryService,
    IEntityCommandService {}

// Observation Service Interfaces
export interface IObservationService {
  addObservations(
    entityId: string,
    observations: string[]
  ): Promise<IObservation[]>;
  findObservationsByEntity(entityId: string): Promise<IObservation[]>;
  findObservationsByEntities(entityIds: string[]): Promise<IObservation[]>;
  removeObservations(
    entityId: string,
    observations: string[]
  ): Promise<boolean>;
  removeObservationsByEntity(entityId: string): Promise<boolean>;
}

// Relation Service Interfaces
export interface IRelationService {
  createRelation(
    projectId: string,
    relationData: CreateRelationDto
  ): Promise<IRelation>;
  findRelationsByProject(projectId: string): Promise<IRelation[]>;
  findRelationsByEntity(entityId: string): Promise<IRelation[]>;
  findRelationsByEntities(entityIds: string[]): Promise<IRelation[]>;
  deleteRelation(id: string): Promise<boolean>;
  deleteRelationsByEntity(entityId: string): Promise<boolean>;
}

// Project Service Interfaces
export interface IProjectService {
  createProject(projectData: CreateProjectDto): Promise<IProject>;
  findProject(id: string): Promise<IProject | null>;
  listProjects(options?: QueryOptions): Promise<PaginatedResult<IProject>>;
  updateProject(
    id: string,
    updates: UpdateProjectDto
  ): Promise<IProject | null>;
  deleteProject(id: string): Promise<boolean>;
}

// Main Application Interface
export interface IProjectMemoryApplication {
  // Services for direct access
  projectService: IProjectService;
  entityService: IEntityService;
  observationService: IObservationService;
  relationService: IRelationService;

  createProjectWithEntities(
    projectData: CreateProjectDto,
    entities: CreateEntityDto[]
  ): Promise<{ project: IProject; entities: IEntity[] }>;

  searchProjectKnowledge(
    projectId: string,
    query: string,
    options?: QueryOptions
  ): Promise<ProjectKnowledgeResult>;
}
