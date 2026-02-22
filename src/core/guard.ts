import type { ExecutionContext } from "./execution-context";

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
