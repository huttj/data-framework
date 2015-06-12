var promise = require('bluebird');
var config  = require('./config.json');
var schema  = new (require('caminte').Schema)('sqlite', { name: 'sqlite', database: "database.db" });
var fs      = require('fs');
var util    = require('./util');

var PATH    = 'schema';

var data = fs.readdirSync(PATH).reduce(reduceFn, {
    schemasFlat: {},
    schemas: {},
    models: {}
});

if (!schema.isActual()) {
    schema.autoupdate();
}

module.exports = data;

function reduceFn(data, file) {
    var modelName = match(file, /([^.]+)\.json/);

    if (modelName) {
        var json = require('./' + PATH + '/' + file);
        createModel(json);
    }

    return data;

    function createModel(json) {
        var flattened = util.collapse(json, '_');
        var def       = translateSchema(flattened);
        var model     = schema.define(modelName, def);

        Object.keys(model).forEach(function(key) {
            if (!match(key, /Async/) && typeof model[key] === 'function') {
                model[key + 'Async'] = promise.promisify(model[key]);
            }
        });

        data.schemasFlat[modelName] = flattened;
        data.schemas[modelName]     = json;
        data.models[modelName]      = model;
    }

}

function match(str, regex) {
    var res = str.match(regex);
    if (res) res = res[1];
    return res;
}

function translateSchema(obj) {
    var result = {};

    var map = {
        string: String,
        number: Number,
        boolean: Boolean,
        date: Date,
        text: schema.Text,
        array: String
    };

    Object.keys(obj).forEach(function (key) {
        if (typeof obj[key] === 'string') {
            result[key] = map[obj[key]] || String;
        } else if (obj[key].map) {
            result[key] = map.array;
        } else {
            throw new Error('unrecognized schema type: ' + typeof obj[key]);
        }
    });

    return result;
}