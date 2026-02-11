import { HttpServer } from "./http/server";

const app = new HttpServer();
const router = app.getRouter();

app.use(async (req, _res, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${req.method} ${req.path} ${ms}ms` )
})

router.add("GET", "/health", (_req, res) => {
  res.json({ok: true});
});

router.add("GET", "/users/:id", (req, res) => {
  res.json({ id: req.params.id, query: req.query });
});

await app.listen(3000);
console.log("listening on http://localhost:3000");
