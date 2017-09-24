/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var mongoProxy = require("./mongoProxy.js");
var httpProxy = require("./httpProxy.js");
var neoProxy = require("./neoProxy.js");
var socket = require('../routes/socket.js');
var exportMongoToNeo = require('./exportMongoToNeo.js');
var async = require('async');
var fs = require("fs");
var serverParams = require("./serverParams.js");


var exportToNeoBatch = {




    exportBatch: function (sourceType, dbName, subGraph, requestNames,mappings, callbackG) {
        var globalMessage = [];
        var requestsToExecute = [];
        if (sourceType == "CSV") {
            var requestData;
            if(mappings)
                requestData=mappings;
            else
                 requestData = fs.readFileSync("./uploads/requests_" + dbName + ".json");
            if (requestData) {
                requestData = JSON.parse("" + requestData);
             //   for (var i = 0; i < requestData.length; i++) {
                for(var key in requestData ){
                    if (requestNames.indexOf(requestData[key].name) > -1)
                        requestsToExecute.push(requestData[key]);

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


            async.eachSeries(requestsToExecute, function (request, callback) {
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
                                callback(err);
                                globalMessage.push(err);
                                return;
                            }
                            else {
                                globalMessage.push(result);
                                callback();
                            }
                        });
                    }
                    else if (request.name.indexOf("Rels_") == 0) {
                        console.log("--importing--" + requestObj.name);
                        requestObj.mongoCollection = requestObj.mongoCollectionRel;
                        exportMongoToNeo.exportRelations(requestObj, function (err, result) {
                            if (err) {
                                console.log(err);
                                globalMessage.push(err);
                                callback(null);

                            }
                            else {
                                console.log("--imported--" + result);
                                globalMessage.push(result);
                                callback();
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