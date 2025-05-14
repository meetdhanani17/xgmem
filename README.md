[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/meetdhanani17-xgmem-badge.png)](https://mseep.ai/app/meetdhanani17-xgmem)

# xgmem MCP Memory Server

xgmem is a TypeScript-based Model Context Protocol (MCP) server for enabling project-specific and knowledge graph-based memory for Claude, LLM agents, and other tools. It supports storing, retrieving, and managing entities, relations, and observations per project, with a focus on flexibility and cross-project knowledge sharing.

## Features

- Knowledge graph storage for entities, relations, and observations
- CRUD operations via MCP tools
- Persistence to disk (memory.json)
- Docker and TypeScript support

## Use Case

xgmem is ideal for:

- Agents and LLMs that need to store and retrieve structured memory (entities, relations, observations) per project.
- Cross-project knowledge sharing and migration.
- Scalable, disk-persistent, and queryable memory for agent ecosystems.

## Usage

### MCP Config Example

Add to your MCP config (e.g., for windsurf):

```json
"mcpServers": {
    "xgmem": {
      "command": "npx",
      "args": ["-y", "xgmem@latest"]
    }
  }
```

### Install dependencies

```sh
npm install
```

### Build

```sh
npm run build
```

### Run (development)

```sh
npx ts-node index.ts
```

### Run (production)

```sh
npm start
```

### Docker

```sh
docker build -t xgmem-mcp-server .
docker run -v $(pwd)/memories:/app/memories xgmem-mcp-server
```

This will persist all project memory files in the `memories` directory on your host.

## How to Save Memory (MCP API)

To save observations (memory) for a project, call the `save_project_observations` tool via the MCP API:

**Example JSON:**

```json
{
  "name": "save_project_observations",
  "args": {
    "projectId": "demo-project",
    "observations": [
      {
        "entityName": "Alice",
        "contents": [
          "Alice joined Acme Corp in 2021.",
          "Alice is a software engineer."
        ]
      },
      {
        "entityName": "Bob",
        "contents": [
          "Bob joined Acme Corp in 2022.",
          "Bob is a product manager."
        ]
      }
    ]
  }
}
```

You can use any compatible MCP client, or send this JSON via stdin if running the server directly.

## Tooling and API

xgmem exposes the following tools:

- `save_project_observations`
- `get_project_observations`
- `add_graph_observations`
- `create_entities`
- `create_relations`
- `delete_entities`
- `delete_observations`
- `delete_relations`
- `read_graph`
- `search_nodes`
- `search_all_projects`
- `open_nodes`
- `copy_memory`

See the `get_help` tool (if enabled) for documentation and usage examples via the MCP API.

## Configuration

- Set `MEMORY_DIR_PATH` env variable to change the memory storage directory (default: `/app/memories`).

## License

MIT
