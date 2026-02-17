// src/main.ts
import "reflect-metadata";
import { Module, Controller, Get, Post, Injectable } from "./core/decorators";
import { MiniNestFactory } from "./core/factory";
import { jsonBodyParser } from "./http/body";
import { HttpError } from "./http/error";

@Injectable()
class UserService {
  find(id: string) {
    return { id, name: "Taro" };
  }
}

@Controller("/users")
class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/:id")
  getUser(req: any, res: any) {
    res.json({ user: this.userService.find(req.params.id), query: req.query });
  }

  @Post("/echo")
  echo(req: any, res: any) {
    res.json({ body: req.body });
  }
}

@Controller("/health")
class HealthController {
  @Get("")
  get(_req: any, res: any) {
    res.json({ ok: true });
  }
}

@Module({
  controllers: [HealthController, UserController],
  providers: [UserService],
})
class AppModule {}

const app = await MiniNestFactory.create(AppModule);

// logger
app.use(async (req, _res, next) => {
  const start = Date.now();
  await next();
  console.log(`${req.method} ${req.path} (${Date.now() - start}ms)`);
});

// body parser
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
