/**
 * Created by claud on 10/01/2017.
 */
var mongoProxy = require("./mongoProxy.js");

var httpProxy = require("./httpProxy.js");
var neoProxy = require("./neoProxy.js");
var socket = require('../routes/socket.js');
var async = require('async');
var neoCopyMappings = {};
var fs = require("fs");
var serverParams = require("./serverParams.js");


var exportMongoToNeo = {


    exportNodes: function (params, callback) {
        var totalImported = 0;
        var dbName = params.mongoDB;
        var collection = params.mongoCollection;
        var exportedFields = params.exportedFields;
        var fields = [];
        if (exportedFields)
            fields = exportedFields.trim().split(";");
        var query = params.mongoQuery;
        if (!query)
            query = {}
        else {
            try {
                query = eval('(' + query + ')');
            }
            catch (error) {
                callback(error);
                return;
            }
        }
        var nameMongoField = params.mongoField;
        var idMongoField = params.mongoIdField;
        var subGraph = params.subGraph;
        var label = params.label;
        var isDistinct = params.distinctValues ? true : false;

        if (fields != null) {
            fields.push(nameMongoField);
            fields.push(idMongoField);
            if (label.indexOf("#") == 0)
                fields.push(label.substring(1));
        }

        var distinctNames = [];
        if (label == null)
            label = collection;
        mongoProxy.delete(dbName, "neomappings", {label: label}, function () {
            mongoProxy.pagedFind(serverParams.mongoFetchSize, dbName, collection, query, function (err, data) {

                if (err) {
                    console.log(err);
                    return;
                }
                if (data.length == 0) {
                    callback(null,"Imported " + totalImported + " lines with label " + label);
                    return;
                }
                var objs = [];
                for (var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    delete obj._id;
                    var nameMongoFieldValue = obj[nameMongoField];
                    if (isDistinct & distinctNames.indexOf(nameMongoFieldValue) > -1)
                        continue;
                    if (obj[idMongoField]) {// on stocke dans neo et neoMappings dans id la valeur de mongoIdField
                        obj.id = obj[idMongoField];
                    } else {
                        continue;
                    }
                    totalImported+=1;
                    distinctNames.push(nameMongoFieldValue);
                    if (!obj.nom)
                        obj.nom = nameMongoFieldValue;
                    obj.subGraph = subGraph;
                    if (label.indexOf("#") == 0) {
                        var labelField = label.substring(1);
                        var labelValue = obj[labelField];
                        labelValue = ("" + labelValue).replace(/ /g, "_");
                        if (labelValue)
                            obj._labelField = "" + labelValue;
                        else
                            obj._labelField = labelField;

                    }
                    var keysToSolve = {};
                    for (var key in obj) {// le schamps neo ne doivent pascommencer par un chiffre (norme json) , on met un _devant
                        if (/[0-9]+.*/.test(key)) {
                            keysToSolve[key] = obj[key];

                        }
                    }
                    for (key in  keysToSolve) {
                        obj["_" + key] = obj[key];
                        delete obj.key;

                    }

                    objs.push(obj);
                }

                var nodeMappings = writeNodesToNeoNodes(label, objs, function (_result) {
                    var result = _result;

                    mongoProxy.insert(dbName, "neomappings", result, function () {
                        var message = "Imported " + totalImported + " lines with label " + label;
                        socket.message(message);
                        console.log(message);
                        //   callback(null,  message);
                    });


                });


                function writeNodesToNeoNodes(label, _objs, callback) {
                    var objs = _objs;
                    var path = "/db/data/transaction/commit";


                    var statements = [];
                    for (var i = 0; i < objs.length; i++) {
                        var obj = objs[i];
                        obj = cleanFieldsForNeo(obj);

                        var labelFieldValue = obj._labelField;
                        if (labelFieldValue != null) {
                            label = labelFieldValue;
                            delete  obj._labelField;
                        }

                        var attrs = JSON.stringify(obj).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
                        var statement = {statement: "CREATE (n:" + label + attrs + ")  RETURN n.id,ID(n), labels(n)"};
                        statements.push(statement);
                    }


                    var payload = {statements: statements};
                    var neo4jUrl = serverParams.neo4jUrl;
                    neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
                        if (err) {

                            callback(err);
                            return;

                        }

                        var nodeMappings = [];
                        for (var i = 0; i < result.results.length; i++) {
                            var obj = result.results[i]
                            var label = obj.data[0].row[2][0];
                            var id = obj.data[0].row[1];
                            var nodeMapping = {};
                            nodeMapping.neoId = id;
                            nodeMapping.mongoId = objs[i].id;
                            nodeMapping.label = label;
                            nodeMappings.push(nodeMapping);
                        }
                        callback(nodeMappings);

                    });


                }
            })
        });
    }


    ,


    exportRelations: function (params, callback) {
        var totalImported = 0;
        var dbName = params.mongoDB;
        var mongoCollection = params.mongoCollection;
        var mongoSourceField = params.mongoSourceField;
        var neoSourceLabel = params.neoSourceLabel;
        var mongoTargetField = params.mongoTargetField;
        var neoTargetLabel = params.neoTargetLabel;
        var relationType = params.relationType;
        var neoRelAttributeField = params.neoRelAttributeField;
        var mongoQuery = params.mongoQueryR;
        var subGraph = params.subGraph;

        var mongoNeoSourceIdsMap = {};
        var mongoNeoTargetIdsMap = {};
        mongoProxy.find(dbName, "neomappings", {"label": neoSourceLabel}, function (err, result) {
            if (err) {
                callback(error);
                return;
            }
            for (var i = 0; i < result.length; i++) {
                mongoNeoSourceIdsMap[result[i].mongoId] = result[i].neoId;
            }
            mongoProxy.find(dbName, "neomappings", {"label": neoTargetLabel}, function (err, result) {

                if (err) {
                    callback(error);
                    return;
                }

                var missingMappings = [];
                var uniqueRelations = [];
                for (var i = 0; i < result.length; i++) {
                    mongoNeoTargetIdsMap[result[i].mongoId] = result[i].neoId;
                }

                if (!mongoQuery)
                    mongoQuery = {}
                else {
                    try {
                        mongoQuery = eval('(' + mongoQuery + ')');

                    }
                    catch (error) {
                        callback(error);
                        return;
                    }


                }
                mongoQuery[mongoSourceField] = {$exists: true};
                mongoQuery[mongoTargetField] = {$exists: true};
                mongoProxy.pagedFind(serverParams.mongoFetchSize, dbName, mongoCollection, mongoQuery, function (error, data) {
                    if (err) {
                        callback(error);
                        return;
                    }
                    var relations = [];
                    if (data.length == 0) {
                        callback(null, " Imported " + totalImported + "relations  with type " + relationType);
                        return;
                    }


                    for (var i = 0; i < data.length; i++) {

                        var obj = data[i];
                        delete obj._id;


                        var neoIdStart = mongoNeoSourceIdsMap[obj[mongoSourceField]];
                        var neoIdEnd = mongoNeoTargetIdsMap[obj[mongoTargetField]];

                        if (neoIdStart == null | neoIdEnd == null) {
                            missingMappings.push(obj)
                            continue;

                        } else {

                            var hashCode = "" + neoIdStart + neoIdEnd;

                            if (uniqueRelations.indexOf(hashCode) < 0) {
                                uniqueRelations.push(hashCode);
                            } else {
                                continue;
                            }

                            var properties = {};
                            if (subGraph != null)
                                properties.subGraph = subGraph;
                            if (neoRelAttributeField != null && neoRelAttributeField.length > 0)
                                properties[neoRelAttributeField] = obj[neoRelAttributeField];

                            var relation = {
                                sourceId: neoIdStart,
                                targetId: neoIdEnd,
                                type: relationType,
                                data: properties
                            }
                            relations.push(relation);

                        }
                    }
                    var path = "/db/data/batch";
                    var payload = [];
                    for (var i = 0; i < relations.length; i++) {
                        totalImported += 1;


                        var neoObj = {
                            method: "POST",
                            to: "/node/" + relations[i].sourceId + "/relationships",
                            id: 3,
                            body: {
                                to: "" + relations[i].targetId,
                                data: relations[i].data,
                                type: relations[i].type
                            }
                        }
                        payload.push(neoObj);

                    }

                    var neo4jUrl = serverParams.neo4jUrl;
                    neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

                        if (err) {

                            callback(err);
                            return;
                        }
                        if (result.errors && result.errors.length > 0) {
                            callback(JSON.stringify(result));
                            return;

                        }

                        var message = "Imported " + totalImported + "relations  with type " + relationType;
                        socket.message(message);

                    })


                });

            });
        });

    },
    copyNodes: function (data, callback) {
        var path = "/db/data/transaction/commit";
        var neoCopyMappings = {}


        var statements = [];
        var oldIds = [];
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            var label = obj.n.labels[0];
            var properties = obj.n.properties;
            oldIds.push(obj.n._id);


            var properties = JSON.stringify(properties).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
            var statement = {statement: "CREATE (n:" + label + properties + ")  RETURN ID(n) as newId, labels(n) as label"};
            statements.push(statement);
        }


        payload = {statements: statements};


        var subsets = [payload];
        var totalImported = 0;
        async.eachSeries(subsets, function (aSubset, callback) {
                var length = aSubset.length;
                var neo4jUrl = serverParams.neo4jUrl;
                neoProxy.cypher(neo4jUrl, path, aSubset, function (err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {

                        for (var i = 0; i < result.results.length; i++) {
                            var obj = result.results[i]
                            var nodeMapping = {};
                            nodeMapping.newId = obj.data[0].row[0];
                            nodeMapping.oldId = oldIds[i];
                            nodeMapping.label = obj.data[0].row[1][0];
                            neoCopyMappings[nodeMapping.oldId] = nodeMapping
                        }


                        totalImported = totalImported + result.results.length;
                        var message = "Imported :" + (result.results.length);
                        console.log(message);
                        if (socket)
                            socket.message(message);
                        callback(null);
                    }
                });
            },
            function (err, done) {
                fs.writeFile("./uploads/neoCopyMappings.js", JSON.stringify(neoCopyMappings));
                totalImported = totalImported;
                var message = "total nodes importedtotal :" + (totalImported);

                if (err)
                    callback(err)
                else {
                    socket.message(message);
                    callback(null, message);
                }
            })


    },

    copyRelations: function (data, callback) {
        var neoCopyMappings = fs.readFileSync("./uploads/neoCopyMappings.js");
        neoCopyMappings = JSON.parse("" + neoCopyMappings);
        var path = "/db/data/batch";
        var payload = [];
        var subsets = [];
        var aSubset = [];
        for (var i = 0; i < data.length; i++) {
            if (i % 200 == 0) {
                subsets.push(aSubset);
                aSubset = [];
            }
            if (!neoCopyMappings[data[i].r._fromId]) {
                console.log("non existing source  node :" + data[i]);
                continue;
            }
            if (!neoCopyMappings[data[i].r._toId]) {
                console.log("non existing target  node :" + data[i]);
                continue;
            }
            var neoObj = {
                method: "POST",
                to: "/node/" + neoCopyMappings[data[i].r._fromId].newId + "/relationships",
                id: 3,
                body: {
                    to: "" + neoCopyMappings[data[i].r._toId].newId,
                    data: data[i].r.properties,
                    type: data[i].r.type
                }
            }


            aSubset.push(neoObj);

        }
        var totalImported = 0;
        async.eachSeries(subsets, function (aSubset, callback) {
            var neo4jUrl = serverParams.neo4jUrl;
            neoProxy.cypher(neo4jUrl, path, aSubset, function (err, result) {

                    if (err) {
                        callback(err);
                    }
                    else {
                        totalImported = totalImported + result.length;
                        var message = " relations Imported :" + (result.length);
                        console.log(message);
                        if (socket)
                            socket.message(message);
                        callback(null);
                    }
                },
                function (err, done) {

                    if (err)
                        callback(err)
                    else {
                        var message = " relations Imported :" + totalImported;
                        socket.message(message);
                        callback(null, message);

                    }
                });
        })

    },
    exportBatch: function (dbName, subGraph, requestNames, callbackG) {


        var globalMessage = [];
        mongoProxy.find(dbName, "requests_" + subGraph, {}, function (err, data) {
            var requestsToExecute = [];
            for (var i = 0; i < data.length; i++) {

                if (requestNames.indexOf(data[i].name) > -1) {
                    requestsToExecute.push(data[i])
                }
            }
            var totalImported = 0;
            async.eachSeries(requestsToExecute, function (request, callbackBatch) {
                    var message = request.name + " executing";
                    console.log(message);
                    socket.message(message);
                    var requestStr = request.request.replace(/\n/g, "");
                    var requestObj = JSON.parse(requestStr);
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
                        callbackG(null, {result:globalMessage});

                    }


                });


        })

    }
}
function cleanFieldsForNeo(obj) {
    for (var key in obj) {

        var key2 = key.replace(/-/g, "_");

        key2 = key2.replace(/ /g, "_");
        var valueObj = obj[key];

        var value = "" + valueObj;
        value = value.replace(/[\n|\r|\t]/g, " ");
        value = value.replace(/&/g, " and ");
        value = value.replace(/"/g, "'");
        value = value.replace(/,/g, "\\,");
        value = value.replace(/\//g, "\-");
        obj[key] = value;
    }

    return obj;

}
module.exports = exportMongoToNeo;







