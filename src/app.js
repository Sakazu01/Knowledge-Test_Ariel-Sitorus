const express = require("express");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
