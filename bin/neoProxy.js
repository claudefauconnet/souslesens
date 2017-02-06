
var neo4j = require('neo4j');
var request = require("request");
var serverParams = require("./serverParams.js");


neo4jProxy = {

    match: function (matchStr, callback) {
        var neo4jUrl = serverParams.neo4jUrl;
        var db = new neo4j.GraphDatabase(neo4jUrl);
        var obj = {
            query: matchStr
        };
        db.cypher(obj, function (err, results) {
            if (err)
                callback(err);
            else
                callback(null, results)
        });
    }

    , cypher: function (url, path, payload, callback) {

        var neo4jUrl = serverParams.neo4jUrl;
        var uri = neo4jUrl + path;

        request({
                url: uri,
                json: payload,
                method: 'POST',
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    callback(res.body.errors)
                }
                else
                    callback(null, res.body)
            });


    }
}

module.exports = neo4jProxy;

