import path from "node:path";
import { PDFParse } from "pdf-parse";

const textMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/rtf"
]);

function normalizeText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

export async function extractResumeText(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  if (textMimeTypes.has(mimeType) || [".txt", ".md", ".rtf"].includes(extension)) {
    return normalizeText(file.buffer.toString("utf8"));
  }

  return null;
}
