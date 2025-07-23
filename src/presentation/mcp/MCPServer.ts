import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCPToolHandler } from "./MCPToolHandler";
import { IProjectMemoryApplication } from "../../core/interfaces/IServices";

export class MCPServer {
  private server: Server;
  private toolHandler: MCPToolHandler;

  constructor(app: IProjectMemoryApplication) {
    this.server = new Server(
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

    this.toolHandler = new MCPToolHandler(app);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
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
                    required: ["name", "entityType"],
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
                      fromEntityName: {
                        type: "string",
                        description:
                          "The name of the entity where the relation starts",
                      },
                      toEntityName: {
                        type: "string",
                        description:
                          "The name of the entity where the relation ends",
                      },
                      relationType: {
                        type: "string",
                        description: "The type of the relation",
                      },
                    },
                    required: [
                      "fromEntityName",
                      "toEntityName",
                      "relationType",
                    ],
                  },
                },
              },
              required: ["projectId", "relations"],
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
                page: {
                  type: "number",
                  description: "Page number (default: 1)",
                  default: 1,
                },
                limit: {
                  type: "number",
                  description: "Results per page (default: 50, max: 100)",
                  default: 50,
                },
              },
              required: ["projectId", "query"],
            },
          },
          {
            name: "read_graph",
            description:
              "Read the entire knowledge graph for a specific project",
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
            name: "add_observations",
            description:
              "Add new observations to existing entities in the project knowledge graph",
            inputSchema: {
              type: "object",
              properties: {
                observations: {
                  type: "array",
                  description:
                    "An array of observation objects to add to entities",
                  items: {
                    type: "object",
                    properties: {
                      entityId: {
                        type: "string",
                        description: "The entity ID to add observations to",
                      },
                      contents: {
                        type: "array",
                        items: { type: "string" },
                        description: "The array of observation strings",
                      },
                    },
                    required: ["entityId", "contents"],
                  },
                },
              },
              required: ["observations"],
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error(`No arguments provided for tool: ${name}`);
      }

      try {
        switch (name) {
          case "list_projects":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleListProjects(),
                },
              ],
            };
          case "create_entities":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleCreateEntities(args),
                },
              ],
            };
          case "create_relations":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleCreateRelations(args),
                },
              ],
            };
          case "search_nodes":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleSearchNodes(args),
                },
              ],
            };
          case "read_graph":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleReadGraph(args),
                },
              ],
            };
          case "add_observations":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleAddObservations(args),
                },
              ],
            };
          case "delete_entities":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleDeleteEntities(args),
                },
              ],
            };
          case "copy_memory":
            return {
              content: [
                {
                  type: "text",
                  text: await this.toolHandler.handleCopyMemory(args),
                },
              ],
            };
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
                null,
                2
              ),
            },
          ],
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Project Memory MCP Server running on stdio");
  }
}
