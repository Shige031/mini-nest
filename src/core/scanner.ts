import { META, type ModuleMeta } from "./decorators";

export function scanModule(rootModule: Function) {
  const meta: ModuleMeta | undefined = Reflect.getMetadata(META.module, rootModule);
  if (!meta) throw new Error(`Not a module: ${rootModule.name}`);

  const controllers = meta.controllers ?? []

  return {controllers}
}