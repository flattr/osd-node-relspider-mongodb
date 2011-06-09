var mongo = require('mongoq'),
  Step = require('step'),
  // Pluggable functions for saving relations
  toFetch, handleResponse;

module.exports = function (db, col) {
  db = mongo(db);
  col = db.collection(col);
  return {
    db : db,
    col : col,
    toFetch : toFetch,
    handleResponse : handleResponse
  };
};


module.exports.toFetch = toFetch = function (callback) {
  this.col.findItems({
    fetched: {$exists: false},
    fetching: {$exists: false}
  }, {limit: 1}, function (err, doc) {
    var result = [];
    doc.forEach(function (page) {
      result.push(page.name);
    });
    callback(result);
  });
};
module.exports.handleResponse = handleResponse = function (page, result, callback) {
  var options = this,
    relationsUpdate = {},
    pageUpdate = {},
    i;

  options.col.findItems({name: page}, function (err, doc) {
    var existingPage = doc[0];

    Object.keys(result).forEach(function (rel) {
      Object.keys(result[rel]).forEach(function (relation) {
        if (page === relation) {
          return;
        }

        pageUpdate['relations.' + rel] = pageUpdate['relations.' + rel] || {$each : []};
        pageUpdate['relations.' + rel].$each.push(relation);

        relationsUpdate[relation] = relationsUpdate[relation] || {};
        relationsUpdate[relation]['relationsReverse.' + rel] = page;

        if (existingPage.relationsReverse && existingPage.relationsReverse[rel] && existingPage.relationsReverse[rel].indexOf(relation) !== -1) {
          pageUpdate['relationsBidirectional.' + rel] = pageUpdate['relationsBidirectional.' + rel] || {$each : []};
          pageUpdate['relationsBidirectional.' + rel].$each.push(relation);
          relationsUpdate[relation]['relationsBidirectional.' + rel] = page;
        }
      });
    });

    options.col.update({name: page}, {$addToSet: pageUpdate, $set: {fetched : Date.now()}});

    for (i in relationsUpdate) {
      if (relationsUpdate.hasOwnProperty(i)) {
        options.col.update({name: i}, {$addToSet: relationsUpdate[i]}, {upsert: true});
      }
    }

    callback();
  });
};
