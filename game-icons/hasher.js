// Add a hash to all entries in game_icons.json.

const fs = require('fs');
const path = require('path');
const input = require('../public/app/assets/game_icons.json');

function hashString(s) {
  // http://stackoverflow.com/a/15710692
  return s.split('').reduce(function(a,b) {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a&a;
  }, 0);
}

input.forEach(icon => {
  icon.hash = hashString(icon.path);
});

fs.writeFile("public/app/assets/game-icons.js",
    'const gameIcons = ' + JSON.stringify(input, null, 2) + '\n;', "utf8");
