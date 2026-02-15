// src/main.ts
import "reflect-metadata";
import { Module, Controller, Get, Post } from "./core/decorators";
import { MiniNestFactory } from "./core/factory";
import { jsonBodyParser } from "./http/body";
import { HttpError } from "./http/error";

@Controller("/health")
class HealthController {
  @Get("")
  get(_req: any, res: any) {
    res.json({ ok: true });
  }
}

@Controller("/users")
class UserController {
  @Get("/:id")
  getUser(req: any, res: any) {
    res.json({ id: req.params.id, query: req.query });
  }

  @Post("/echo")
  echo(req: any, res: any) {
    res.json({ body: req.body });
  }
}

@Module({
  controllers: [HealthController, UserController],
})
class AppModule {}

const app = await MiniNestFactory.create(AppModule);

// logger（前回のまま）
app.use(async (req, _res, next) => {
  const start = Date.now();
  await next();
  console.log(`${req.method} ${req.path} (${Date.now() - start}ms)`);
});

// JSON body parser
app.use(jsonBodyParser({ limitBytes: 1024 * 1024 }));

// error handler
app.useError((err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, path: req.path });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal Server Error" });
});

await app.listen(3000);
console.log("listening on http://localhost:3000");
