// src/core/container.ts
import "reflect-metadata";
import { META } from "./decorators";

export type Constructor<T = any> = new (...args: any[]) => T;

export type Provider = Constructor | {
  provide: any,
  useClass?: Constructor;
  useValue?: any;
  useFactory?: () => any;
}

export class Container {
  private providerMap = new Map<any, Provider>();
  private singletons = new Map<Constructor, any>();

  register(provider: Provider) {
    if (typeof provider === "function") {
      this.providerMap.set(provider, provider);
    } else {
      this.providerMap.set(provider.provide, provider);
    }
  }

  resolve<T>(token: any): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const provider = this.providerMap.get(token);
    if (!provider) {
      throw new Error(`No provider for token: ${token.toString()}`);
    }

    let instance;

    if (typeof provider === "function") {
      instance = this.instantiate(provider);
    } else if (provider.useValue !== undefined) {
      instance = provider.useValue;
    } else if (provider.useFactory) {
      instance = provider.useFactory();
    } else if (provider.useClass) {
      instance = this.instantiate(provider.useClass);
    } else {
      throw new Error("Invalid provider config");
    }

    this.singletons.set(token, instance);
    return instance;
  }

  private instantiate(target: any) {
    const paramTypes: any[] =
      Reflect.getMetadata("design:paramtypes", target) ?? [];

    const injectTokens =
      Reflect.getMetadata(META.injectTokens, target) ?? {};

    const deps = paramTypes.map((type, index) => {
      const token = injectTokens[index] ?? type;
      return this.resolve(token);
    });

    return new target(...deps);
  }
}
