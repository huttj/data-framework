var util = require('./../util');
var log  = console.log.bind(console);
var hurl = function(err) { log(err.stack || err.message || err.error || err); process.exit(); };

describe('util', function() {

    describe('collapse', function() {

        var start = {
            top: {
                mid: 1,
                afro: "text",
                cars: {
                    self: ['driving']
                }
            },
            ladies: 4,
            "justin timberlake": 'cats'
        };

        var expected = {
            "top.mid": 1,
            "top.afro": "text",
            "top.cars.self": ['driving'],
            ladies: 4,
            "justin timberlake": 'cats'
        };

        var collapsed;

        beforeAll(function() {
            collapsed = util.collapse(start);
        });

        it('collapses nested objects into flat ones', function() {
            expect(collapsed).toEqual(expected);
        });

    });


    describe('inflate', function() {

        var start = {
            "top.mid": 1,
            "top.afro": "text",
            "top.cars.self": ['driving'],
            ladies: 4,
            "justin timberlake": 'cats'
        };

        var expected = {
            top: {
                mid: 1,
                afro: "text",
                cars: {
                    self: ['driving']
                }
            },
            ladies: 4,
            "justin timberlake": 'cats'
        };

        var inflated;

        beforeAll(function() {
            inflated  = util.inflate(start);
        });

        it('inflates flat objects into nested ones', function() {
            expect(inflated).toEqual(expected);
        });

    });

});