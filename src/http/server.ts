// src/http/server.ts
import { createServer } from "node:http";
import { Router } from "./router";
import { compose, type Middleware, type ErrorMiddleware } from "./middleware";

export class HttpServer {
  private router = new Router();
  private middlewares: Middleware[] = [];
  private errorMiddlewares: ErrorMiddleware[] = [];

  getRouter() {
    return this.router;
  }

  use(mw: Middleware) {
    this.middlewares.push(mw);
    return this;
  }

  useError(mw: ErrorMiddleware) {
    this.errorMiddlewares.push(mw);
    return this;
  }

  listen(port: number) {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

      const request = {
        method: req.method ?? "GET",
        path: url.pathname.replace(/\/+$/g, "") || "/",
        query: Object.fromEntries(url.searchParams.entries()),
        headers: req.headers,
        params: {} as Record<string, string>,
        body: undefined as any,
        raw: req,
      };

      const response = {
        status(code: number) {
          res.statusCode = code;
          return response;
        },
        setHeader(name: string, value: string) {
          res.setHeader(name, value);
          return response;
        },
        json(obj: any) {
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify(obj));
        },
        send(text: string) {
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(text);
        },
      };

      const terminalRouter: Middleware = async (_req, _res, next) => {
        const ok = await this.router.handle(request, response);
        if (!ok) {
          res.statusCode = 404;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("Not Found");
        }
        next();
      };

      // 通常MW → router → errorMW の順に 1本のパイプラインへ
      const fn = compose([
        ...this.middlewares,
        terminalRouter,
        ...this.errorMiddlewares,
      ]);

      // outNext: 最後まで流れたのに未処理の err が残ったらここに来る
      await fn(request, response, (err) => {
        if (!err) return;

        // フォールバック
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("Internal Server Error");
        console.error(err);
      });
    });

    return new Promise<void>((resolve) => server.listen(port, resolve));
  }
}
