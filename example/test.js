var spider = require('relspider'),
  mongoSpider = require('../'),
  options;

if (process.argv.length < 3) {
  console.log('Need a db arg');
  process.exit(1);
}

options = mongoSpider(process.argv[2], process.argv[3] || 'rels');

spider(function () {
  options.db.close();
  console.log("\nDone!\n");
}, options);
