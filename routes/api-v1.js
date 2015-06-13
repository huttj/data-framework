var express = require('express');
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
  res.send(Object.keys(req.models));
});

/* GET users listing. */
router.get('/:entityType', function(req, res, next) {

  var entity = util.delimitedToTitle(req.params.entityType);
  log('GET', '/' + entity);

  req.models[entity].allAsync()
      .then(function (entities) {
        return Promise.all(entities.map(function(entity) {
          return entity.getFullModel().tap(log);
        }))
      })
      .then(send)
      .catch(send);

  function send(d) {
    //log(d.stack || d);
    res.send(JSON.stringify(d.stack || d, 2));
  }
});

module.exports = router;
