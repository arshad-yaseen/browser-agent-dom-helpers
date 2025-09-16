import { minify } from "html-minifier-terser";
import { HTMLRewriter } from "html-rewriter-wasm";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cleanedHtml = "";

const rewriter = new HTMLRewriter((outputChunk) => {
	cleanedHtml += decoder.decode(outputChunk);
});

export async function cleanHtml(html: string): Promise<string> {
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
		.on("iframe", {
			element(el) {
				const src = el.getAttribute("src") || "no-src";
				const id = el.getAttribute("id");
				const className = el.getAttribute("class");
				const name = el.getAttribute("name");
				for (const [attrName] of el.attributes) {
					el.removeAttribute(attrName);
				}
				if (id) el.setAttribute("id", id);
				if (className) el.setAttribute("class", className);
				if (name) el.setAttribute("name", name);
				el.setAttribute("src", src);
				el.setInnerContent(`[IFRAME: ${src}]`);
			},
		})
		.on("*", {
			element(el) {
				const tagName = el.tagName;
				const isInteractive = INTERACTIVE_ELEMENTS.has(tagName);
				const isStructural = STRUCTURAL_ELEMENTS.has(tagName);
				let hasEventHandler = false;
				const attributesToRemove: string[] = [];
				for (const [name] of el.attributes) {
					if (name.startsWith("on")) {
						hasEventHandler = true;
						el.setAttribute(name, "[handler]");
						continue;
					}
					if (name.startsWith("data-")) {
						if (
							!name.match(
								/^data-(testid|test|cy|qa|id|name|value|action|target)/,
							)
						) {
							attributesToRemove.push(name);
						}
						continue;
					}
					if (name.startsWith("aria-")) {
						continue;
					}
					if (!ESSENTIAL_ATTRIBUTES.has(name)) {
						attributesToRemove.push(name);
					}
				}
				for (const attr of attributesToRemove) {
					el.removeAttribute(attr);
				}
				if (!isInteractive && !isStructural && !hasEventHandler) {
					const keepTags = new Set([
						"html",
						"head",
						"body",
						"title",
						"br",
						"hr",
						"wbr",
					]);
					if (!keepTags.has(tagName)) {
						el.removeAndKeepContent();
					}
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

// set of interactive elements that must be preserved
const INTERACTIVE_ELEMENTS = new Set([
	"a",
	"button",
	"input",
	"textarea",
	"select",
	"option",
	"optgroup",
	"form",
	"label",
	"iframe",
	"video",
	"audio",
	"details",
	"summary",
	"dialog",
	"menu",
	"menuitem",
	"fieldset",
	"legend",
	"datalist",
	"output",
	"progress",
	"meter",
	"embed",
	"object",
	"param",
	"track",
	"map",
	"area",
]);

// attributes essential for selection and understanding element purpose
const ESSENTIAL_ATTRIBUTES = new Set([
	"id",
	"class",
	"name",
	"data-testid",
	"data-test",
	"data-cy",
	"data-qa",

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
	"tabindex",
	"contenteditable",
	"draggable",
	"spellcheck",
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
]);

// elements that provide structure but aren't interactive
const STRUCTURAL_ELEMENTS = new Set([
	"div",
	"span",
	"section",
	"article",
	"main",
	"header",
	"footer",
	"nav",
	"aside",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"p",
	"ul",
	"ol",
	"li",
	"dl",
	"dt",
	"dd",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"td",
	"th",
	"caption",
	"col",
	"colgroup",
	"blockquote",
	"pre",
	"code",
	"figure",
	"figcaption",
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
	"address",
]);
