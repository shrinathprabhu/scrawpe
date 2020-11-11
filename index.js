let puppeteer = require("puppeteer");
let StealthPlugin = require("puppeteer-extra-plugin-stealth");
let cheerio = require("cheerio");

class Scrawpe {
  constructor() {}

  /**
   * @param {{
   * stealthMode?: Boolean,
   * url: String | URL,
   * plugin?: 'chrome' | 'firefox',
   * durationToWaitFor?: Number,
   * pipe?: Boolean,
   * slowMo?: Number,
   * viewport?: {width?: Number, height?: Number, isMobile?: Boolean, hasTouch?: Boolean, isLandscape?: Boolean, deviceScaleFactor?: Number},
   * browserdump?: Boolean,
   * headful?: Boolean,
   * userDataDirectoryPath?: String,
   * incognito?: Boolean,
   * userAgent?: String,
   * selectorToWaitFor?: String,
   * pageAuthentication?: {username: String, password: String}
   * }} options
   * @returns {Promise<Scrawpe>}
   */
  async crawl(options = {}) {
    if (!options.url || !options.url.trim()) {
      throw new Error("Url is required");
    }
    let crawler = puppeteer;
    if (BooleanCheck(options.stealthMode)) {
      crawler.use(StealthPlugin());
    }
    let launchOptions = {};
    if (options.plugin) {
      launchOptions.product = options.plugin;
    }
    if (BooleanCheck(options.pipe)) {
      launchOptions.pipe = options.pipe;
    }
    if (options.slowMo) {
      launchOptions.slowMo = options.slowMo;
    }
    if (options.viewport) {
      launchOptions.defaultViewport = options.viewport;
    }
    if (BooleanCheck(options.browserdump)) {
      launchOptions.dumpio = options.browserdump;
    }
    if (BooleanCheck(options.headful)) {
      launchOptions.headless = !options.headful;
    } else {
      launchOptions.headless = true;
    }
    if (options.userDataDirectoryPath) {
      launchOptions.userDataDir = options.userDataDirectoryPath;
    }
    launchOptions.handleSIGHUP = true;
    launchOptions.handleSIGINT = true;
    launchOptions.handleSIGTERM = true;
    console.debug("Launching crawler");
    let browser = await crawler.launch(launchOptions);
    console.debug("Crawler launched");
    console.debug("Visiting the page", options.url);
    if (BooleanCheck(options.incognito)) {
      browser = browser.createIncognitoBrowserContext();
    }
    let page = await browser.newPage();
    await page.goto(options.url, {
      waitUntil: "networkidle2",
    });
    if (options.pageAuthentication) {
      await page.authenticate(options.pageAuthentication);
    }
    if (options.selectorToWaitFor) {
      await page.waitForSelector(options.selectorToWaitFor);
    } else if (options.durationToWaitFor) {
      await page.waitForTimeout(options.durationToWaitFor);
    }
    let html = await page.content();
    console.log("Content fetched. Closing browser");
    await page.close();
    await browser.close();
    return {
      html,
      scrape,
    };
  }

  /**
   *
   * @param {{
   * selector: String,
   * innerHtml?: Boolean,
   * outerHtml?: Boolean,
   * textContent?: Boolean,
   *
   * }} options
   */
  scrape(options) {
    let scraper = cheerio;
    const root = scraper.load(this.html).root();
  }
}

function BooleanCheck(value) {
  return value === true || value === false;
}

module.exports = Scrawpe;
