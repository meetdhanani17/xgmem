import { IProjectService } from "../../core/interfaces/IServices";
import {
  IProject,
  CreateProjectDto,
  UpdateProjectDto,
} from "../../core/interfaces/IProject";
import { IRepository } from "../../core/interfaces/IRepository";
import {
  QueryOptions,
  PaginatedResult,
} from "../../core/interfaces/IFilterQuery";

export class ProjectService implements IProjectService {
  constructor(private projectRepository: IRepository<IProject>) {}

  async createProject(projectData: CreateProjectDto): Promise<IProject> {
    return await this.projectRepository.create({
      name: projectData.name,
      description: projectData.description,
    });
  }

  async findProject(id: string): Promise<IProject | null> {
    return await this.projectRepository.findById(id);
  }

  async listProjects(
    options?: QueryOptions
  ): Promise<PaginatedResult<IProject>> {
    return await this.projectRepository.findMany({}, options);
  }

  async updateProject(
    id: string,
    updates: UpdateProjectDto
  ): Promise<IProject | null> {
    return await this.projectRepository.update(id, updates);
  }

  async deleteProject(id: string): Promise<boolean> {
    return await this.projectRepository.delete(id);
  }
}
