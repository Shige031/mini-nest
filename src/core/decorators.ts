import "reflect-metadata";
import type { Constructor, Provider } from "./container";

export const META = {
  controllerPath: Symbol("controllerPath"),
  routes: Symbol("routes"),
  module: Symbol("module"),
  injectable: Symbol("injectable"),
  injectTokens: Symbol("injectTokens"),
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
