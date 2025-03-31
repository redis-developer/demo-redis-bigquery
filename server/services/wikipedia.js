import fs from "fs/promises";
import path from "path";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const circuitsFilePath = path.resolve("assets/circuit_images.json");
const driversFilePath = path.resolve("assets/driver_images.json");
const query =
  "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=";
const titleRegex = /[^\/]*$/g;

export async function findImageUrl(url, type) {
  if (typeof url !== "string") {
    return;
  }

  try {
    let existingImage;

    if (type === "circuit") {
      existingImage = await findCircuitImageFromFile(url);
    } else if (type === "driver") {
      existingImage = await findDriverImageFromFile(url);
    }

    if (typeof existingImage === "string") {
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
      if (typeof article.original?.source === "string") {
        if (type === "circuit") {
          await saveCircuitImage(url, article.original.source);
        } else if (type === "driver") {
          await saveDriverImage(url, article.original.source);
        }
        return article.original.source;
      } else {
        if (type === "circuit") {
          await saveCircuitImage(url, "");
        } else if (type === "driver") {
          await saveDriverImage(url, "");
        }

        console.log(`No image found for: ${url}`);
      }
    }
  } catch (e) {
    console.log(`Error getting image for: ${url}`);
    console.log(e);
  }
}

/**
 * Reads or creates the file and returns the data
 */
async function readFile(filePath) {
  try {
    await fs.access(filePath);
  } catch (e) {
    await fs.writeFile(filePath, "{}");
  }

  const file = await fs.readFile(filePath);

  return JSON.parse(file);
}

/**
 * Finds images in the circuits file for a given url
 *
 * @param {string} url
 * @returns {Promise<string | undefined>}
 */
async function findCircuitImageFromFile(url) {
  const data = await readFile(circuitsFilePath);

  return data[url];
}

/**
 * Saves circuit images to a file
 * @param {string} url The circuit wikipedia url
 * @param {string} imageUrl The circuit image url
 */
async function saveCircuitImage(url, imageUrl) {
  const data = await readFile(circuitsFilePath);
  data[url] = imageUrl;

  await fs.writeFile(circuitsFilePath, JSON.stringify(data, null, 2));
}

/** Finds images in the drivers file for a given url
 *
 * @param {string} url
 * @returns {Promise<string | undefined>}
 */
async function findDriverImageFromFile(url) {
  const data = await readFile(driversFilePath);

  return data[url];
}

/**
 * Saves drivers images to a file
 * @param {string} url The driver wikipedia url
 * @param {string} imageUrl The driver image url
 */
async function saveDriverImage(url, imageUrl) {
  const data = await readFile(driversFilePath);
  data[url] = imageUrl;

  await fs.writeFile(driversFilePath, JSON.stringify(data, null, 2));
}
