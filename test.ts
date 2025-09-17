import { cleanHtml } from "./src/clean-html";

const originalHtml = await Bun.file("original.html").text();
const cleanedHtml = await cleanHtml(originalHtml);

console.log("original html length:", originalHtml.length);
console.log("cleaned html length:", cleanedHtml.length);

await Bun.write("cleaned.html", cleanedHtml);
