#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define memory directory path using environment variable with fallback
const defaultMemoryDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "memories"
);

// If MEMORY_DIR_PATH is just a directory name, put it in the same directory as the script
const MEMORY_DIR_PATH = process.env.MEMORY_DIR_PATH
  ? path.isAbsolute(process.env.MEMORY_DIR_PATH)
    ? process.env.MEMORY_DIR_PATH
    : path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        process.env.MEMORY_DIR_PATH
      )
  : defaultMemoryDir;

// We are storing our memory using entities, relations, and observations in a graph structure
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
  projectId?: string; // Project identifier
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
  projectId?: string; // Project identifier
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// The ProjectMemoryManager class contains all operations to interact with project-specific memory

/**
 * ProjectObservation describes a set of observations for a single entity in a project.
 */
interface ProjectObservation {
  entityName: string;
  contents: string[];
}

/**
 * ProjectObservationsFile describes the structure of the observations file per project.
 */
interface ProjectObservationsFile {
  projectId: string;
  observations: ProjectObservation[];
}

export class ProjectMemoryManager {
  private async ensureMemoryDirExists(): Promise<void> {
    try {
      await fs.mkdir(MEMORY_DIR_PATH, { recursive: true });
    } catch (error) {
      console.error("Error creating memory directory:", error);
      throw error;
    }
  }

  private getProjectFilePath(projectId: string): string {
    return path.join(MEMORY_DIR_PATH, `${projectId}.json`);
  }

  private async loadProjectGraph(projectId: string): Promise<KnowledgeGraph> {
    await this.ensureMemoryDirExists();
    const filePath = this.getProjectFilePath(projectId);

    try {
      const data = await fs.readFile(filePath, "utf-8");
      const lines = data.split("\n").filter((line) => line.trim() !== "");
      return lines.reduce(
        (graph: KnowledgeGraph, line) => {
          const item = JSON.parse(line);
          if (item.type === "entity") graph.entities.push(item as Entity);
          if (item.type === "relation") graph.relations.push(item as Relation);
          return graph;
        },
        { entities: [], relations: [] }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as any).code === "ENOENT"
      ) {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveProjectGraph(
    projectId: string,
    graph: KnowledgeGraph
  ): Promise<void> {
    await this.ensureMemoryDirExists();
    const filePath = this.getProjectFilePath(projectId);
    // Ensure all parent directories exist for nested project IDs
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const lines = [
      ...graph.entities.map((e) => JSON.stringify({ type: "entity", ...e })),
      ...graph.relations.map((r) => JSON.stringify({ type: "relation", ...r })),
    ];
    await fs.writeFile(filePath, lines.join("\n"));
  }

  async listProjects(): Promise<string[]> {
    await this.ensureMemoryDirExists();

    try {
      const files = await fs.readdir(MEMORY_DIR_PATH);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => path.basename(file, ".json"));
    } catch (error) {
      console.error("Error listing projects:", error);
      return [];
    }
  }

  async createEntities(
    projectId: string,
    entities: Entity[]
  ): Promise<Entity[]> {
    const graph = await this.loadProjectGraph(projectId);

    // Add projectId to each entity
    const entitiesWithProject = entities.map((entity) => ({
      ...entity,
      projectId,
    }));

    const newEntities = entitiesWithProject.filter(
      (e) =>
        !graph.entities.some((existingEntity) => existingEntity.name === e.name)
    );

    graph.entities.push(...newEntities);
    await this.saveProjectGraph(projectId, graph);
    return newEntities;
  }

  async createRelations(
    projectId: string,
    relations: Relation[]
  ): Promise<Relation[]> {
    const graph = await this.loadProjectGraph(projectId);

    // Add projectId to each relation
    const relationsWithProject = relations.map((relation) => ({
      ...relation,
      projectId,
    }));

    const newRelations = relationsWithProject.filter(
      (r) =>
        !graph.relations.some(
          (existingRelation) =>
            existingRelation.from === r.from &&
            existingRelation.to === r.to &&
            existingRelation.relationType === r.relationType
        )
    );

    graph.relations.push(...newRelations);
    await this.saveProjectGraph(projectId, graph);
    return newRelations;
  }

  async addObservations(
    projectId: string,
    observations: { entityName: string; contents: string[] }[]
  ): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadProjectGraph(projectId);

    const results = observations.map((o) => {
      const entity = graph.entities.find((e) => e.name === o.entityName);
      if (!entity) {
        throw new Error(
          `Entity with name ${o.entityName} not found in project ${projectId}`
        );
      }

      const newObservations = o.contents.filter(
        (content) => !entity.observations.includes(content)
      );

      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });

    await this.saveProjectGraph(projectId, graph);
    return results;
  }

