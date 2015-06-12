var config  = require('./config.json');
var schema = new (require('caminte').Schema)('sqlite', { name: 'sqlite', database: "database.db" });
var promise = require('bluebird');
var fs      = promise.promisifyAll(require('fs'));
var util    = require('./util');

var PATH    = 'schema';

module.exports = fs.readdirAsync(PATH).then(readFiles);

function readFiles(files) {

    var modelPromises = files.reduce(reduceFn, {});

    return promise.props(modelPromises);

    function reduceFn(models, file) {
        var modelName = match(file, /([^.]+)\.json/);
        if (modelName) {
            return loadJson(file).then(createModel).then(addToModels);
        } else {
            return models;
        }

        function loadJson(file) {
            return fs.readFileAsync(PATH + '/' + file, 'utf8').then(JSON.parse)
        }

        function createModel(json) {
            var flattened = util.collapse(json);
            var def = translateSchema(flattened);
            return schema.define(modelName, def);
        }

        function addToModels(model) {
            models[modelName] = model;
            return models;
        }
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
        //text: schema.Text,
        array: String
    };

    Object.keys(obj).forEach(function(key) {
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