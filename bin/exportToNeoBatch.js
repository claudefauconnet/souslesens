/**
 * Created by claud on 09/02/2017.
 */

var mongoProxy = require("./mongoProxy.js");
var httpProxy = require("./httpProxy.js");
var neoProxy = require("./neoProxy.js");
var socket = require('../routes/socket.js');
var exportMongoToNeo = require('./exportMongoToNeo.js');
var async = require('async');
var fs = require("fs");
var serverParams = require("./serverParams.js");


var exportToNeoBatch = {


    exportBatch: function (sourceType, dbName, subGraph, requestNames, callbackG) {
        var globalMessage = [];
        var requestsToExecute = [];
        if (sourceType == "CSV") {
            var requestData = fs.readFileSync("./uploads/requests_" + dbName + ".json");
            if (requestData) {
                requestData = JSON.parse("" + requestData);
                for (var i = 0; i < requestData.length; i++) {
                    if (requestNames.indexOf(requestData[i].name) > -1)
                        requestsToExecute.push(requestData[i]);

                }

            }
            execSynchRequests(requestsToExecute, dbName, subGraph, callbackG);
        }
        else {// MongoDB
            mongoProxy.find(dbName, "requests", {}, function (err, data) {
                for (var i = 0; i < data.length; i++) {
                    if (requestNames.indexOf(data[i].name) > -1) {
                        requestsToExecute.push(data[i])
                    }
                }
                execSynchRequests(requestsToExecute, dbName, subGraph, callbackG);

            });
        }


        function execSynchRequests(_requestsToExecute, _dbName, _subGraph, _callbackG) {
            var requestsToExecute = _requestsToExecute;
            var dbName = _dbName;
            var subGraph = _subGraph;
            var callbackG = _callbackG;


            async.eachSeries(requestsToExecute, function (request, callbackBatch) {
                    var message = request.name + " executing";
                    console.log(message);
                    socket.message(message);
                    var requestObj;
                    if (typeof request.request == "string") {
                        var requestStr = request.request.replace(/\n/g, "");
                        requestObj = JSON.parse(requestStr);
                    }
                    else {
                        requestObj = request.request;
                    }
                    requestObj.mongoDB = dbName;
                    if (subGraph)
                        requestObj.subGraph = subGraph;
                    //  requestObj={params:requestObj};

                    if (request.name.indexOf("Nodes_") == 0) {
                        requestObj.mongoCollection = requestObj.mongoCollectionNode;
                        exportMongoToNeo.exportNodes(requestObj, function (err, result) {
                            if (err) {
                                console.log(err);
                                callbackBatch(null);
                                globalMessage.push(err);
                                return;
                            }
                            globalMessage.push(result);
                            callbackBatch(null);
                        });
                    }
                    else if (request.name.indexOf("Rels_") == 0) {
                        console.log("--importing--" + requestObj.name);
                        requestObj.mongoCollection = requestObj.mongoCollectionRel;
                        exportMongoToNeo.exportRelations(requestObj, function (err, result) {
                            if (err) {
                                console.log(err);
                                globalMessage.push(err);
                                //  callbackBatch(null);

                            }
                            else {
                                console.log("--imported--" + result);
                                globalMessage.push(result);
                                callbackBatch(null);
                            }
                        });
                    }
                }
                ,
                function (err, done) {


                    if (err) {

                        callbackG(err);
                    }
                    else {
                        socket.message(JSON.stringify(globalMessage));
                        callbackG(null, {result: globalMessage});

                    }


                });


        };
    }
}

module.exports = exportToNeoBatch;