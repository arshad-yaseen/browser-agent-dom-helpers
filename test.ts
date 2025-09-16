import { cleanHtml } from "./src/clean-html";

const TARGET_URL = "https://withcortex.ai/";

const response = await fetch(TARGET_URL);

const orignalHtml = await response.text();
const cleanedHtml = await cleanHtml(orignalHtml);

console.log("original html length:", orignalHtml.length);
console.log("cleaned html length:", cleanedHtml.length);

await Bun.write("original.html", orignalHtml);
await Bun.write("cleaned.html", cleanedHtml);
