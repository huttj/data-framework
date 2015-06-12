var promise = require('bluebird');
var config  = require('./config.json');
var schema  = new (require('caminte').Schema)('sqlite', { name: 'sqlite', database: "database.db" });
var fs      = require('fs');
var util    = require('./util');
var log     = require('./log');

var PATH    = 'schema';

// Generate models
var data = fs.readdirSync(PATH).reduce(reduceFn, {
    relations: [],
    schemas: {},
    models: {}
});

// Establish relationships
data.relations.forEach(function (def) {
    log(def.source + '\t' + def.relation + '\t' + def.target);
    var source   = def.source;
    var target   = def.target;
    var relation = def.relation;
    if (source && target && relation) {
        data.models[source][relation](data.models[target], { as: target });
    }
});

// Sync DB
if (!schema.isActual()) {
    schema.autoupdate();
}

// Done!
module.exports = data;

function reduceFn(data, file) {
    var modelName = util.delimitedToTitle(match(file, /([^.]+)\.json/));

    if (modelName) {
        var json = require('./' + PATH + '/' + file);
        createModel(json);
    }

    return data;

    function createModel(json) {
        var def       = translateSchema(modelName, json);
        var model     = schema.define(modelName, def.schema);

        Object.keys(model).forEach(function(key) {
            if (!match(key, /Async/) && typeof model[key] === 'function') {
                model[key + 'Async'] = promise.promisify(model[key]);
            }
        });

        data.relations = data.relations.concat(def.relations);
        data.schemas[modelName] = json;
        data.models[modelName]  = model;
    }

}

function match(str, regex) {
    var res = str.match(regex);
    if (res) res = res[1];
    return res;
}

function translateSchema(modelName, obj) {
    var result = {
        schema: {},
        relations: []
    };

    var typeMap = {
        string: String,
        number: Number,
        boolean: Boolean,
        date: Date,
        text: schema.Text,
        array: String
    };

    var relationMap = {
        '-': 'belongsTo',
        '<': 'hasMany',
        '>': 'belongsTo',
        '=': 'hasMany'
    };

    Object.keys(obj).forEach(function (key) {
        // If the type definition is not an array (enum)...
        if (typeof obj[key] === 'string') {

            // See if it's a known type mapping
            var type = typeMap[obj[key].toLowerCase()];
            if (type) {
                result.schema[key] = type;

            // It must be a relation
            } else {
                var relation = relationMap[obj[key][0]];
                var targetModel = util.delimitedToTitle(obj[key].substr(1));
                result.relations.push({
                    source: modelName,
                    target: targetModel,
                    relation: relation
                });
            }

        // If it is an enum...
        } else if (obj[key].map) {
            result.schema[key] = typeMap.array;

        // What the heck?!
        } else {
            throw new Error('unrecognized schema type: ' + typeof obj[key] + ' ' + modelName);
        }
    });

    result.schema = util.escapeKeys(result.schema);

    log('\n', result.schema);

    return result;
}