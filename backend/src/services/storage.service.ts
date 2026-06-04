import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { uploadsRoot } from "../config/uploads.js";
import { AppError } from "../utils/app-error.js";

export interface StoredFile {
  url: string;
  storageKey: string;
  mimeType: string;
  originalName: string;
  size: number;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function hasCloudinaryConfig() {
  return (
    Boolean(env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(env.CLOUDINARY_API_KEY) &&
    Boolean(env.CLOUDINARY_API_SECRET)
  );
}

async function uploadToCloudinary(file: Express.Multer.File): Promise<StoredFile> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "talentos/resumes";
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET!}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");
  const form = new FormData();

  form.set("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
  form.set("api_key", env.CLOUDINARY_API_KEY!);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    const failure = await response.text();
    throw new AppError(
      "Failed to upload resume to cloud storage",
      502,
      "STORAGE_UPLOAD_FAILED",
      failure
    );
  }

  const payload = (await response.json()) as { secure_url?: string; public_id?: string };
  if (!payload.secure_url || !payload.public_id) {
    throw new AppError("Cloud storage response was incomplete", 502, "STORAGE_UPLOAD_FAILED");
  }

  return {
    url: payload.secure_url,
    storageKey: payload.public_id,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size
  };
}

async function uploadToLocalDisk(file: Express.Multer.File): Promise<StoredFile> {
  const safeName = sanitizeFileName(file.originalname);
  const storageKey = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const resumeDir = path.join(uploadsRoot, "resumes");
  const absolutePath = path.join(resumeDir, storageKey);

  await fs.mkdir(resumeDir, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  return {
    url: `${env.PUBLIC_BACKEND_URL}/uploads/resumes/${storageKey}`,
    storageKey,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size
  };
}

export async function uploadResumeFile(file: Express.Multer.File): Promise<StoredFile> {
  if (hasCloudinaryConfig()) {
    return uploadToCloudinary(file);
  }

  return uploadToLocalDisk(file);
}
