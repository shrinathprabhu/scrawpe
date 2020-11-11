let puppeteer = require("puppeteer");
let StealthPlugin = require("puppeteer-extra-plugin-stealth");
let cheerio = require("cheerio");
const chalk = require("chalk");

class Scrawpe {
  constructor() {}

  /**
   * @param {String | URL} url URL to be crawled (FQDN)
   * @param {{
   * browserdump?: Boolean,
   * durationToWaitFor?: Number,
   * forScraping?: Boolean,
   * headful?: Boolean,
   * incognito?: Boolean,
   * pageAuthentication?: {username: String, password: String},
   * pipe?: Boolean,
   * plugin?: 'chrome' | 'firefox',
   * selectorToWaitFor?: String,
   * slowMo?: Number,
   * stealthMode?: Boolean,
   * userAgent?: String,
   * userDataDirectoryPath?: String,
   * viewport?: {width?: Number, height?: Number, isMobile?: Boolean, hasTouch?: Boolean, isLandscape?: Boolean, deviceScaleFactor?: Number},
   * }} options
   * @returns {Promise<Scrape | string>}
   */
  async crawl(url, options = {}) {
    if (!url || !url.trim()) {
      throw new Error(chalk.redBright("Url is required"));
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
    launchOptions.timeout = 90000;
    launchOptions.handleSIGHUP = true;
    launchOptions.handleSIGINT = true;
    launchOptions.handleSIGTERM = true;
    console.debug(chalk.blueBright("Launching crawler..."));
    let browser = await crawler.launch(launchOptions);
    try {
      console.debug(chalk.greenBright("Crawler launched"));
      if (BooleanCheck(options.incognito)) {
        console.debug(chalk.blueBright("Setting incognito mode..."));
        browser = browser.createIncognitoBrowserContext();
        console.debug(
          chalk.greenBright("Page will now open in incognito mode")
        );
      }
      console.debug(chalk.blueBright("Visiting the page", url));
      let page = await browser.newPage();
      try {
        if (options.pageAuthentication) {
          console.debug(
            chalk.yellowBright("Adding authentication before loading...")
          );
          await page.authenticate(options.pageAuthentication);
        }
        console.debug(chalk.yellowBright("Page is loading..."));
        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 90000,
        });
        console.debug(chalk.cyanBright("Initial page loaded"));
        // FIXME improve scrolling logic for infinite loading pages
        console.debug(chalk.blueBright("Attempting to scroll once..."));
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
        console.debug(chalk.yellowBright("Waiting for 3 more seconds"));
        await page.waitForTimeout(3000);
        if (options.selectorToWaitFor) {
          console.debug(
            chalk.magentaBright(
              "Waiting for user specified selector to load..."
            )
          );
          await page.waitForSelector(options.selectorToWaitFor);
        } else if (options.durationToWaitFor) {
          console.debug(
            chalk.magentaBright("Waiting for user specified duration...")
          );
          await page.waitForTimeout(options.durationToWaitFor);
        }
        let html = await page.content();
        console.log(chalk.greenBright("Content fetched. Closing browser"));
        await page.close();
        await browser.close();
        if (BooleanCheck(options.forScraping)) {
          return new Scrape(html);
        } else {
          return html;
        }
      } catch (e) {
        await page.close();
        await browser.close();
        throw e;
      }
    } catch (e) {
      await browser.close();
      throw e;
    }
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
}

function BooleanCheck(value) {
  return value === true || value === false;
}

class Scrape {
  #root;
  constructor(htmlString) {
    let scraper = cheerio;
    this.#root = scraper.load(htmlString);
  }
  /**
   * @param {String} selector CSS type or jQuery type query selectors
   * @param {{
   * formEl?: Boolean,
   * html?: Boolean,
   * attr?: String,
   * }} options
   * @returns {String}
   */
  scrape(selector, options = {}) {
    // if (!selector) {
    //   throw new Error(chalk.redBright("Selector is required to scrape"));
    // }
    if (this.#root(selector).length) {
      if (BooleanCheck(options.formEl)) {
        return this.#root(selector).val();
      }
      if (BooleanCheck(options.html)) {
        return this.#root(selector).html();
      }
      if (options.attr) {
        return this.#root(selector).attr(options.attr);
      }
      return this.#root(selector).text();
    } else
      throw new Error(
        chalk.red("Following selector is not present in the dom")
      );
  }
}

module.exports = Scrawpe;
