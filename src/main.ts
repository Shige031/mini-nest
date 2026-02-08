import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end("hello mini-nest\n");
});

server.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
