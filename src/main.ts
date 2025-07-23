#!/usr/bin/env node

import { Container } from "./infrastructure/dependency-injection/Container";
import { ApplicationSetup } from "./infrastructure/dependency-injection/ApplicationSetup";
import { MCPServer } from "./presentation/mcp/MCPServer";
import { IProjectMemoryApplication } from "./core/interfaces/IServices";

async function main() {
  try {
    // Setup dependency injection container
    const container = new Container();
    ApplicationSetup.setup(container);

    // Initialize collections
    await ApplicationSetup.initializeCollections(container);

    // Resolve main application
    const app = container.resolve<IProjectMemoryApplication>("app");

    // Create and start MCP server
    const mcpServer = new MCPServer(app);
    await mcpServer.start();

    console.error("Project Memory MCP Server started successfully");
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