  async deleteEntities(
    projectId: string,
    entityNames: string[]
  ): Promise<void> {
    const graph = await this.loadProjectGraph(projectId);

    graph.entities = graph.entities.filter(
      (e) => !entityNames.includes(e.name)
    );

    graph.relations = graph.relations.filter(
      (r) => !entityNames.includes(r.from) && !entityNames.includes(r.to)
    );

    await this.saveProjectGraph(projectId, graph);
  }

  async deleteObservations(
    projectId: string,
    deletions: { entityName: string; observations: string[] }[]
  ): Promise<void> {
    const graph = await this.loadProjectGraph(projectId);

    deletions.forEach((d) => {
      const entity = graph.entities.find((e) => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(
          (obs) => !d.observations.includes(obs)
        );
      }
    });

    await this.saveProjectGraph(projectId, graph);
  }

  async deleteRelations(
    projectId: string,
    relations: Relation[]
  ): Promise<void> {
    const graph = await this.loadProjectGraph(projectId);

    graph.relations = graph.relations.filter(
      (r) =>
        !relations.some(
          (delRelation) =>
            r.from === delRelation.from &&
            r.to === delRelation.to &&
            r.relationType === delRelation.relationType
        )
    );

    await this.saveProjectGraph(projectId, graph);
  }

  async readGraph(projectId: string): Promise<KnowledgeGraph> {
    return this.loadProjectGraph(projectId);
  }

  // Search within a specific project
  async searchNodes(projectId: string, query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadProjectGraph(projectId);
    const lowercaseQuery = query.toLowerCase();

    // Filter entities
    const filteredEntities = graph.entities.filter(
      (e) =>
        e.name.toLowerCase().includes(lowercaseQuery) ||
        e.entityType.toLowerCase().includes(lowercaseQuery) ||
        e.observations.some((obs) => obs.toLowerCase().includes(lowercaseQuery))
    );

    // Get filtered entity names for relation filtering
    const filteredEntityNames = new Set(filteredEntities.map((e) => e.name));

    // Filter relations
    const filteredRelations = graph.relations.filter(
      (r) => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };

    return filteredGraph;
  }

  // Global search across all projects
  async searchAllProjects(
    query: string
  ): Promise<{ [projectId: string]: KnowledgeGraph }> {
    const projects = await this.listProjects();
    const results: { [projectId: string]: KnowledgeGraph } = {};

    for (const projectId of projects) {
      const projectResults = await this.searchNodes(projectId, query);
      if (
        projectResults.entities.length > 0 ||
        projectResults.relations.length > 0
      ) {
        results[projectId] = projectResults;
      }
    }

    return results;
  }

  async openNodes(projectId: string, names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadProjectGraph(projectId);

    // Filter entities
    const filteredEntities = graph.entities.filter((e) =>
      names.includes(e.name)
    );

    // Get filtered entity names for relation filtering
    const filteredEntityNames = new Set(filteredEntities.map((e) => e.name));

    // Filter relations
    const filteredRelations = graph.relations.filter(
      (r) => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };

    return filteredGraph;
  }

