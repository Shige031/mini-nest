import { HttpServer } from "./http/server";

const app = new HttpServer();
const router = app.getRouter();

router.add("GET", "/health", (_req, res) => {
  res.json({ok: true});
});

router.add("GET", "/users/:id", (req, res) => {
  res.json({ id: req.params.id, query: req.query });
});

await app.listen(3000);
console.log("listening on http://localhost:3000");
