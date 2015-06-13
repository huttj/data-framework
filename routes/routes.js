var promise = require('bluebird');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var log = require(__basedir + 'log');
var util = require(__basedir + 'util');

// Redirect general api calls to latest version
router.get(/\/api\/(?!v\d)(.*)/, function (req, res, next) {
    var path = req.params[0] + '';
    res.redirect('/api/v1/' + path);
});

/* GET home page. */
router.get('/', function(req, res, next) {

    // console.log(Object.keys(req.models.fatality));

    var variables = {
        schemas: req.schemas,
        util: req.util,
        title: 'Express'
    };

    var counts = Object.keys(req.models).reduce(function(list, schema) {
        list[schema] = req.models[schema].countAsync({});
        return list;
    }, {});

    promise.props(counts)
        .then(function(counts) {
            variables.counts = counts;
            res.render('index', variables);
        })
        .catch(function(err) {
            next(err);
        });


});

router.route('/submit/:type')
    .get(function(req, res, next) {

        var variables = {
            title: 'Express',
            schemas: req.schemas,
            util: req.util,
            schema: req.params.type
        };

        var type = req.params.type;
        var schema = req.schemas[type];

        var modelRefs = Object.keys(schema).reduce(function(l, key) {
            var modelName = schema[key].substr && schema[key].substr(1);
            var model = req.models[modelName];
            if (model) {
                l[modelName] = model.allAsync();
            }
            return l;
        }, {});

        promise.props(modelRefs).then(function (modelRefs) {
            log(modelRefs);
            variables.modelRefs = modelRefs;
            res.render('submit', variables);
        })

    })
    .post(function(req, res, next) {

        var modelName = req.params.type;
        var data = util.escapeKeys(req.body);

        log(req.body, data, modelName);

        req.models[modelName].create(data, function() {
            res.redirect('/');
        });

    });


module.exports = router;
