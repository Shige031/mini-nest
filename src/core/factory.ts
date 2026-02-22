// src/core/factory.ts
import { META, type RouteDef } from "./decorators";
import { scanModule } from "./scanner";
import { HttpServer } from "../http/server";
import { Container, type Constructor } from "./container";
import { ExecutionContext } from "./execution-context";
import { resolveHandlerArgs } from "./arg-resolver";
import type { CanActivate } from "./guard";

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
        router.add(r.method, fullPath, async (req, res) => {
          const ctx = new ExecutionContext("http", [req, res]);
          const allGuards = Reflect.getMetadata(META.guards, c) ?? {};
          const guards = allGuards[r.handlerName] ?? [];

          for (const GuardClass of guards) {
            const guardInstance = container.resolve<CanActivate>(GuardClass);
            const result = await guardInstance.canActivate(ctx);

            if (!result) {
              res.status(403).json({ message: "Forbidden" });
              return;
            }
          }

          const args = resolveHandlerArgs(c, r.handlerName, ctx);
          return instance[r.handlerName](...args);
        });
      }
    }

    return app;
  }
}
