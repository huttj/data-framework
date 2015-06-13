var express = require('express');
var Promise = require('bluebird');
var router  = express.Router();
var util    = require(__basedir + 'util');
var log     = require(__basedir + 'log');

router.get('/', function(req, res) {
  var routes = {
    '/': 'This list of API routes',
    '/entities': 'A list of all of the entities types in the database',
    '/:entityType': 'A list of all of the entities of a specific type',
    '/:entityType/:id': 'The data for a specific entity, by ID'
  };

  res.send(routes);
});

router.get('/entities', function(req, res, next) {
  res.send(Object.keys(req.schemas));
});

/* GET users listing. */
router.get('/:entityType', function(req, res, next) {

  var entity = util.delimitedToTitle(req.params.entityType);
  var query  = req.query;

  log('GET', '/' + entity, query);

  // Process all of the foreign relation parts of the query string
  req.fks[entity].forEach(function(fk) {
    var param = fk.propName;
    var model = req.models[fk.modelName];
    var val   = query[fk.propName];

    if (val !== undefined) {

      // It's empty...ignore it
      if (val === '') {
        log('param is empty', val);
        delete query[param];
        return;
      }

      // If it's a number, it'll be used as an ID
      if (!isNaN(Number(val)) && val !== '') {
        log('param is number', val);
        return;
      }

      // It's an array of IDs!
      if (val.match(/^\[(?: ?\d+,)* ?\d+\]$/)) {
        log('param is array', val);
        query[param] = { 'in': JSON.parse(val) };
        return;
      }

      // Try it as a query
      var rawsubquery = val.match(/\(([^()]+)\)/);
      if (rawsubquery && rawsubquery[1]) {

        var subquery = { where: parseSubquery(rawsubquery[1]) };

        log('param is subquery', subquery);

        query[param] = model
            .findAsync(subquery)
            .then(getIds)
            .catch(blankInClause);

        return;
      }

      // Try matching it on the name
      log('param is Name', val);
      if (val[0] === '~') val = { nlike: val.substr(1) };
      var nameQuery = { where: { Name: val } };
      log('nameQuery', nameQuery, param, model);
      query[param] = model
          .allAsync(nameQuery)
          .then(getIds)
          .catch(blankInClause);
    }
  });

  if (query.limit) {
    query.limit = Number(query.limit);
  }

  if (query.skip) {
    query.skip  = Number(query.skip);
  }

  if (query.page) {
    query.skip = (Number(query.limit) || 1) * (Number(query.page) - 1);
  }

  // Get all matching entities
  Promise.props(query)
    .then(function(q) {
      req.models[entity].findAsync({ where: q })
          .then(function (entities) {
            return Promise.all(entities.map(function(entity) {
              return entity.getFullModel();
            }))
          })
          .then(send)
          .catch(send);
    });

  function send(d) {
    //log(d.stack || d);
    res.send(JSON.stringify(d.stack || d, 2));
  }

  function getIds(objs) {
    return {
      'in': objs.map(function (obj) { return obj.id; })
    };
  }

  function blankInClause() {
    return { 'in': [] };
  }

  function parseSubquery(subquery) {
    var q = {};
    subquery.split('&').forEach(function (term) {
      term = term.split('=');
      q[term[0]] = term[1];
    });
    return q;
  }

  //function getModelName(key) {
  //  var schema = req.schemas[entity];
  //  var prop   = schema[key.replace(/_/g, ' ')];
  //  log(key, prop, schema);
  //  if ('-=<>'.match(prop[0])) {
  //    return prop.substr(1);
  //  } else {
  //    return key;
  //  }
  //}

});

module.exports = router;