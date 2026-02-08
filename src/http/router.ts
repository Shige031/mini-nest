export type Handler = (req: any, res: any) => void | Promise<void>;

type Route = {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
};

export class Router {
  private routes: Route[] = [];

  add(method: string, path: string, handler: Handler) {
    const {pattern, keys} = compilePath(path);
    this.routes.push({method: method.toUpperCase(), pattern, keys, handler});
  }

  async handle(req: any, res: any): Promise<boolean> {
    for (const r of this.routes) {
      if((req.method ?? "GET").toUpperCase() !== r.method) continue;

      const m = r.pattern.exec(req.path)
      if(!m) continue;

      req.params = {};
      r.keys.forEach((k, i) => req.params[k] = m[i + 1]);
      await r.handler(req, res);
      return true;
    }
    return false;
  }
}

function compilePath(path: string) {
  const keys: string[] = [];

  // "/users/:id" -> "^/users/([^/]+)$", keys=["id"]
  const patternSrc = 
    "^" +
    path
      .replace(/\/+$/g, "") // trailing slash trim
      .split("/")
      .map((seg) => {
        if(seg.startsWith(":")) {
          keys.push(seg.slice(1));
          return "([^/]+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/") +
    "$";

    return { pattern: new RegExp(patternSrc), keys };
}