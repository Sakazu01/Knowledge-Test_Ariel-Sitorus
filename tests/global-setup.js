require("./env");
const { execSync } = require("node:child_process");

module.exports = async () => {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
};
