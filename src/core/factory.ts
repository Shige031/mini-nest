// src/core/factory.ts
import { META, type RouteDef } from "./decorators";
import { scanModule } from "./scanner";
import { HttpServer } from "../http/server";
import { Container, type Constructor } from "./container";
import { ExecutionContext } from "./execution-context";

function normalize(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return path.replace(/\/+/g, "/");
}

export class MiniNestFactory {
  static async create(rootModule: Constructor) {
    const app = new HttpServer();
    const router = app.getRouter();

    const { controllers, providers } = scanModule(rootModule);

    const container = new Container();
    providers.forEach((p) => container.register(p));
    controllers.forEach((c) => container.register(c));

    for (const c of controllers) {
      const basePath: string = Reflect.getMetadata(META.controllerPath, c) ?? "";
      const routes: RouteDef[] = Reflect.getMetadata(META.routes, c) ?? [];

      // DI
      const instance: any = container.resolve<any>(c as any);

      for (const r of routes) {
        const fullPath = normalize(`${basePath}${r.path}`);
        router.add(r.method, fullPath, (req, res) => {
          const context = new ExecutionContext("http", [req, res]);
          return instance[r.handlerName](context);
        });
      }
    }

    return app;
  }
}
