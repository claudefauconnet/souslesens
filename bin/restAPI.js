/**
 * Created by claud on 28/07/2017.
 */




var neoProxy = require("./neoProxy.js");
var fs = require("fs");
var csv = require('csvtojson');
var mongoProxy = require("./mongoProxy")
var serverParams = require("./serverParams.js");
var exportToNeoBatch = require("./exportToNeoBatch.js");


var sourceType ;
var dbName;

var fileName ;
var subGraph ;
var csvData ;
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

    desc_updateNeo: function (callback) {
        var params = {
            sourceType: "CSV or MongoDB",
            fileName: "if sourceType CSV, name of the original file else ignored: used to find recorded exports (MUST end with .csv)",
            csvData: "if sourceType CSV, the CSV content else ignored",

            dbName: "if sourceType mongoDB, name of MongoDB database else ignored",

            subGraph: "name of the subGraph : can be different from the recorded one",


            // nodeLabels: " not mandatory : array of strings composed of 'Nodes_'plus plus neo4j label names",
            //  nodeLabels: "not mandatory  array of strings composed of 'Rels' plus neo4j label names",

        }
        callback(null, params);
        // callback(null,JSON.stringify(params));


    },


    updateNeo: function (params, callBack) {
         sourceType = params.sourceType;
         dbName = params.dbName;
        if (!dbName)
            dbName = params.fileName;
         fileName = params.fileName;
         subGraph = params.subGraph;
         csvData = params.csvData;
        //   var nodeLabels = params.nodeLabels;
        //  var relTypes = params.relTypes;


        //1 init nodes labels and rels types
        if (true) {//!nodeLabels || nodeLabels.length==0){// in this case we take all nodes and rels
            var requestsToExecute = [];
            var nodeLabels = [];
            var relTypes = [];


            if (sourceType == "CSV") {
                var requestData = fs.readFileSync("./uploads/requests_" + fileName + ".json");
                if (requestData) {
                    requestData = JSON.parse("" + requestData);
                    //   for (var i = 0; i < requestData.length; i++) {
                    for (var key in requestData) {
                        if (requestData[key].name) {
                            if (requestData[key].name.indexOf("Nodes_") == 0)
                                nodeLabels.push(requestData[key].name);
                            if (requestData[key].name.indexOf("Rels_") == 0)
                                relTypes.push(requestData[key].name);
                        }

                    }

                }
                else {
                    return callBack("NO requests recorded with name " + dbName + "on this server");
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
                        execNeoUpdate(sourceType, dbName, subGraph, nodeLabels, relTypes, function (err, result) {
                            return callBack(null, result);
                        })
                    })
            }

            else {// export MongoDB
                mongoProxy.find(dbName, "requests", {}, function (err, requests) {
                    for (var i = 0; i < requests.length; i++) {
                        if (requests[i].name.indexOf("Nodes_") == 0)
                            nodeLabels.push(requests[i].name);
                        if (requests[i].name.indexOf("Rels_") == 0)
                            relTypes.push(requests[i].name);
                    }
                    execNeoUpdate(sourceType, dbName, subGraph, nodeLabels, relTypes, function (err, result) {
                        return callBack(null, result);
                    })
                })


            }
        }

    }
}
var execNeoUpdate = function (sourceType, dbName, subGraph, nodeLabels, relTypes, Xcallback) {
    //5  delete oldGraph
    var match = 'MATCH (n)-[r]-(m) where n.subGraph="' + subGraph + '" delete  r';
    neoProxy.match(match, function (err, result) {
        match = 'MATCH (n)where n.subGraph="' + subGraph + '" delete n';
        neoProxy.match(match, function (err, result) {





            // 6 export Nodes
            exportToNeoBatch.exportBatch(sourceType, dbName, subGraph, nodeLabels, function (errNodes, resultNodes) {
                if (errNodes) {
                    console.log(errNodes)
                    return Xcallback(errNodes);
                }
                // 7 export Rels
                exportToNeoBatch.exportBatch(sourceType, dbName, subGraph, relTypes, function (errRels, resultRels) {
                    if (errRels) {
                        console.log(errRels)
                        return Xcallback(errRels);
                    }
                    return Xcallback(null, resultNodes + '---' + resultRels);

                })

            })
        })
    })
}
module.exports = restAPI;



