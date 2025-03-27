const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

router.get("/hello", (req, res) => res.send("Hello World!"));

app.use("/api/", router);

exports.handler = serverless(app);
