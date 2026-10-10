import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageAdapter {
  uploadFile(fileBuffer: Buffer, originalFilename: string): Promise<string>;
  getFileUrl(storageKey: string): string;
  deleteFile(storageKey: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), "public", "uploads");

  private async ensureDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    await this.ensureDirExists();
    const ext = path.extname(originalFilename) || ".bin";
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const storageKey = `file_${uniqueId}${ext}`;
    const filePath = path.join(this.uploadDir, storageKey);

    await fs.writeFile(filePath, fileBuffer);
    return storageKey;
  }

  getFileUrl(storageKey: string): string {
    if (!storageKey) return "/avatars/default-avatar.png";
    return `/uploads/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<void> {
    if (!storageKey) return;
    const filePath = path.join(this.uploadDir, storageKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

export const storageAdapter: StorageAdapter = new LocalStorageAdapter();
