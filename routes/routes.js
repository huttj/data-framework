var promise = require('bluebird');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var log = require(__basedir + 'log');
var util = require(__basedir + 'util');

// Redirect general api calls to latest version
//router.get(/\/api\/(?!v\d)(.*)/, function (req, res, next) {
//    var path = req.params[0] + '';
//    res.redirect('/api/v1/' + path);
//});

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

router.route('/:type/new')
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
                l[modelName] = model.allAsync().then(toObjectUnescapeProps);
            }
            return l;
        }, {});

        promise.props(modelRefs).then(function (modelRefs) {
            log(modelRefs);
            variables.modelRefs = modelRefs;
            res.render('new', variables);
        });

        function toObjectUnescapeProps(arry) {
            return arry.map(function (o) {
                return util.unescapeProps(o.toObject());
            });
        }

    })
    .post(function(req, res, next) {

        var modelName = req.params.type;
        var data = util.escapeKeys(req.body);

        log(req.body, data, modelName);

        // In case posting from "Save as New"
        delete data.id;

        req.models[modelName].create(data, function() {
            res.redirect('/' + modelName);
        });

    });

router.route('/:entity')
    .get(function(req, res, next) {

        var type   = req.params.entity;
        var schema = req.schemas[type];
        var model  = req.models[type];

        var fks = req.fks[type].reduce(function(l, n) {
            log(n);
            l[n.propName] = n.modelName;
            return l;
        }, {});

        log(fks);

        var variables = {
            title: 'Express',
            schemas: req.schemas,
            schema: schema,
            util: req.util,
            entity: type,
            fks: fks
        };

        model.allAsync()
            .then(getFullModels)
            .then(function (models) {
                log(models);
                variables.models = models.map(util.unescapeKeys);
                res.render('entity-list', variables);
            });

        function getFullModels(models) {
            return Promise.all(models.map(function(model) {
                return model.getFullModel();
            }));
        }

    });

router.route('/:entity/:id')
    .get(function(req, res, next) {

        var id     = req.params.id;
        var type   = req.params.entity;
        var schema = req.schemas[type];
        var model  = req.models[type];

        var variables = {
            title: 'Express',
            schemas: req.schemas,
            schema: schema,
            util: req.util,
            entity: type
        };

        var modelRefs = Object.keys(schema).reduce(function(l, key) {
            var modelName = schema[key].substr && schema[key].substr(1);
            var model = req.models[modelName];
            if (model) {
                l[modelName] = model.allAsync().then(function(models) {
                    return models.map(function(model) {
                        return util.unescapeProps(model.toObject());
                    });
                });
            }
            return l;
        }, {});

        var m = model.findByIdAsync(id);

        promise.props(modelRefs)
            .then(function (modelRefs) {
                variables.modelRefs = modelRefs;
            })
            .then(function () {
                return m;
            })
            .then(getFullModel)
            .then(function (model) {
                variables.model = util.unescapeKeys(model);
                log(variables.model);
                res.render('entity-detail', variables);
            });

        function getFullModel(model) {
            return model.getFullModel();
        }

        function toObject(o) {
            return o.toObject();
        }

    })
    .post(function(req, res) {

        var modelName = req.params.entity;
        var model     = req.models[modelName];
        var data      = util.escapeKeys(req.body);

        Object.keys(data).forEach(function(key) {
            var num = Number(data[key]);
            if (data[key] !== '' && !isNaN(num)) {
                data[key] = num;
            }
        });

        var id = data.id;

        log(data, id);

        model.update({ id: id }, data, function() {
            res.redirect('/' + modelName);
        });

    });

router.route('/:entity/:id/delete')
    .post(function(req, res) {

        var id        = req.params.id;
        var modelName = req.params.entity;
        var model     = req.models[modelName];
        var data      = util.escapeKeys(req.body);

        model.destroyById(id, function() {
            res.redirect('/' + modelName);
        });

    });

module.exports = router;
