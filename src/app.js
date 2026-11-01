const express = require("express");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const routes = require("./routes");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
