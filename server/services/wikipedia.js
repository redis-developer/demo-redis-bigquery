import fs from "fs/promises";
import path from "path";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const jsonPath = path.resolve("assets/circuit_images.json");
const query =
  "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=";
const titleRegex = /[^\/]*$/g;

export async function findImageUrl(url) {
  try {
    if (typeof url !== "string") {
      return;
    }

    const existingImage = await findImageFromFile(url);

    if (existingImage) {
      return existingImage;
    }

    const urlResponse = await fetch(url, {
      method: "GET",
    });

    if (!urlResponse.ok) {
      return;
    }

    const dom = new JSDOM(await urlResponse.text());
    const h1 = dom.window.document.querySelector("h1")?.textContent;
    const responseUrl = urlResponse.url ?? url;
    const [title] = h1 ? [h1] : (responseUrl.match(titleRegex) ?? []);

    if (!title) {
      return;
    }
    const result = await fetch(`${query}${title}`);

    if (!result.ok) {
      return;
    }

    const data = await result.json();
    const pages = data.query.pages;

    for (let article of Object.values(pages)) {
      if (typeof article.original.source === "string") {
        await saveImage(url, article.original.source);
        return article.original.source;
      }
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * Reads or creates the circuits file and returns the data
 */
async function readCircuitsFile() {
  try {
    await fs.access(jsonPath);
  } catch (e) {
    await fs.writeFile(jsonPath, "{}");
  }

  const file = await fs.readFile(jsonPath);

  return JSON.parse(file);
}

/**
 * Finds images in the circuits file for a given url
 *
 * @param {string} url
 * @returns {Promise<string | undefined>}
 */
async function findImageFromFile(url) {
  const data = await readCircuitsFile();

  return data[url];
}

/**
 * Saves circuit images to a file
 * @param {string} url The circuit wikipedia url
 * @param {string} imageUrl The circuit image url
 */
async function saveImage(url, imageUrl) {
  const data = await readCircuitsFile();
  data[url] = imageUrl;

  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
}
