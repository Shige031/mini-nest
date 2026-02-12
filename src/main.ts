import { HttpServer } from "./http/server";

const app = new HttpServer();
const router = app.getRouter();

app.use(async (req, _res, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${req.method} ${req.path} ${ms}ms` )
})

app.useError((err, _req, res, _next) => {
  console.error("caugnt by error middleware:", err);
  res.status(500).json({
    message: "Internal server error",
  })
})

router.add("GET", "/health", (_req, res) => {
  res.json({ok: true});
});

// ★ 故意に throw
router.add("GET", "/boom", (_req, _res) => {
  throw new Error("boom!");
})

router.add("GET", "/users/:id", (req, res) => {
  res.json({ id: req.params.id, query: req.query });
});

await app.listen(3000);
console.log("listening on http://localhost:3000");
