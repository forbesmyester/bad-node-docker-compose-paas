"use strict";

var fs = require("fs"),
    MACHINE_PATH = ['mcp'],
    R = require('ramda'),
    qs = require('query-string');

module.exports = function(settings) {

if (settings === undefined) { settings = {}; }
var CONFIG_FILE = settings.hasOwnProperty('config') ? settings.config : 'config';

function getHost(req) {
    return req.headers.host.replace(/\:.*/, "");
}

function writeConfig(config) { // Make safe from sequential writes!
    return new Promise(function(resolve, reject) {
        fs.writeFile(CONFIG_FILE, JSON.stringify(config), function(err, r) {
            if (err) { return reject(err); }
            return resolve(r);
        });
    });
}

function readJSONFile(fle) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fle, 'utf8', function(err, r) {
            if (err) { return reject(err); }
            resolve(JSON.parse(r));
        });
    });
}

function readConfig() {
    return readJSONFile(CONFIG_FILE);
}

function wipeConfig() {
    return fs.unlink(CONFIG_FILE).then(function() {
        return true;
    }, function() {
        return true;
    });
}

function addToConfig(dcpConfigPath, config) {
    return R.pipe(
        R.path(MACHINE_PATH),
        R.defaultTo([]),
        function(val) {
            return R.assocPath(
                MACHINE_PATH,
                R.uniq(R.append(dcpConfigPath, val)),
                config
            );
        }
    )(config);
}

function validateSubConfig(ob) {
    if (!(ob.hasOwnProperty('name') && ob.hasOwnProperty('port'))) {
        return false;
    }
    if (!(ob.name.match(/^[a-z]+$/) && ("" + ob.port).match(/^[0-9]+$/))) {
        return false;
    }
    return true;
}

function pathToPort(config) {
    return Promise.all(R.map(
            readJSONFile,
            R.defaultTo([], R.path(MACHINE_PATH, config))
        )).then(function(configs) {
            return R.reduce(
                function(acc, mcp) {
                    acc[mcp.name] = mcp.port;
                    return acc;
                },
                {},
                configs
            );
    });
}

function getReqBody(req) {
    return new Promise(function(r) {
        var fullBody = '';
        req.on('data', function(chunk) {
            fullBody += chunk.toString();
        });
        req.on('end', function() {
            r(qs.parse(fullBody));
        });
    });
}


return {
    getHost: getHost,
    writeConfig: writeConfig,
    readConfig: readConfig,
    wipeConfig: wipeConfig,
    addToConfig: addToConfig,
    pathToPort: pathToPort,
    validateSubConfig: validateSubConfig,
    readJSONFile: readJSONFile,
    getReqBody: getReqBody
};

};

