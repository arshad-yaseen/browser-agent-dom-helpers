import { cleanHtml } from "./src/clean-html";

const TARGET_URL = "https://withcortex.ai/";

async function fetchAndCleanHtml() {
	const response = await fetch(TARGET_URL);
	const testHtml = await response.text();

	const cleaned = await cleanHtml(testHtml);

	console.log("original html length:", testHtml.length);
  console.log("cleaned html length:", cleaned.length);

	await Bun.write("cleaned.html", cleaned);
}

fetchAndCleanHtml();
