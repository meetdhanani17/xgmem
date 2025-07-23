import { Container } from "./Container";
import { FileStorageProvider } from "../storage/FileStorageProvider";
import { EntityRepository } from "../repositories/EntityRepository";
import { ObservationRepository } from "../repositories/ObservationRepository";
import { RelationRepository } from "../repositories/RelationRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { EntityService } from "../../application/services/EntityService";
import { ObservationService } from "../../application/services/ObservationService";
import { RelationService } from "../../application/services/RelationService";
import { ProjectService } from "../../application/services/ProjectService";
import { ProjectMemoryApplication } from "../../application/ProjectMemoryApplication";

export class ApplicationSetup {
  static setup(container: Container): void {
    // Register storage provider
    container.registerSingleton(
      "storage",
      () => new FileStorageProvider("./memories/collections")
    );

    // Register repositories
    container.register(
      "entityRepository",
      () => new EntityRepository(container.resolve("storage"))
    );
    container.register(
      "observationRepository",
      () => new ObservationRepository(container.resolve("storage"))
    );
    container.register(
      "relationRepository",
      () => new RelationRepository(container.resolve("storage"))
    );
    container.register(
      "projectRepository",
      () => new ProjectRepository(container.resolve("storage"))
    );

    // Register services without circular dependencies
    container.register(
      "observationService",
      () => new ObservationService(container.resolve("observationRepository"))
    );

    container.register(
      "entityService",
      () =>
        new EntityService(
          container.resolve("entityRepository"),
          container.resolve("observationRepository"), // Pass repository instead of service
          container.resolve("relationRepository") // Pass repository instead of service
        )
    );

    container.register(
      "relationService",
      () =>
        new RelationService(
          container.resolve("relationRepository"),
          container.resolve("entityRepository") // Pass repository instead of service
        )
    );

    container.register(
      "projectService",
      () => new ProjectService(container.resolve("projectRepository"))
    );

    // Register main application
    container.register(
      "app",
      () =>
        new ProjectMemoryApplication(
          container.resolve("projectService"),
          container.resolve("entityService"),
          container.resolve("observationService"),
          container.resolve("relationService")
        )
    );
  }

  static async initializeCollections(container: Container): Promise<void> {
    const storage = container.resolve<FileStorageProvider>("storage");
    const collections = ["projects", "entities", "observations", "relations"];

    for (const collection of collections) {
      try {
        await storage.createCollection(collection);
        console.log(`Collection ${collection} initialized`);
      } catch (error) {
        console.log(`Collection ${collection} already exists`);
      }
    }
  }
}
