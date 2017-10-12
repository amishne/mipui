// Prints the db summary as csv.

const fs = require('fs');
const JSONStream = require('JSONStream');

const stream = fs.createReadStream(process.argv[2]);
const parser = JSONStream.parse('maps.$*');

parser.on('data', data => {
  const mid = data.key;
  const created = new Date(data.value.metadata.created).toISOString();
  const readonlyLink = 'https://www.mipui.net/app/index.html?mid=' + mid;
  const numOperations =
      data.value.payload && data.value.payload.latestOperation ?
        data.value.payload.latestOperation.i.n : -1;
  console.log(`${mid},${created},${numOperations},${readonlyLink}`);
});

stream.pipe(parser);
