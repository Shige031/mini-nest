import { HttpError } from "./error";
import type { Middleware } from "./middleware";

function isJsonContentType(contentType: string | undefined) {
  if(!contentType) return false;
  return contentType.toLowerCase().startsWith("application/json");
}

export function jsonBodyParser(options?: {limitBytes?: number}): Middleware {
  const limitBytes = options?.limitBytes ?? 1024 * 1024;

  return async (req, _res, next) => {
    // すでにbodyがあるなら何もしない
    if(req.body !== undefined) return next();

    const contentType = req.headers?.["content-type"] as string | undefined;
    if(!isJsonContentType(contentType)) return next();

    const raw = req.raw; // Node IncomingMessage
    if(!raw) return next();

    let size = 0;
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      raw.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if(size > limitBytes) {
          reject(new HttpError(413, "Payload too large"));
          raw.destroy(); // 読むのを中止
          return;
        }
        chunks.push(chunk);
      });

      raw.on("end", () => resolve());
      raw.on("error", (e: unknown) => reject(e));
      raw.on("aborted", () => reject(new HttpError(400, "Request Aborted")))
    });

    const text = Buffer.concat(chunks).toString("utf-8");
    if(text.trim() === "") {
      req.body = undefined;
      return next();
    }

    try {
      req.body = JSON.parse(text);
      return next();
    } catch {
      throw new HttpError(400, "Invalid JSON")
    }
  }
}
