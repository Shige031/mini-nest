// src/core/arg-resolver.ts
import { META, type RouteArgDef } from "./decorators";
import type { ExecutionContext } from "./execution-context";

function maxIndex(defs: RouteArgDef[]) {
  return defs.reduce((m, d) => Math.max(m, d.index), -1);
}

export function resolveHandlerArgs(
  controllerCtor: Function,
  handlerName: string,
  ctx: ExecutionContext,
) {
  const all: Record<string, RouteArgDef[]> =
    Reflect.getMetadata(META.routeArgs, controllerCtor) ?? {};

  const defs = all[handlerName] ?? [];

  // Decorator が無い場合のフォールバック：ctx を1個渡す
  if (defs.length === 0) return [ctx];

  const http = ctx.switchToHttp();
  const req = http.getRequest();
  const res = http.getResponse();

  const args = new Array(maxIndex(defs) + 1).fill(undefined);

  for (const d of defs) {
    switch (d.kind) {
      case "param":
        args[d.index] = req.params?.[d.key!];
        break;
      case "query":
        args[d.index] = req.query?.[d.key!];
        break;
      case "body":
        args[d.index] = req.body;
        break;
      case "req":
        args[d.index] = req;
        break;
      case "res":
        args[d.index] = res;
        break;
      case "ctx":
        args[d.index] = ctx;
        break;
    }
  }

  return args;
}