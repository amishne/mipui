// Goes over the files in public/assets/icons and produces a JSON with
// path and metadata for each.

const fs = require('fs');
const path = require('path');
const scrapeIt = require('scrape-it');
const process = require('process');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

function hashString(s) {
  // http://stackoverflow.com/a/15710692
  return s.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
}

function flatten(arr) {
  return arr.reduce(
      (acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);
}

function getPaths(dir) {
  return flatten(fs.readdirSync(dir)
      .map(file => fs.statSync(path.join(dir, file)).isDirectory() ?
        getPaths(path.join(dir, file)) :
        path.join(dir, file).replace(/\\/g, '/')));
}

function getName(path) {
  const parts = path.split('/');
  return parts[parts.length - 1].replace('.svg', '');
}

function scrapeTags(path, callback) {
  const sitePath = 'https://game-icons.net' +
      path
          .replace('/svg/000000/transparent', '')
          .replace('public/app/assets/icons', '')
          .replace('.svg', '.html');
  console.log('Scraping ' + sitePath);
  scrapeIt(sitePath, {
    tags: {
      listItem: 'a[rel = "tag"]',
    },
  }).then(page => {
    console.log(`Scraped from ${sitePath}: ${JSON.stringify(page)}`);
    callback(page.tags);
  });
}

function getIconsFromPathsStaggered(paths, icons, index, callback) {
  if (paths.length == icons.length) {
    callback(icons);
    return;
  }
  const path = paths[index];
  console.log(path);
  scrapeTags(path, tags => {
    const icon = {
      path,
      name: getName(path),
      tags,
      hash: hashString(path),
    };
    icons.push(icon);
    setTimeout(() => {
      getIconsFromPathsStaggered(paths, icons, index + 1, callback);
    }, 300);
  });
}

function getIconsFromPaths(paths, callback) {
  const icons = [];
  getIconsFromPathsStaggered(paths, icons, 0, callback);
}

const paths =
    getPaths('public/app/assets/icons/').filter(path => path.endsWith('.svg'));
getIconsFromPaths(paths, icons => {
  fs.writeFile('public/app/assets/game_icons.json',
      JSON.stringify(icons, null, 2), 'utf8');
});
