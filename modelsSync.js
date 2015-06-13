var Promise = require('bluebird');
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
    models: {},
    fks: {}
});

// Establish relationships
data.relations.forEach(function (def) {
    log(def.source + '\t' + def.relation + '\t' + def.target, 'on', def.foreignKey);

    var source   = def.source;
    var target   = def.target;
    var relation = def.relation;
    var key      = def.foreignKey;

    if (source && target && relation) {
        data.models[source][relation](data.models[target], { as: target + 's', foreignKey: key });

    }
});

Object.keys(data.models).forEach(function (modelName) {
    data.models[modelName].prototype.getFullModel = makeGetFullModel(modelName)
});

// Sync DB
if (!schema.isActual()) {
    //schema.autoupdate();
    //schema.automigrate(); // This kills the data
}

// Done!
module.exports = data;

function reduceFn(data, file) {
    var modelName = match(file, /([^.]+)\.json/);

    if (modelName) {
        var json = require('./' + PATH + '/' + file);
        createModel(json);
    }

    return data;

    function createModel(json) {

        log('translating schema', modelName);
        var def       = translateSchema(modelName, json);
        log('defining', modelName);
        var model     = schema.define(modelName, def.schema);

        Object.keys(model).forEach(function(key) {
            if (!match(key, /Async/) && typeof model[key] === 'function') {
                model[key + 'Async'] = Promise.promisify(model[key]);
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
    obj = util.escapeKeys(obj);

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
                var targetModel = obj[key].substr(1);
                result.relations.push({
                    source: modelName,
                    target: targetModel,
                    relation: relation,
                    foreignKey: key
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

    //result.schema = util.escapeKeys(result.schema);

    return result;
}

/**
 * This fn gets instantiated on a per-model basis and is attached to each
 * model. It uses the schema to loop through each of a model's foreign keys
 * and gets the actual object corresponding to that key.
 *
 * @param modelName
 * @returns {Function}
 */
function makeGetFullModel(modelName) {

    data.fks[modelName] = [];

    // Cache a list of the foreign keys corresponding to the model in question,
    // for easy reference within the getFullModel function
    var foreignKeys = [];
    var schema = data.schemas[modelName];
    for (var key in schema) {
        // If it's a relation definition
        if ('-+<>'.match(schema[key][0])) {
            var fk = {
                // What the foreign object is names on the local object
                propName: key.replace(/ /g, '_'),
                // What the foreign object's model is named
                modelName: schema[key].substr(1)
            };
            foreignKeys.push(fk);

            // Piggy-back on this
            data.fks[modelName].push(fk);
        }
    }

    return function getFullModel() {
        // Get local properties
        var fullModel = this.toObject();

        // For each relation, load the corresponding objects
        var foreignObjects = foreignKeys.map(loadForeignObject.bind(this));

        // Resolve when all of the foreign objects are loaded
        return Promise.all(foreignObjects).then(returnFullModel);

        function loadForeignObject(fk) {

            // The relation is stored with an 's'; Calling
            // it retrieves the ID(s?) of the foreign object(s)
            var ids = this[fk.modelName + 's']();

            // Prep a query of the foreign object's model, to use in a promise
            var query = data.models[fk.modelName].find().in('id', ids);

            // Run the query and add the foreign objects to the fullModel
            return Promise.fromNode(query.run.bind(query))
                .then(addToFullModel)
                .catch(log);

            function addToFullModel(objs) {
                objs = objs.map(toObject).map(util.unescapeKeysAndProps);
                fullModel[fk.propName] = objs.length < 2 ? objs[0] : objs;
            }
        }

        function returnFullModel() {
            return util.unescapeKeysAndProps(fullModel);
        }
    }
}

function toObject(o) {
    return o.toObject();
}