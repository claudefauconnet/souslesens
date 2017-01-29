/**
 * Created by claud on 14/01/2017.
 */

var async = require('async');
var mongoProxy = require("./mongoProxy.js");
var socket = require('../routes/socket.js');
var exportMongoToNeo = require("./exportMongoToNeo.js");

var exportMongoToNeoBatch = {

    exportBatch: function (dbName, subGraph, requestNames, response) {


        var globalMessage = [];
        mongoProxy.find(dbName, "requests", {}, null, function (err, data) {
            var requestsToExecute = [];
            for (var i = 0; i < data.length; i++) {

                if (requestNames.indexOf(data[i].name) > -1) {
                    requestsToExecute.push(data[i])
                }
            }

            async.eachSeries(requestsToExecute, function (request, callback) {
                    var message = request.name + " executing";
                    console.log(message);
                    socket.message(message);
                    var requestStr = request.request.replace(/\n/g, "");
                    var requestObj = JSON.parse(requestStr);
                    requestObj.mongoDB = dbName;
                    if (subGraph)
                        requestObj.subGraph = subGraph;
                    //  requestObj={params:requestObj};

                    if (request.name.indexOf("Nodes") > -1) {
                        requestObj.mongoCollection = requestObj.mongoCollectionNode;
                        exportMongoToNeo.exportNodes(requestObj, null, function (err, result) {
                            if (err) {
                                console.log(err);
                                callback(err);
                                return;
                            }
                            globalMessage.push(result);
                            callback(null);
                        });
                    }
                    else if (request.name.indexOf("Rels") > -1) {
                        requestObj.mongoCollection = requestObj.mongoCollectionRel;
                        exportMongoToNeo.exportRelations(requestObj, null, function (err, result) {
                            if (err) {
                                console.log(err);
                                callback(err);
                                return;
                            }
                            //   var yyy = result.length;

                            callback(null);
                        });
                    }
                }
                ,
                function (err, done) {

                    if (response && !response.finished) {
                        var str;
                        if (err)
                            var str = JSON.stringify({ERROR: err});
                        else
                            str = JSON.stringify(globalMessage);
                        socket.message('all done!!!' + str);
                        response.setHeader('Content-Type', 'application/json');
                        response.send(str);
                        response.end();

                    }


                });


        })

    }


}

module.exports = exportMongoToNeoBatch;
