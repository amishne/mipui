const fs = require('fs');

const filename = process.argv[2];
const raw = fs.readFileSync(filename);
const pstate = JSON.parse(raw);

for (const cellKey of Object.keys(pstate.content)) {
  const cellContent = pstate.content[cellKey];
  if (!cellContent.hasOwnProperty(4)) continue;
  cellContent[4].k = 0;
}

fs.writeFileSync(filename, JSON.stringify(pstate));
