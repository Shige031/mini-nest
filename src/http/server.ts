import { createServer } from "node:http";
import { Router } from "./router"

export class HttpServer {
  private router = new Router();

  getRouter() {
    return this.router;
  }

  listen(port: number) {
    const server = createServer(async (req, res) => {
      try {
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
            return response
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
          }
        }

        const ok = await this.router.handle(request, response);
        if(!ok) {
          res.statusCode = 404;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("Not Found");
        }
      } catch(e) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("Internal Server Error");
        console.error(e);
      }
    });

    return new Promise<void>((resolve) => server.listen(port, resolve));
  }
}