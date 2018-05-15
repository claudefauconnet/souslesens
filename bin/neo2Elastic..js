var neoProxy = require("./neoProxy.js");
var elasticProxy = require("./elasticProxy.js");
var async = require('async');
var serverParams = require('./serverParams.js');
var request = require('request');

var neo2Elastic = {
    indexNeoNodes2Elastic: function (subGraph, where, index, callback) {
        if (!where)
            where = "";
        if (!subGraph)
            subGraph = "";
        else
            subGraph = " where n.subGraph=\"" + subGraph + "\" ";
        if (where.length > 0) {
            if (subGraph.length > 0)
                where = subGraph + " and " + where;
            else
                where = " where " + where;
        }
        else
            where = subGraph;


        elasticProxy.deleteIndex(index, true, function (err) {
            if (err)
                return callback(err);
            elasticProxy.createSimpleIndex(index,"BASIC", function (err, result) {
                if (err)
                    return callback(err);

                var offset = 0
                var neoResultSize = 1;
                var totalResults = 0;
                async.whilst(
                    function () {
                        return neoResultSize > 0;
                    },
                    function (callbackWhilst) {

                        var matchStr = "Match (n) " + where + " return n" + " SKIP " + offset + " LIMIT " + (offset + serverParams.elasticFethSize);
                        offset += serverParams.elasticFethSize + 1;
                        neoProxy.match(matchStr, function (err, result) {
                            if (err)
                                return callback(err);
                            neoResultSize = result.length;
                            totalResults += neoResultSize;
                            var data = []
                            for (var i = 0; i < result.length; i++) {
                                result[i].n.properties.neoId = result[i].n._id;
                                result[i].n.properties.label = result[i].n.labels[0];
                                data.push(result[i].n.properties);
                            }

                            elasticProxy.indexJsonArray(index, "neoObject", data, {}, function (err, result) {
                                if (err)
                                    return callback(err);
                                var xx = result;
                                callbackWhilst();

                            })


                        });

                    },
                    function (err, n) {
                        callback(null, neoResultSize + " imported in Elastic index " + index)
                    }
                );

            })
        })

    },

    elasticQuery2NeoNodes: function (index, queryString,resultSize, callback) {
        queryString = encodeURIComponent(queryString);
        var url = serverParams.elasticUrl + index + "/_search?q=" + queryString + "&size="+resultSize+"&_source_include=neoId";
        console.log(url);
        http://localhost:9200/antiquite/_search?q=M*&size=100&_source_include=neoId
            var options = {
                method: 'GET',
                url: url

            }


        request(options, function (error, response, body) {
                if (error) {

                    console.log(JSON.stringify(error, null, 2))
                    return callback(err);
                    // return callback(file+" : "+error);
                }

                else {
                    var body = JSON.parse(body);
                    if (body.error ) {
                        console.log(JSON.stringify(body.error));
                        return callback(body.error);

                    }

                    var neoIds = [];
                    if( !body.hits || !body.hits.hits)
                        return callback(null,[]);

                    var data = body.hits.hits;
                    for (var i = 0; i < data.length; i++) {
                        neoIds.push(data[i]._source.neoId);
                    }


                    var str = JSON.stringify(neoIds);

                    var matchStr = "Match (n)  where ID(n) in " + str+" return n";
                    neoProxy.match(matchStr, function (err, result) {
                        if (err)
                            return callback(err);
                        callback(null, result);
                    })

                }
            })


    }


}
if (true) {
    neo2Elastic.indexNeoNodes2Elastic("keosphere3", null, "keosphere3", function (err, result) {
        var xx = err;
    })
}

if (false) {
    neo2Elastic.indexNeoNodes2Elastic("Antiquite", null, "antiquite", function (err, result) {
        var xx = err;
    })
}

if (false) {
    neo2Elastic.elasticQuery2NeoNodes("antiquite", "Jarre", function (err, result) {
        var xx = err;
    })
}
module.exports = neo2Elastic;