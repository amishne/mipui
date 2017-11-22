// Extracts the input map.

const fs = require('fs');
const JSONStream = require('JSONStream');

const stream = fs.createReadStream(process.argv[3]);
const mid = process.argv[2];
const parser = JSONStream.parse('maps.$*');

parser.on('data', data => {
  if (data.key == mid) {
    console.log(JSON.stringify(data.value, null, 2));
  }
});

stream.pipe(parser);
