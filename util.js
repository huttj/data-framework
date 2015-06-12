var log = require('./log');

var util = {};

util.collapse = function collapse(obj, delimiter) {
    delimiter = delimiter || '.';
    return _collapse(obj, '', delimiter);
};

function _collapse(obj, prefix, delimiter) {
    var res = {};
    Object.keys(obj).forEach(function(key) {
        var trueKey = (prefix ? prefix + delimiter : '') + key;
        if (typeof obj[key] !== 'object' || obj[key].map) {
            res[trueKey] = obj[key];
        } else {
            res = _join(res, _collapse(obj[key], trueKey, delimiter));
        }
    });
    return res;
}

function _join(obj1, obj2) {
    Object.keys(obj2).forEach(function(key) {
        obj1[key] = obj2[key];
    });
    return obj1;
}

util.inflate = function inflate(obj, delimiter) {
    delimiter = delimiter || '.';

    return Object.keys(obj)
        .map(function(key) {
            var d = {
                path: key.split(delimiter),
                value: obj[key]
            };
            console.log(d);
            return d;
        })
        .reduce(function(result, prop) {
            console.log(prop);
            var ref = result;
            var path = prop.path;
            for (var i = 0; i < path.length - 1; i++) {
                ref[path[i]] = ref[path[i]] || {};
                ref = ref[path[i]];
            }
            ref[path[i]] = prop.value;
            return result;
        }, {});
};

util.camelToSpace = function camelToSpace(str) {
    return str && str.split(/(?=[A-Z]])/).map(String.prototype.toLowerCase.call).join(' ');
};

util.delimitedToTitle = function delimitedToTitle(str) {
    return str && str.split(/[^A-Za-z0-9]/).map(util.capitalize).join('');
};

util.capitalize = function capitalize(word) {
    return word && word[0].toUpperCase() + word.substr(1);
};

util.camelToTitle = function camelToTitle(str) {
    return str && str.split(/(?=[A-Z])/).map(function(n) {
        return n[0].toUpperCase() + n.slice(1);
    }).join(' ');
};

util.snakeToSpace = function snakeToSpace(str) {
    return str && str.replace(/_/g, ' ');
};

util.spaceToSnake = function spaceToSnake(str) {
    return str && str.replace(/ /g, '_');
};

util.escapeKeys   = makeTransformKeysFunction(util.spaceToSnake);
util.unescapeKeys = makeTransformKeysFunction(util.snakeToSpace);

function makeTransformKeysFunction(transformation) {
    return function transformKeys(obj) {
        return obj && Object.keys(obj).reduce(function (res, key) {
            res[transformation(key)] = obj[key];
            return res;
        }, {})
    }
}

module.exports = util;