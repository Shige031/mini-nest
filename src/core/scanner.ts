import { META, type ModuleMeta } from "./decorators";
import type { Constructor } from "./container";

export function scanModule(rootModule: Constructor) {
  const meta: ModuleMeta | undefined = Reflect.getMetadata(META.module, rootModule);
  if (!meta) throw new Error(`Not a module: ${rootModule.name}`);

  const controllers = meta.controllers ?? []
  const providers = meta.providers ?? []

  return {controllers, providers}
}
