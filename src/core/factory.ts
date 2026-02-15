// src/core/factory.ts
import { META, type RouteDef } from "./decorators";
import { scanModule } from "./scanner";
import { HttpServer } from "../http/server";

function normalize(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return path.replace(/\/+/g, "/");
}

export class MiniNestFactory {
  static async create(rootModule: Function) {
    const app = new HttpServer();
    const router = app.getRouter();

    const { controllers } = scanModule(rootModule);

    for (const c of controllers) {
      const basePath: string = Reflect.getMetadata(META.controllerPath, c) ?? "";
      const routes: RouteDef[] = Reflect.getMetadata(META.routes, c) ?? [];

      const instance: any = new (c as any)();

      for (const r of routes) {
        const fullPath = normalize(`${basePath}${r.path}`);
        router.add(r.method, fullPath, (req, res) => instance[r.handlerName](req,res));
      }
    }

    return app;
  }
}