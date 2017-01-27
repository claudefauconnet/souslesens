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


    exportNodes: function (params, response, callback) {
        //  var xxx= JSON.parse("{photo:{$exists:true}}");
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
                //   query = JSON.parse(query);
            }
            catch (error) {

                console.log(error);
                var result = {result: error};
                if (response && !response.finished) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(result));
                    response.end();
                    return;
                }
                else {
                    callback(messageObj);
                }


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
        // mongoProxy.find(dbName, collection, query, null, function (err, data) {
        mongoProxy.delete(dbName, "neomappings", {label: label}, null, function () {
            mongoProxy.pagedFind(500, dbName, collection, query, function (err, data) {

                if (err) {
                    console.log(err);
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
                        //  delete  obj[idMongoField];
                    } else {
                        continue;
                    }
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
                    for (var key in obj) {// le schamps neo ne doivent pas
                        // commencer par un chiffre
                        // (norme json) , on met un _
                        // devant
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

                    mongoProxy.insert(dbName, "neomappings", result, null, function () {
                        var message = "Imported " + result.length + "lines with label " + label;
                        socket.message(message);
                        console.log(message);
                        var messageObj = {result: message};
                        if (callback) {
                            callback(null, messageObj);
                            return;
                        }
                        else if (response && !response.finished) {
                            response.setHeader('Content-Type', 'application/json');
                            response.send(JSON.stringify(messageObj));
                            response.end();
                        }


                    });


                });


                function writeNodesToNeoNodes(label, _objs, callback) {
                    var objs = _objs;
                    var path = "/db/data/transaction/commit";


                    var statements = [];
                    for (var i = 0; i < objs.length; i++) {
                        var obj = objs[i];
                        if (("" + obj.BC_id) == "218")
                            var xxx = "aa";
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


                    payload = {statements: statements};
                    //  httpProxy.post(neo4jUrl, neoPort, path, payload, null, function (result) {
                    // neoProxy.post( "",payload, null, function (result) {
                    var neo4jUrl = serverParams.neo4jUrl;
                    neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
                        if (err) {
                            console.log(err);
                            socket.message("Error : " + err);
                            var result = {result: err};
                            if (response && !response.finished) {
                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify(result));


                            }
                            else {
                                callback(err);
                            }
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


    exportRelations: function (params, response, callback) {
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
        mongoProxy.find(dbName, "neomappings", {"label": neoSourceLabel}, null, function (err, result) {


            if (err) {
                console.log(error);
                var result = {result: err};
                if (response && !response.finished) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(result));
                    response.end();

                }
                else {
                    callback(result);
                }
                return;
            }
            for (var i = 0; i < result.length; i++) {
                mongoNeoSourceIdsMap[result[i].mongoId] = result[i].neoId;
            }
            mongoProxy.find(dbName, "neomappings", {"label": neoTargetLabel}, null, function (err, result) {

                if (err) {
                    console.log(error);
                    var result = {result: err};
                    if (response && !response.finished) {
                        response.setHeader('Content-Type', 'application/json');
                        response.send(JSON.stringify(result));
                        response.end();

                    }
                    else {
                        callback(result);
                    }
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
                        //   query = JSON.parse(query);
                    }
                    catch (error) {

                        console.log(error);
                        var result = {result: error};
                        if (response && !response.finished) {
                            response.setHeader('Content-Type', 'application/json');
                            response.send(JSON.stringify(result));
                            response.end();
                            return;
                        }
                        else {
                            callback(messageObj);
                        }


                    }


                }
                mongoQuery[mongoSourceField] = {$exists: true};
                mongoQuery[mongoTargetField] = {$exists: true};
                // mongoProxy.find(dbName, mongoCollection, mongoQuery, null, function (error, data) {
                mongoProxy.pagedFind(500, dbName, mongoCollection, mongoQuery, function (err, data) {
                    if (err) {
                        console.log(error);
                        var result = {result: err};
                        response.setHeader('Content-Type', 'application/json');
                        response.send(JSON.stringify(result));
                        response.end();
                        return;
                    }
                    var relations = [];


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
                        // console.log(JSON.stringify(neoObj));
                        payload.push(neoObj);

                    }

                    var neo4jUrl = serverParams.neo4jUrl;
                    neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

                        if (err) {
                            socket.message("Error : " + err);
                            console.log(err);
                            var result = {result: err};
                            if (response && !response.finished) {
                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify(result));
                                response.end();

                            }
                            else {
                                callback(result);
                            }
                            return;
                        }
                        if (result.errors && result.errors.length > 0) {
                            for (var i = 0; i < result.errors.length; i++) {
                                console.log(result.errors[i]);
                            }
                            var result = {errors: result.errors};
                            if (response && !response.finished) {
                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify(result));
                                response.end();

                            }
                            else {
                                callback(result);
                            }
                            return;

                        }
                        var message = "Imported " + result.length + "relations  with type " + relationType;
                        socket.message(message);
                        var messageObj = {result: message};
                        if (callback) {
                            callback(null, messageObj);
                            return;
                        }
                        else if (response && !response.finished) {
                            response.setHeader('Content-Type', 'application/json');
                            response.send(JSON.stringify(messageObj));
                            response.end();
                        }

                    })


                });
            });
        });

    },
    copyNodes: function (data, response) {
        var path = "/db/data/transaction/commit";
        var neoCopyMappings = {}


        var statements = [];
        var oldIds = [];
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            var label = obj.n.labels[0];
            //  var properties = cleanFieldsForNeo(obj.n.properties);
            var properties = obj.n.properties;
            oldIds.push(obj.n._id);


            var properties = JSON.stringify(properties).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
            var statement = {statement: "CREATE (n:" + label + properties + ")  RETURN ID(n) as newId, labels(n) as label"};
            statements.push(statement);
        }


        payload = {statements: statements};
        //  httpProxy.post(neo4jUrl, neoPort, path, payload, null, function (result) {
        // neoProxy.post( "",payload, null, function (result) {


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
                        var message = "totalImportedtotal :" + (totalImported);
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
                if (socket)
                    socket.message(message);
                if (socket)
                    socket.message(message);
                response.end("message");

            })


    },

    copyRelations: function (data, response) {
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


            // console.log(JSON.stringify(neoObj));
            aSubset.push(neoObj);

        }
        var totalImported = 0;
        async.eachSeries(subsets, function (aSubset, callback) {
            var length = aSubset.length;
            console.log(JSON.stringify(aSubset[0]))

            var neo4jUrl = serverParams.neo4jUrl;
            neoProxy.cypher(neo4jUrl, path, aSubset, function (err, result) {

                    if (err) {
                        callback(err);
                    }
                    else {
                        totalImported = totalImported + result.length;
                        var message = "total relations Importedtotal :" + (totalImported);
                        console.log(message);
                        if (socket)
                            socket.message(message);
                        callback(null);
                    }
                },
                function (err, done) {

                    var message = "total nodes importedtotal :" + (totalImported);
                    if (socket)
                        socket.message(message);
                    response.end("message");

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







