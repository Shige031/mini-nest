// src/core/container.ts
import "reflect-metadata";
import { META } from "./decorators";

export type Constructor<T = any> = new (...args: any[]) => T;

export class Container {
  private providers = new Set<Constructor>();
  private singletons = new Map<Constructor, any>();

  register<T>(token: Constructor<T>) {
    this.providers.add(token);
  }

  resolve<T>(token: Constructor<T>): T {
    const name = (token as any)?.name ?? "<anonymous>";

    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const injectable = Reflect.getMetadata(META.injectable, token);
    const registered = this.providers.has(token);

    if (!injectable && !registered) {
      throw new Error(`Not injectable / not registered: ${name}`);
    }

    const paramTypes: Constructor[] =
      Reflect.getMetadata("design:paramtypes", token) ?? [];

    const deps = paramTypes.map((dep) => this.resolve(dep));
    const instance = new token(...deps);
    this.singletons.set(token, instance);

    return instance;
  }
}
