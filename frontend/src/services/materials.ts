import "server-only";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { storageAdapter } from "@/lib/storage/adapter";
import type { MaterialListItem } from "@/features/materials/types";

export type { MaterialListItem };

export const MAX_MATERIAL_BYTES = 20 * 1024 * 1024; // 20MB

export const ALLOWED_MATERIAL_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".zip",
] as const;

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain",
  ".zip": "application/zip",
};

export type UploadMaterialInput = {
  institutionId: string;
  courseId: string;
  moduleId?: string | null;
  title: string;
  createdByUserId: string;
  file: {
    buffer: Buffer;
    fileName: string;
    contentType?: string;
    byteSize: number;
  };
};

function normalizeExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

function assertAllowedFile(fileName: string, byteSize: number) {
  if (byteSize <= 0) {
    throw new Error("File is empty.");
  }
  if (byteSize > MAX_MATERIAL_BYTES) {
    throw new Error("File exceeds the 20MB size limit.");
  }

  const ext = normalizeExtension(fileName);
  if (!ALLOWED_MATERIAL_EXTENSIONS.includes(ext as (typeof ALLOWED_MATERIAL_EXTENSIONS)[number])) {
    throw new Error(
      "Unsupported file type. Allowed: pdf, doc, docx, ppt, pptx, png, jpg, txt, zip.",
    );
  }

  return ext;
}

export async function listMaterialsForCourse(
  courseId: string,
  institutionId: string,
): Promise<MaterialListItem[]> {
  const materials = await prisma.learningMaterial.findMany({
    where: { courseId, institutionId },
    include: {
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return materials.map((material) => ({
    id: material.id,
    title: material.title,
    fileName: material.fileName,
    contentType: material.contentType,
    byteSize: material.byteSize,
    moduleId: material.moduleId,
    createdAt: material.createdAt.toISOString(),
    downloadUrl: getMaterialDownloadUrl(material.storageKey),
    createdBy: material.createdBy,
  }));
}

export async function uploadMaterial(input: UploadMaterialInput) {
  const { institutionId, courseId, moduleId, title, createdByUserId, file } = input;

  const ext = assertAllowedFile(file.fileName, file.byteSize);

  const course = await prisma.course.findFirst({
    where: { id: courseId, institutionId },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Course not found in this institution.");
  }

  if (moduleId) {
    const courseModule = await prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    });
    if (!courseModule) {
      throw new Error("Module not found for this course.");
    }
  }

  const contentType =
    file.contentType && file.contentType !== "application/octet-stream"
      ? file.contentType
      : EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";

  const storageKey = await storageAdapter.uploadFile(file.buffer, file.fileName);

  try {
    return await prisma.learningMaterial.create({
      data: {
        institutionId,
        courseId,
        moduleId: moduleId || null,
        title: title.trim(),
        fileName: file.fileName,
        contentType,
        byteSize: file.byteSize,
        storageKey,
        createdByUserId,
      },
    });
  } catch (error) {
    await storageAdapter.deleteFile(storageKey);
    throw error;
  }
}

export async function deleteMaterial(id: string, institutionId: string) {
  const material = await prisma.learningMaterial.findFirst({
    where: { id, institutionId },
  });

  if (!material) {
    throw new Error("Material not found.");
  }

  await prisma.learningMaterial.delete({ where: { id: material.id } });
  await storageAdapter.deleteFile(material.storageKey);

  return material;
}

export function getMaterialDownloadUrl(storageKey: string): string {
  return storageAdapter.getFileUrl(storageKey);
}
