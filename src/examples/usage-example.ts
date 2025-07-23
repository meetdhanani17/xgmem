import { Container } from "../infrastructure/dependency-injection/Container";
import { ApplicationSetup } from "../infrastructure/dependency-injection/ApplicationSetup";
import { IProjectMemoryApplication } from "../core/interfaces/IServices";
import { CreateEntityDto } from "../core/interfaces/IEntity";
import { CreateProjectDto } from "../core/interfaces/IProject";

async function example() {
  // Setup the application
  const container = new Container();
  ApplicationSetup.setup(container);
  await ApplicationSetup.initializeCollections(container);

  // Get the main application
  const app = container.resolve<IProjectMemoryApplication>("app");

  // Example 1: Create a project with entities
  console.log("Creating project with entities...");
  const projectData: CreateProjectDto = {
    name: "E-commerce Website",
    description: "A modern e-commerce platform",
  };

  const entities: CreateEntityDto[] = [
    {
      name: "User Authentication",
      entityType: "Feature",
      observations: [
        "JWT token-based authentication",
        "Social login support",
        "Password reset functionality",
      ],
    },
    {
      name: "Product Catalog",
      entityType: "Feature",
      observations: [
        "Product listing with filters",
        "Search functionality",
        "Category organization",
      ],
    },
    {
      name: "Shopping Cart",
      entityType: "Feature",
      observations: [
        "Add/remove items",
        "Quantity management",
        "Price calculation",
      ],
    },
    {
      name: "Database Schema",
      entityType: "Infrastructure",
      observations: [
        "PostgreSQL database",
        "User table with email/password",
        "Product table with categories",
      ],
    },
  ];

  const result = await app.createProjectWithEntities(projectData, entities);
  console.log("Created project:", result.project.name);
  console.log("Created entities:", result.entities.length);

  // Example 2: Search for entities
  console.log("\nSearching for authentication-related entities...");
  const searchResults = await app.searchProjectKnowledge(
    result.project._id,
    "authentication",
    { limit: 10 }
  );

  console.log("Search results:");
  searchResults.entities.forEach((entity) => {
    console.log(`- ${entity.name} (${entity.entityType})`);
  });

  // Example 3: Get the full knowledge graph
  console.log("\nReading full knowledge graph...");
  const graph = await app.searchProjectKnowledge(result.project._id, "", {
    limit: 100,
  });

  console.log(`Total entities: ${graph.entities.length}`);
  console.log(`Total observations: ${graph.observations.length}`);
  console.log(`Total relations: ${graph.relations.length}`);

  // Example 4: Create another project and copy entities
  console.log("\nCreating another project...");
  const project2Data: CreateProjectDto = {
    name: "Mobile App",
    description: "Mobile version of the e-commerce platform",
  };

  const project2 = await app.createProjectWithEntities(project2Data, []);

  // Copy useful entities from the first project
  console.log("Copying useful entities to mobile app...");
  const copyResult = await app.searchProjectKnowledge(
    result.project._id,
    "user",
    { limit: 10 }
  );

  if (copyResult.entities.length > 0) {
    const copiedEntities = await app.entityService.createMany(
      project2.project._id,
      copyResult.entities.map((entity) => ({
        name: entity.name,
        entityType: entity.entityType,
      }))
    );
    console.log(`Copied ${copiedEntities.length} entities to mobile app`);
  }

  console.log("\nExample completed successfully!");
}

// Run the example
example().catch(console.error);
