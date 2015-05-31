"use strict";

var expect = require('expect.js'),
    lib = require('./lib.js')({ config: 'test.config' });

describe('getHost', function() {
    it('Can get it', function() {
        expect(lib.getHost({ headers: { host: 'localhost:1337' } })).to.eql('localhost');
    });
});

describe('config', function() {
    it('can be be read and written', function(done) {
        lib.writeConfig({a: 1, b: { c: 2 } })
            .then(lib.readConfig)
            .then(function(config) {
                expect(config).to.eql({a: 1, b: { c: 2 } });
                done();
            }, done);
    });
    it('can be added to', function() {
        expect(lib.addToConfig({a: 1}, {})).to.eql({'mcp': [{a: 1}] });
    });
    it('can extract routing information', function(done) {
        lib.pathToPort({ mcp: ["./testconfig.bob", "./testconfig.alf"] }).then(function(r) {
            expect(r).to.eql({ bob: 8080, alf: 8000 });
            done();
        }, done);
    });
});

