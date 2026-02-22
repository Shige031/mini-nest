// src/main.ts
import "reflect-metadata";
import { Module, Controller, Get, Post, Injectable, Inject } from "./core/decorators";
import { MiniNestFactory } from "./core/factory";
import { jsonBodyParser } from "./http/body";
import { HttpError } from "./http/error";
import type { ExecutionContext } from "./core/execution-context";

const LOGGER = Symbol("LOGGER");

interface Logger {
  log(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log("LOG:", message);
  }
}

@Injectable()
class UserService {
  constructor(@Inject(LOGGER) private logger: Logger) {}
  find(id: string) {
    this.logger.log(`finding user ${id}`);
    return { id, name: "Taro" };
  }
}

@Controller("/users")
class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/:id")
  getUser(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    res.json({ user: this.userService.find(req.params.id), query: req.query });
  }

  @Post("/echo")
  echo(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    res.json({ body: req.body });
  }
}

@Controller("/health")
class HealthController {
  @Get("")
  get(context: ExecutionContext) {
    const http = context.switchToHttp();
    const res = http.getResponse();
    res.json({ ok: true });
  }
}

@Module({
  controllers: [HealthController, UserController],
  providers: [UserService, {provide: LOGGER, useClass: ConsoleLogger}],
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
