// src/http/server.ts
import { createServer } from "node:http";
import { Router } from "./router";
import { compose, type Middleware } from "./middleware";

export class HttpServer {
  private router = new Router();
  private middlewares: Middleware[] = [];

  getRouter() {
    return this.router;
  }

  use(mw: Middleware) {
    this.middlewares.push(mw);
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

      const fn = compose([
        ...this.middlewares,
        async (_req, _res, next) => {
          // 最後に router を呼ぶ middleware（終端）
          const ok = await this.router.handle(request, response);
          if (!ok) {
            res.statusCode = 404;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Not Found");
          }
          next(); // ここまで来たらチェーン終了
        },
      ]);

      // エラーはここでまとめて 500 にする（後で middleware 化する）
      try {
        // ここで渡す第3引数がoutNext
        await fn(request, response, (err) => {
          if (err) throw err;
        });
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("Internal Server Error");
        console.error(e);
      }
    });

    return new Promise<void>((resolve) => server.listen(port, resolve));
  }
}
