import { readFile, mkdir, copyFile } from "node:fs/promises";
import { build } from "esbuild";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const license = await readFile(new URL("../LICENSE", import.meta.url), "utf8");
if (process.env.RELEASE_TAG && process.env.RELEASE_TAG !== `v${pkg.version}`) {
  throw new Error("Release tag must match the package version");
}
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/ha-dashboard-fit.js",
  bundle: true,
  format: "iife",
  target: ["chrome120", "firefox121", "safari17.2"],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: { js: `/*! HA Dashboard Fit v${pkg.version} | Published by peacode (https://peacode.com)\n${license.replaceAll("*/", "* /")}*/` },
});
await copyFile("LICENSE", "dist/LICENSE");
console.log(`Built HA Dashboard Fit v${pkg.version}`);
