"use strict";

var http = require('http'),
    lib = require('./lib')({ config: "config" }),
    httpProxy = require('http-proxy'),
    R = require('ramda');

var proxy = httpProxy.createProxyServer({});
var mappings = {},
    config = {};

function refreshConfig() {
    return lib.readConfig().then(function(myConfig) {
        lib.pathToPort(myConfig).then(function(p2p) {
            mappings = p2p;
        });
        config = myConfig;
    });
}

http.createServer(function (req, res) {


    if (R.keys(mappings).indexOf(lib.getHost(req)) != -1) {
        return proxy.web(req, res, { target: 'http://127.0.0.1:' + mappings[lib.getHost(req)] });
    }
    if (req.url == '/mcp') {
        if (req.method == 'GET') {
            res.writeHead(200, {'Content-Type': 'application/json'});
            return res.end(JSON.stringify(mappings));
        }
        if (['POST', 'PUT'].indexOf(req.method) > -1) {
            lib.getReqBody(req)
                .then(function(rbody) {
                    if (!rbody.hasOwnProperty('authkey') || (rbody.authkey !== config.authkey)) {
                        throw new Error("Incorrect authkey");
                    }
                    if (!rbody.hasOwnProperty('path')) {
                        throw new Error("No Path");
                    }
                    req.body = rbody; // Naughty!!!
                    return rbody.path;
                })
                .then(lib.readJSONFile)
                .then(function(data) {
                    if (!lib.validateSubConfig(data)) {
                        throw new Error("Project config must include name and port keys");
                    }
                    return true;
                })
                .then(function() {
                    return lib.writeConfig(lib.addToConfig(req.body.path, config));
                })
                .then(refreshConfig)
                .then(function() {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({status: "OK"}));
                })
                .catch(
                    function(err) {
                        console.log(err.message + "\n" + err.stack + "\n\n");
                        res.writeHead(409, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({"status": "err: " + err.message}));
                    }
                );
            /*eslint consistent-return: 0 */
            return;
        }
    }
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end('{"status": "err: not found"}');

}).listen(1337, '127.0.0.1');

refreshConfig();

console.log('Server running at http://127.0.0.1:1337/');
