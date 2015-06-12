var express = require('express');
var router = express.Router();

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
router.get('/:entityId', function(req, res, next) {
  var entity = req.params.entityId;

  res.send(entity);
});

module.exports = router;
