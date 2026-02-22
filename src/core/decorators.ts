import "reflect-metadata";
import type { Constructor, Provider } from "./container";

export const META = {
  controllerPath: Symbol("controllerPath"),
  routes: Symbol("routes"),
  module: Symbol("module"),
  injectable: Symbol("injectable"),
  injectTokens: Symbol("injectTokens"),
  routeArgs: Symbol("routeArgs"),
  guards: Symbol("guards"),
};

export type RouteDef = {
  method: string;
  path: string;
  handlerName: string;
};

export function Controller(path = ""): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(META.controllerPath, path, target);
  };
}

function createMethodDecorator(method: string) {
  return (path = ""): MethodDecorator =>
    (target, propertyKey) => {
      const ctor = target.constructor;
      const routes: RouteDef[] = Reflect.getMetadata(META.routes, ctor) ?? [];
      routes.push({
        method,
        path,
        handlerName: propertyKey.toString(),
      });
      Reflect.defineMetadata(META.routes, routes, ctor);
    };
}

export const Get = createMethodDecorator("GET");
export const Post = createMethodDecorator("POST");


export function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(META.injectable, true, target)
  }
}

export function Inject(token: any): ParameterDecorator {
  return (target, _propertyKey, parameterIndex) => {
    const existing = Reflect.getMetadata(META.injectTokens, target) ?? {};
    existing[parameterIndex] = token;
    Reflect.defineMetadata(META.injectTokens, existing, target);
  }
}

export type ModuleMeta = {
  controllers?: Constructor[];
  providers?: Provider[];
};


export function Module(meta: ModuleMeta): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(META.module, meta, target);
  };
}

export type RouteArgKind = "param" | "query" | "body" | "req" | "res" | "ctx";

export type RouteArgDef = {
  index: number;           // 引数位置
  kind: RouteArgKind;      // どこから取るか
  key?: string;            // param/query のキー
};

function addRouteArg(
  target: Object,
  propertyKey: string | symbol,
  def: RouteArgDef,
) {
  // target は prototype。メタデータは ctor + methodName 単位で持つのが扱いやすい
  const ctor = (target as any).constructor;
  const method = propertyKey.toString();

  const all:
    Record<string, RouteArgDef[]> =
      Reflect.getMetadata(META.routeArgs, ctor) ?? {};

  const list = all[method] ?? [];
  list.push(def);

  all[method] = list;
  Reflect.defineMetadata(META.routeArgs, all, ctor);
}

export function Param(key: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "param", key });
  };
}

export function Query(key: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "query", key });
  };
}

export function Body(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "body" });
  };
}

export function Req(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "req" });
  };
}

export function Res(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "res" });
  };
}

export function Ctx(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addRouteArg(target, propertyKey!, { index: parameterIndex, kind: "ctx" });
  };
}

export function UseGuards(...guards: Function[]): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (target as any).constructor;
    const method = propertyKey!.toString();

    const existing = Reflect.getMetadata(META.guards, ctor) ?? {};
    existing[method] = guards;

    Reflect.defineMetadata(META.guards, existing, ctor);
  };
}