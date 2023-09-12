import Koa from "koa";
import router from "./src/router.js";
import * as dotenv from "dotenv";
import * as http from "http";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

dotenv.config();
const app = new Koa();
const PORT = 8000;

app.on("error", (err) => {
  console.error(err);
});

app.use(cors());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  await next();
});

http.createServer(app.callback()).listen(PORT);
console.log(`Stitch Test Integration Server`);
