let Scrawpe = require("./index");

new Scrawpe()
  .crawl(
    "https://www.google.com/search?q=aryabhatta&oq=aryabhatta&aqs=chrome..69i57.3548j0j7&sourceid=chrome&ie=UTF-8",
    {
      forScraping: true,
    }
  )
  .then((dom) => {
    console.log(dom.scrape("#result-stats", { attr: "id" }));
    console.log(dom.scrape("#rhs"));
    console.log(dom.scrape("input[title='Search']", { formEl: true }));
  })
  .catch((e) => console.log(e));
