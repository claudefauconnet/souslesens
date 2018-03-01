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
var neoProxy = require("./neoProxy.js");
var fs = require("fs");
var csv = require('csvtojson');
var mongoProxy = require("./mongoProxy")
var serverParams = require("./serverParams.js");
var exportToNeoBatch = require("./exportToNeoBatch.js");
var exportMongoToNeo = require("./exportMongoToNeo.js");


var sourceType;
var dbName;
var mappings;
var fileName;
var subGraph;
var csvData;
/*
 {
 "type": "batch",
 "sourceType": "MongoDB",
 "subGraph": "POTXXX",
 "data": "[\"Nodes_Fabrice.cat_category\",\"Nodes_Fabrice.scenario_name\",\"Nodes_POT.BC\",\"Nodes_POT.BD\",\"Nodes_POT.BU\",\"Nodes_POT.DC\",\"Nodes_POT.Scenarii\",\"Nodes_POT.allScenarii\",\"Nodes_POT.buildingBlock\",\"Nodes_POT.layer\",\"Nodes_POT.scenario\",\"Nodes_POT.technology\",\"Nodes_POT.useCase\",\"Nodes_POT5.technology\",\"Nodes_POT5.useCase\",\"Nodes_geneve.UC_name\",\"Nodes_geneve.techno_name\"]",
 "dbName": "POT2017"
 }
 */
