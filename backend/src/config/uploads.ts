import path from "node:path";
import { env } from "./env.js";

export const uploadsRoot = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
