import path from "node:path";
import multer from "multer";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/rtf"
]);

const allowedExtensions = new Set([".pdf", ".txt", ".md", ".rtf"]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_RESUME_UPLOAD_SIZE_MB * 1024 * 1024
  },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    if (allowedMimeTypes.has(mimeType) || allowedExtensions.has(extension)) {
      return callback(null, true);
    }

    return callback(
      new AppError(
        "Unsupported resume format. Upload a PDF, TXT, Markdown, or RTF resume.",
        400,
        "INVALID_RESUME_FILE"
      )
    );
  }
}).single("resume");