var restAPI = {

    desc_updateNeoFromCSV: function (callback) {
        var params = {

            fileName: " not needed if mappings is present. Name of the original file else ignored: used to find recorded mappings (MUST end with .csv)",
            mappings: "JSON of mappings between csv or mongo and Neo4j: this json can be generated with exportMappings request. if present and not empty fileName is not needed",
            csvData: "the CSV content URIencoded",
            subGraph: "name of the subGraph : can be different from the recorded one",


            // nodeLabels: " not mandatory : array of strings composed of 'Nodes_'plus plus neo4j label names",
            //  nodeLabels: "not mandatory  array of strings composed of 'Rels' plus neo4j label names",

        }
        callback(null, params);


    },
    desc_updateNeoFromMongo: function (callback) {
        var params = {
            dbName: "if sourceType mongoDB, name of MongoDB database else ignored",
            subGraph: "name of the subGraph : can be different from the recorded one",


            // nodeLabels: " not mandatory : array of strings composed of 'Nodes_'plus plus neo4j label names",
            //  nodeLabels: "not mandatory  array of strings composed of 'Rels' plus neo4j label names",

        }
        callback(null, params);
        // callback(null,JSON.stringify(params));


    },

    updateNeoFromCSV: function (params, callback) {

        fileName = params.fileName;
        subGraph = params.subGraph;
        csvData = params.csvData;
        mappings = params.mappings;
        //   var nodeLabels = params.nodeLabels;
        //  var relTypes = params.relTypes;


        //1 init nodes labels and rels types
        if (true) {//!nodeLabels || nodeLabels.length==0){// in this case we take all nodes and rels
            var requestsToExecute = [];
            var nodeLabels = [];
            var relTypes = [];

            var requestData;
            if (mappings)
                requestData = mappings;
            else
                requestData = fs.readFileSync("./uploads/requests_" + fileName + ".json");
            if (requestData) {
                requestData = JSON.parse("" + requestData);

                for (var key in requestData) {
                    if (requestData[key].name) {
                        if (requestData[key].name.indexOf("Nodes_") == 0) {
                            nodeLabels.push(requestData[key].name);

                        }
                        if (requestData[key].name.indexOf("Rels_") == 0)
                            relTypes.push(requestData[key].name);
                    }

                }

            }
            else {
                return callback("NO requests recorded with name " + dbName + "on this server");
            }


            var path = "./uploads/" + fileName + ".json";

            //3 save new csv data after converting in json
            var csvData = decodeURI(csvData.trim());
            var jsonArray = [];
            csv({noheader: false, trim: true, delimiter: "auto"})
                .fromString(csvData)
                .on('json', function (json) {
                    jsonArray.push(json);
                })
                .on('done', function () {
                    var path = "./uploads/" + fileName + ".json";
                    //4 delete old csv data
                    if (fs.existsSync(path))
                        fs.unlinkSync(path);
                    fs.writeFileSync(path, JSON.stringify(jsonArray));
                    execNeoUpdate("CSV", fileName, subGraph, nodeLabels, relTypes, mappings, function (err, result) {
                        return callback(null, result);
                    })
                })
        }


    },
    updateNeoFromMongo: function (params, callback) {

        dbName = params.dbName;
        subGraph = params.subGraph;

        //   var nodeLabels = params.nodeLabels;
        //  var relTypes = params.relTypes;


        //1 init nodes labels and rels types
        if (true) {//!nodeLabels || nodeLabels.length==0){// in this case we take all nodes and rels
            var requestsToExecute = [];
            var nodeLabels = [];
            var relTypes = [];


            mongoProxy.find(dbName, "requests", {}, function (err, requests) {
                for (var i = 0; i < requests.length; i++) {
                    if (requests[i].name.indexOf("Nodes_") == 0)
                        nodeLabels.push(requests[i].name);
                    if (requests[i].name.indexOf("Rels_") == 0)
                        relTypes.push(requests[i].name);
                }
                execNeoUpdate(sourceType, dbName, subGraph, nodeLabels, relTypes, null, function (err, result) {
                    return callback(null, result);
                })
            })


        }

    }
    ,
    exportMappings: function (params, callback) {
        sourceType = "";
        dbName = params.dbName;
        if (!dbName) {
            dbName = params.fileName;
            sourceType = "CSV"
        }
        fileName = params.fileName;

        if (sourceType == "CSV") {
            var mappings = fs.readFileSync("./uploads/requests_" + fileName + ".json");
            if (mappings) {
                mappings = JSON.parse("" + mappings);
                callback(null, mappings);
            }
            else {
                callback("No mappings for file " + fileName);
            }
        }


        else {
            var mappings = "";

            mongoProxy.find(dbName, "requests", {}, function (err, requests) {
                if (requests.length == 0) {
                    callback("No mappings for file " + fileName);
                }
                else {

                    for (var i = 0; i < requests.length; i++) {

                        mappings.push(requests[i])
                    }
                    callback(null, mappings)
                }

            });
        }
    }
    ,
    createNode: function (params, callback) {
        var node = getNodeObj(params)
        var attrs = getNeoJsonStr(node.attrs);
        var setNodePrivateId = params.setNodePrivateId;
        var matchStr = "CREATE (n" + node.label + " " + attrs + ") RETURN n";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            if (setNodePrivateId) {// we add a field id containing Neo
                var id = result[0].n._id
                var matchStr2 = "Match (n) where ID(n)=" + id + " SET n.id=" + id + " RETURN n";
                neoProxy.match(matchStr2, function (err, result) {
                    return callback(null, result);
                });

            }
            return callback(null, result);
        })

    }
    ,
    createRelation: function (params, callback) {
        var rel = getRelObj(params);
        var where = " WHERE " + getNeoKeyValuePairs(rel.sourceNodeQuery, " and ", "n")
        where += " AND " + getNeoKeyValuePairs(rel.targetNodeQuery, " and ", "m")


        var matchStr = "MATCH (n" + rel.sourceNodeLabel + ") , (m" + rel.targetNodeLabel + ") " + where + " CREATE (n)-[r:" + rel.relType + "]->(m) return n,r,m";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    },

    createNodeAndRelation: function (params, callback) {
        var rel = getRelObj(params);

        var where = " WHERE " + getNeoKeyValuePairs(rel.sourceNodeQuery, " and ", "n")
        var node = getNodeObj(params)
        var attrs = getNeoJsonStr(node.attrs);


        var matchStr = "MATCH (n)" + where + " CREATE (m" + node.label + " " + attrs + ")<-[r:" + rel.relType + "]-(n) return n,r,m";

        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }


    ,
    updateNode: function (params, callback) {
        var node = getNodeObj(params);
        var setStr = getNeoKeyValuePairs(node.setObj, ",", "n")
        var attrsStr = getNeoKeyValuePairs(node.attrs, " and ", "n")

        var matchStr = "Match (n" + node.label + ") where " + attrsStr + " SET " + setStr + " RETURN n";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }
    ,

    deleteNode: function (params, callback) {
        var node = getNodeObj(params);
        var attrsStr = getNeoKeyValuePairs(node.attrs, " and ", "n")
        var matchStr = "Match (n" + node.label + ") where " + attrsStr + " DETACH  delete n return \"node deleted\"";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }
    ,

    updateRelationById: function (params, callback) {
        var relId = params.relId;
        var setStr = getNeoKeyValuePairs(params.relAttrs, ",", "r")


        var matchStr = "MATCH ()-[r]-() WHERE id(r)=" + relId + " SET " + setStr + " RETURN r";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }
    ,

    deleteRelation: function (params, callback) {
        var rel = getRelObj(params);
        var where = " WHERE " + getNeoKeyValuePairs(rel.sourceNodeQuery, " and ", "n")
        if (rel.targetNodeQuery)
            where += " AND " + getNeoKeyValuePairs(rel.targetNodeQuery, " and ", "m")


        var matchStr = "MATCH (n" + rel.sourceNodeLabel + ")-[r]-(m" + rel.targetNodeLabel + ")" + where + " delete r return \"relation deleted\"";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }
    ,
    deleteRelationById: function (params, callback) {

        if (!params.id)
            return callback("no id field in payload")
        var where = " WHERE ID(r)="+params.id;

        var matchStr = "MATCH (n)-[r]-(m)" + where + " delete r return \"relation deleted\"";
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })
    }
    ,
    retrieve: function (params, callback) {
        var matchStr = params.match;
        neoProxy.match(matchStr, function (err, result) {
            if (err)
                return callback(err)
            return callback(null, result);
        })

    }
    ,


}

