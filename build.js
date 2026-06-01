const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const entries = ["index.html", "server.js", "package.json", "assets", "src", "vendor"];

function copyEntry(source, destination) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyEntry(path.join(source, child), path.join(destination, child));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

if (!dist.startsWith(root)) {
  throw new Error("Refusing to build outside the project directory.");
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of entries) {
  copyEntry(path.join(root, entry), path.join(dist, entry));
}

console.log(`Production static build created at ${dist}`);
