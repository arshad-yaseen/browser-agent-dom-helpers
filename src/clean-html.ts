import { minify } from "html-minifier-terser";
import { HTMLRewriter } from "html-rewriter-wasm";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cleanedHtml = "";

const rewriter = new HTMLRewriter((outputChunk) => {
	cleanedHtml += decoder.decode(outputChunk);
});

export async function cleanHtml(html: string): Promise<string> {

  // hTMLRewriter cannot process elements inside iframe tags.
  // as a fix, we convert all iframe tags to div elements with a special attribute.
  // we use 'data-original-iframe' because essential data attributes are preserved during cleaning,
  // allowing us to convert these divs back to iframes later.
  html = html.replaceAll('<iframe', '<div data-original-iframe')

	rewriter
		.on(Array.from(REMOVE_COMPLETELY).join(","), {
			element(el) {
				el.remove();
			},
		})
		.on("svg", {
			element(el) {
				el.setInnerContent("[SVG]");
				for (const [name] of el.attributes) {
					if (name !== "id" && name !== "class") {
						el.removeAttribute(name);
					}
				}
			},
		})
		.on("canvas", {
			element(el) {
				el.setInnerContent("[CANVAS]");
				for (const [name] of el.attributes) {
					if (name !== "id" && name !== "class") {
						el.removeAttribute(name);
					}
				}
			},
		})
		.on("*", {
			element(el) {
				const tagName = el.tagName;
				const isContentContainerElement = CONTENT_CONTAINER_ELEMENTS.has(tagName);
				let hasEventHandler = false;
				const attributesToRemove: string[] = [];

				for (const [name] of el.attributes) {
					if (name.startsWith("on")) {
						hasEventHandler = true;
						el.setAttribute(name, "[handler]");
						continue;
					}

					if (!ESSENTIAL_ATTRIBUTES.has(name)) {
						attributesToRemove.push(name);
					}
				}

				for (const attr of attributesToRemove) {
					el.removeAttribute(attr);
				}
				if (isContentContainerElement && !hasEventHandler) {
						el.removeAndKeepContent();
				}
				if (tagName === "img") {
					const alt = el.getAttribute("alt") || "image";
					const id = el.getAttribute("id");
					const className = el.getAttribute("class");
					for (const [attrName] of el.attributes) {
						el.removeAttribute(attrName);
					}
					if (id) el.setAttribute("id", id);
					if (className) el.setAttribute("class", className);
					el.setAttribute("alt", alt);
					el.before(`[IMG: ${alt}]`);
					el.remove();
				}
			},
		});

	try {
		await rewriter.write(encoder.encode(html));
		await rewriter.end();
	} finally {
		rewriter.free();
	}

	// convert the temporary div elements back to iframe tags
	// this restores the iframes that were converted to divs at the beginning
	cleanedHtml = cleanedHtml.replaceAll('<div data-original-iframe', '<iframe')

	const minifiedHtml = await minify(cleanedHtml, {
		collapseWhitespace: true,
		removeComments: true,
		removeEmptyAttributes: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
		removeAttributeQuotes: true,
		useShortDoctype: true,
		minifyCSS: false,
		minifyJS: false,
	});

	return minifiedHtml;
}

// attributes essential for selection and understanding element purpose
const ESSENTIAL_ATTRIBUTES = new Set([
	"id",
	"class",
	"name",
	"data-testid",

	// special attribute used to track iframe elements that were temporarily converted to divs
	// this marker allows us to convert them back to iframes after the cleaning process
	"data-original-iframe",

	"type",
	"value",
	"placeholder",
	"checked",
	"selected",
	"disabled",
	"readonly",
	"required",
	"multiple",
	"autofocus",
	"autocomplete",
	"min",
	"max",
	"step",
	"pattern",
	"maxlength",
	"minlength",
	"size",

	"href",
	"target",
	"download",
	"rel",

	"action",
	"method",
	"enctype",
	"novalidate",

	"src",
	"srcset",
	"alt",
	"title",
	"controls",
	"autoplay",
	"loop",
	"muted",

	"for",
	"aria-label",
	"aria-labelledby",
	"aria-describedby",
	"role",
	"contenteditable",
	"draggable",
]);

// elements to completely remove (not even keep their content)
const REMOVE_COMPLETELY = new Set([
  "style",
  "script",
  "noscript",
  "meta",
  "link",
  "base",
  "template",
  "head",
  "title",
  "col",
  "colgroup",
  "hr",
  "br",
  "wbr",
]);

// elements that provide structure or style but are not interactive and don't need to be wrapped, but should keep their content
const CONTENT_CONTAINER_ELEMENTS = new Set([
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "small",
  "mark",
  "del",
  "ins",
  "sub",
  "sup",
  "q",
  "cite",
  "abbr",
  "time",
  "code",
  "kbd",
  "samp",
  "var",
  "dfn",
  "bdi",
  "bdo",
  "ruby",
  "rt",
  "rp",
]);