var getNodeObj = function (params) {
    var node = {};
    node.label = params.nodeLabel;
    if (node.label && node.label.length > 0)
        node.label = ":" + node.label;
    else
        node.label = "";

    node.setObj = params.nodeSet;
    if (node.setObj && typeof node.setObj !== "object")
        node.setObj = JSON.parse(node.setObj);


    node.attrs = params.nodeAttrs;
    if (node.attrs && typeof node.attrs !== "object")
        node.attrs = JSON.parse(node.attrs);


    node.subGraph = params.nodeSubGraph;
    if (node.subGraph && node.subGraph.length > 0) {
        node.attrs.subGraph = node.subGraph;

    }
    return node;


}


function getRelObj(params) {
    var rel = {};
    rel.sourceNodeQuery = params.sourceNodeQuery;
    if (( rel.sourceNodeQuery && typeof rel.sourceNodeQuery !== "object"))
        rel.sourceNodeQuery = JSON.parse(rel.sourceNodeQuery);


    rel.sourceNodeLabel = params.sourceNodeLabel;
    if (rel.sourceNodeLabel && rel.sourceNodeLabel.length > 0)
        rel.sourceNodeLabel = ":" + rel.sourceNodeLabel;
    else
        rel.sourceNodeLabel = "";


    rel.targetNodeQuery = params.targetNodeQuery;
    if (( rel.targetNodeQuery && typeof rel.targetNodeQuery !== "object"))
        rel.targetNodeQuery = JSON.parse(rel.targetNodeQuery);

    rel.targetNodeLabel = params.targetNodeLabel;
    if (rel.targetNodeLabel && rel.targetNodeLabel.length > 0)
        rel.targetNodeLabel = ":" + rel.targetNodeLabel;
    else
        rel.targetNodeLabel = "";

    rel.relType = params.relType;
    if (!rel.relType)
        rel.relType = "";

    rel.relAttrs = params.relAttrs;
    if ((rel.relAttrs && typeof rel.relAttrs !== "object"))
        rel.relAttrs = JSON.parse(rel.relAttrs);
    return rel;
}

function getNeoJsonStr(obj) {// remove " form keys
    var str = "{";
    for (var key in obj) {
        var value = obj[key];
        if (isNaN(value + 1))
            value = "\"" + value + "\"";
        if (str.length > 1)
            str += ",";
        str += key + ":" + value;
    }
    return str += '}';
}
function getNeoKeyValuePairs(obj, sep, prefix) {
    if (!prefix)
        prefix = "";
    var str = "";
    for (var key in obj) {
        var value = obj[key];
        /* if (isNaN(value))
         value = "\"" + value + "\"";*/
        if (str.length > 0)
            str += sep;
        if (key == "_id") {
            delete obj[key];
            str += "ID(" + prefix + ")=" + value;
        }
        else {


            if (isNaN(value + 1))
                value = "\"" + value + "\"";
            if (value == "")
                value = "\"" + value + "\"";
            str += prefix + "." + key + "=" + value;
        }
    }
    return str;
}

var execNeoUpdate = function (sourceType, dbName, subGraph, nodeLabels, relTypes, mappings, Xcallback) {
    //5  delete oldGraph
    exportMongoToNeo.clearVars();
    var match = 'MATCH (n)-[r]-(m) where n.subGraph="' + subGraph + '" delete  r';
    neoProxy.match(match, function (err, result) {
        match = 'MATCH (n)where n.subGraph="' + subGraph + '" delete n';
        neoProxy.match(match, function (err, result) {





            // 6 export Nodes
            exportToNeoBatch.exportBatch(sourceType, dbName, subGraph, nodeLabels, mappings, function (errNodes, resultNodes) {


                if (errNodes) {
                    console.log(errNodes)
                    return Xcallback(errNodes);
                }
                // 7 export Rels

                exportToNeoBatch.exportBatch(sourceType, dbName, subGraph, relTypes, mappings, function (errRels, resultRels) {
                    if (errRels) {
                        console.log(errRels)
                        return Xcallback(errRels);
                    }
                    return Xcallback(null, 'nodes updated' + '---' + 'relations updated');

                })

            })
        })
    })
}

module.exports = restAPI;



