const URL = require('url-parse');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

var c;

var crawl = {
  
  settings: {
    dir: './sitemaps',
    startURL: '',
    url: '',
    baseURL: '',
    maxPagesToVisit: 5,
    numPagesVisited: 0,
    pagesToVisit: [],
    pagesVisited: new Map()
  },

  init: function(startURL, maxPagesToVisit) {
    _this = this;
    c = _this.settings;
    c.startURL = startURL;
    c.url = new URL(startURL);
    c.baseURL = c.url.protocol + "//" + c.url.hostname,
    c.maxPagesToVisit = maxPagesToVisit;
    c.outputFile = c.dir + '/' + c.url.hostname + '_sitemap.csv';
    c.pagesToVisit.push(startURL);
    _this.newFile().then(
      result => _this.spider(),
      error => console.log(error));
  },

  newFile: function() {
    return new Promise((resolve, reject) => {

      if (!fs.existsSync(c.dir)){
        fs.mkdirSync(c.dir);
      }

      let header = 'URL^Title^Description^Keywords\n';
      fs.writeFile(c.outputFile, header, (err) => {
        if (err) reject(err);
        else resolve(console.log(c.outputFile + ' has been created!'));
      });
    });
  },

  spider: function() {
    if(c.numPagesVisited >= c.maxPagesToVisit) {
      console.log("Reached max limit of number of pages to visit.");
      return;
    }

    let nextPage = c.pagesToVisit.pop();
    
    if (c.pagesVisited.has(nextPage)) {
      // We've already visited this page, so repeat the crawl
      _this.spider();
    } else {
      // New page we haven't visited
      _this.visitPage(nextPage).then(
        result => _this.spider(),
        error => console.log(error));
    }
  },

  visitPage: function(pageUrl) {
    return new Promise((resolve, reject) => {
      // Ensure we have a valid url
      if(pageUrl && pageUrl != undefined) {
        // Add page to our map
        c.pagesVisited.set(pageUrl, true);

        // Increment page counter
        c.numPagesVisited++;
        
        // Make the request
        console.log("Visiting page: " + pageUrl);
        
        request(pageUrl, function (error, response, body) {
          // Print the error if one occurred
          console.log('Error: ', error); 

          // Check status code if a response was received (200 is HTTP OK)
          console.log('Status Code: ', response && response.statusCode);

          // Print the HTML for the document
          // console.log('Body: ', body); 

          if(response.statusCode == 200) {
            // Parse the document body
            const $ = cheerio.load(body);
            // Get links from document
            _this.collectInternalLinks($);

            // Gets the text of the title tag
            const title = $('title').text(); 
            // Gets the contents of the description metatag.
            const description = $('meta[name="description"]').attr('content'); 
            // Gets the contents of the keywords metatag.
            const keywords = $('meta[name="keywords"]').attr('content'); 

            // Writes data to file.
            fs.appendFile(c.outputFile, '"' + pageUrl + '"^"' + title + '"^"' + description + '"^"' + keywords + '"\n', (err) => {
              if (err) reject(err);
              else resolve(console.log('"' + pageUrl + '"^"' + title + '"^"' + description + '"^"' + keywords + '"\n'));
            });
          }
        });
      }
    })
  },
  
  collectInternalLinks: function($) {
      const relativeLinks = $("a[href^='/']");
      const absoluteLinks = $("a[href^='" + c.url.href +"']");
      let relativeLinksLength = 0;
      let absoluteLinksLength = 0;

      relativeLinks.each(function() {
        let path = $(this).attr('href');
        // console.log(c.url.href + path);
        if(!c.pagesVisited.has(c.url.href + path) && c.pagesToVisit.indexOf(c.url.href + path) < 0) {
          relativeLinksLength++;
          c.pagesToVisit.push(c.url.href + path);
        }
      });

      absoluteLinks.each(function() {
        let path = $(this).attr('href');
        // console.log(path);
        if(!c.pagesVisited.has(path) && c.pagesToVisit.indexOf(path) < 0) {
          absoluteLinksLength++;
          c.pagesToVisit.push(path);
        }
      });

      console.log("Found " + relativeLinksLength + " new relative and " + absoluteLinksLength + " new absolute links.");
      console.log('Pages Visited');
      console.log(c.pagesVisited);
      console.log('Pages To Visit');
      console.log(c.pagesToVisit);
  }
}

module.exports = { crawl };