  // Copy memory between projects
  async copyMemory(
    sourceProjectId: string,
    targetProjectId: string,
    entityNames: string[]
  ): Promise<void> {
    const sourceGraph = await this.loadProjectGraph(sourceProjectId);
    const targetGraph = await this.loadProjectGraph(targetProjectId);

    // Find entities to copy
    const entitiesToCopy = sourceGraph.entities.filter((e) =>
      entityNames.includes(e.name)
    );

    // Find relations to copy (only those between copied entities)
    const relationsToCopy = sourceGraph.relations.filter(
      (r) => entityNames.includes(r.from) && entityNames.includes(r.to)
    );

    // Add entities to target if they don't exist
    for (const entity of entitiesToCopy) {
      const existingEntity = targetGraph.entities.find(
        (e) => e.name === entity.name
      );
      if (!existingEntity) {
        // Create a new entity with the target project ID
        targetGraph.entities.push({
          ...entity,
          projectId: targetProjectId,
        });
      } else {
        // Merge observations without duplicates
        const newObservations = entity.observations.filter(
          (obs) => !existingEntity.observations.includes(obs)
        );
        existingEntity.observations.push(...newObservations);
      }
    }

    // Add relations to target if they don't exist
    for (const relation of relationsToCopy) {
      const relationExists = targetGraph.relations.some(
        (r) =>
          r.from === relation.from &&
          r.to === relation.to &&
          r.relationType === relation.relationType
      );

      if (!relationExists) {
        // Create a new relation with the target project ID
        targetGraph.relations.push({
          ...relation,
          projectId: targetProjectId,
        });
      }
    }

    await this.saveProjectGraph(targetProjectId, targetGraph);
  }
  /**
   * Save observations for a specific project in the format:
   * {
   *   projectId: string,
   *   observations: [{ entityName: string, contents: string[] }]
   * }
   * @param projectId The project identifier.
   * @param observations Array of { entityName, contents } objects.
   */
  async saveProjectObservations(
    projectId: string,
    observations: ProjectObservation[]
  ): Promise<void> {
    const filePath = path.join(
      MEMORY_DIR_PATH,
      `${projectId}-observations.json`
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const data: ProjectObservationsFile = { projectId, observations };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  /**
   * Load observations for a specific project.
   * @param projectId The project identifier.
   * @returns Array of observations for the project.
   */
  async loadProjectObservations(
    projectId: string
  ): Promise<ProjectObservationsFile | null> {
    const filePath = path.join(
      MEMORY_DIR_PATH,
      `${projectId}-observations.json`
    );
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as ProjectObservationsFile;
    } catch (err: any) {
      if (err.code === "ENOENT") return null;
      throw err;
    }
  }
}

const projectMemoryManager = new ProjectMemoryManager();

// The server instance and tools exposed to the model
const server = new Server(
  {
    name: "project-memory-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Tool for adding project-based observations
  // Call with: { projectId: string, observations: [{ entityName: string, contents: string[] }] }
  // This will be stored in <MEMORY_DIR_PATH>/<projectId>-observations.json
  // To retrieve, use the get_observations tool (see below)
  return {
    tools: [
      // Tool for saving observations to a separate file
      {
        name: "save_project_observations",
        description:
          "Save observations for a project to a separate file in the format { projectId, observations: [{ entityName, contents: [...] }] }.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            observations: {
              type: "array",
              description: "An array of observation objects to add",
              items: {
                type: "object",
                properties: {
                  entityName: {
                    type: "string",
                    description: "The entity name",
                  },
                  contents: {
                    type: "array",
                    items: { type: "string" },
                    description: "The array of observation strings",
                  },
                },
                required: ["entityName", "contents"],
              },
            },
          },
          required: ["projectId", "observations"],
        },
      },
      // Tool for getting observations from the separate file
      {
        name: "get_project_observations",
        description:
          "Get all observations saved in the separate file for a given projectId.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
          },
          required: ["projectId"],
        },
      },
      // Tool for adding observations to the graph entities
      {
        name: "add_graph_observations",
        description:
          "Add new observations to existing entities in the project knowledge graph.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            observations: {
              type: "array",
              description:
                "An array of observation objects to add to graph entities.",
              items: {
                type: "object",
                properties: {
                  entityName: {
                    type: "string",
                    description:
                      "The entity name in the graph to add observations to.",
                  },
                  contents: {
                    type: "array",
                    items: { type: "string" },
                    description: "The array of observation strings",
                  },
                },
                required: ["entityName", "contents"],
              },
            },
          },
          required: ["projectId", "observations"],
        },
      },
      // ...existing tools below
      {
        name: "list_projects",
        description: "List all projects with stored memory",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_entities",
        description:
          "Create multiple new entities in the project knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            entities: {
              type: "array",
              description: "An array of entities to create",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "The name of the entity",
                  },
                  entityType: {
                    type: "string",
                    description: "The type of the entity",
                  },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "An array of observation contents associated with the entity",
                  },
                },
                required: ["name", "entityType", "observations"],
              },
            },
          },
          required: ["projectId", "entities"],
        },
      },
      {
        name: "create_relations",
        description:
          "Create multiple new relations between entities in the project knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            relations: {
              type: "array",
              description: "An array of relations to create",
              items: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description:
                      "The name of the entity where the relation starts",
                  },
                  to: {
                    type: "string",
                    description:
                      "The name of the entity where the relation ends",
                  },
                  relationType: {
                    type: "string",
                    description: "The type of the relation",
                  },
                },
                required: ["from", "to", "relationType"],
              },
            },
          },
          required: ["projectId", "relations"],
        },
      },
      {
        name: "delete_entities",
        description:
          "Delete multiple entities and their associated relations from the project knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            entityNames: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to delete",
            },
          },
          required: ["projectId", "entityNames"],
        },
      },
      {
        name: "delete_observations",
        description:
          "Delete specific observations from entities in the project knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            deletions: {
              type: "array",
              description: "An array of deletions to perform",
              items: {
                type: "object",
                properties: {
                  entityName: {
                    type: "string",
                    description:
                      "The name of the entity containing the observations",
                  },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "An array of observations to delete",
                  },
                },
                required: ["entityName", "observations"],
              },
            },
          },
          required: ["projectId", "deletions"],
        },
      },
      {
        name: "delete_relations",
        description:
          "Delete multiple relations from the project knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            relations: {
              type: "array",
              description: "An array of relations to delete",
              items: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description:
                      "The name of the entity where the relation starts",
                  },
                  to: {
                    type: "string",
                    description:
                      "The name of the entity where the relation ends",
                  },
                  relationType: {
                    type: "string",
                    description: "The type of the relation",
                  },
                },
                required: ["from", "to", "relationType"],
              },
            },
          },
          required: ["projectId", "relations"],
        },
      },
      {
        name: "read_graph",
        description: "Read the entire knowledge graph for a specific project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
          },
          required: ["projectId"],
        },
      },
      {
        name: "search_nodes",
        description:
          "Search for nodes in a specific project's knowledge graph based on a query",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            query: {
              type: "string",
              description:
                "The search query to match against entity names, types, and observation content",
            },
          },
          required: ["projectId", "query"],
        },
      },
      {
        name: "search_all_projects",
        description:
          "Search for nodes across all projects' knowledge graphs based on a query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The search query to match against entity names, types, and observation content",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "open_nodes",
        description:
          "Open specific nodes in a project's knowledge graph by their names",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "The project identifier",
            },
            names: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to retrieve",
            },
          },
          required: ["projectId", "names"],
        },
      },
      {
        name: "copy_memory",
        description:
          "Copy memory entities and their relations from one project to another",
        inputSchema: {
          type: "object",
          properties: {
            sourceProjectId: {
              type: "string",
              description: "The source project identifier",
            },
            targetProjectId: {
              type: "string",
              description: "The target project identifier",
            },
            entityNames: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to copy",
            },
          },
          required: ["sourceProjectId", "targetProjectId", "entityNames"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "list_projects":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.listProjects(),
              null,
              2
            ),
          },
        ],
      };
    case "create_entities":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.createEntities(
                args.projectId as string,
                args.entities as Entity[]
              ),
              null,
              2
            ),
          },
        ],
      };
    case "save_project_observations":
      // Add project-based observations (not knowledge graph)
      await projectMemoryManager.saveProjectObservations(
        args.projectId as string,
        args.observations as ProjectObservation[]
      );
      return {
        content: [{ type: "text", text: "Observations added successfully" }],
      };
    case "get_project_observations": {
      // Retrieve project-based observations
      const obs = await projectMemoryManager.loadProjectObservations(
        args.projectId as string
      );
      return {
        content: [{ type: "text", text: JSON.stringify(obs, null, 2) }],
      };
    }
    case "create_relations":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.createRelations(
                args.projectId as string,
                args.relations as Relation[]
              ),
              null,
              2
            ),
          },
        ],
      };
    case "add_graph_observations":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.addObservations(
                args.projectId as string,
                args.observations as {
                  entityName: string;
                  contents: string[];
                }[]
              ),
              null,
              2
            ),
          },
        ],
      };
    case "delete_entities":
      await projectMemoryManager.deleteEntities(
        args.projectId as string,
        args.entityNames as string[]
      );
      return {
        content: [{ type: "text", text: "Entities deleted successfully" }],
      };
    case "delete_observations":
      await projectMemoryManager.deleteObservations(
        args.projectId as string,
        args.deletions as { entityName: string; observations: string[] }[]
      );
      return {
        content: [{ type: "text", text: "Observations deleted successfully" }],
      };
    case "delete_relations":
      await projectMemoryManager.deleteRelations(
        args.projectId as string,
        args.relations as Relation[]
      );
      return {
        content: [{ type: "text", text: "Relations deleted successfully" }],
      };
    case "read_graph":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.readGraph(args.projectId as string),
              null,
              2
            ),
          },
        ],
      };
    case "search_nodes":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.searchNodes(
                args.projectId as string,
                args.query as string
              ),
              null,
              2
            ),
          },
        ],
      };
    case "search_all_projects":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.searchAllProjects(
                args.query as string
              ),
              null,
              2
            ),
          },
        ],
      };
    case "open_nodes":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await projectMemoryManager.openNodes(
                args.projectId as string,
                args.names as string[]
              ),
              null,
              2
            ),
          },
        ],
      };
    case "copy_memory":
      await projectMemoryManager.copyMemory(
        args.sourceProjectId as string,
        args.targetProjectId as string,
        args.entityNames as string[]
      );
      return {
        content: [{ type: "text", text: "Memory copied successfully" }],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Project Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
