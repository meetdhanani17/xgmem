import { promises as fs } from "fs";
import path from "path";
import { IStorageProvider } from "../../core/interfaces/IStorageProvider";

export class FileStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string = "./memories/collections") {
    this.basePath = basePath;
  }

  async write(collection: string, id: string, data: any): Promise<void> {
    const filePath = path.join(
      this.basePath,
      collection,
      "documents",
      `${id}.json`
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async read<T>(collection: string, id: string): Promise<T | null> {
    try {
      const filePath = path.join(
        this.basePath,
        collection,
        "documents",
        `${id}.json`
      );
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async readAll<T>(collection: string): Promise<T[]> {
    const documentsPath = path.join(this.basePath, collection, "documents");
    try {
      const files = await fs.readdir(documentsPath);
      const documents: T[] = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(
            path.join(documentsPath, file),
            "utf-8"
          );
          documents.push(JSON.parse(content));
        }
      }

      return documents;
    } catch {
      return [];
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    try {
      const filePath = path.join(
        this.basePath,
        collection,
        "documents",
        `${id}.json`
      );
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createCollection(collection: string): Promise<void> {
    const collectionPath = path.join(this.basePath, collection);
    const documentsPath = path.join(collectionPath, "documents");
    await fs.mkdir(documentsPath, { recursive: true });
  }

  async dropCollection(collection: string): Promise<void> {
    const collectionPath = path.join(this.basePath, collection);
    await fs.rm(collectionPath, { recursive: true, force: true });
  }
}
