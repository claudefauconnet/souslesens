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
var dataModel = (function () {
    var self = {};
    //self.neo4jProxyUrl="../../.."+Gparams.neo4jProxyUrl;
    // self.mongoProxyUrl="../../.."+Gparams.mongoProxyUrl;
    //  self.neo4jProxyUrl=window.location.host+Gparams.neo4jProxyUrl;
    //  self.mongoProxyUrl=window.location.host+Gparams.mongoProxyUrl;
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
    self.labels = {};
    self.labelsRelations = {};
    self.relations = {};
    self.allRelations = {};
    self.allProperties = [""];
    self.allRelationsArray = [""];
    self.allLabels = [""];
    self.DBstats = null;


    self.getDBstats = function (subGraph, callback) {
        var where = ""
        if (subGraph)
            where = " where n.subGraph='" + subGraph + "' ";
        var countRelsMatch = " MATCH (n)-[r]->(m) " + where + " RETURN type(r) as relType, labels(n)[0] as startLabel,labels(m)[0] as endLabel, count(r) as countRel";
        var countNodesMatch = "  MATCH (n) " + where + "  RETURN Labels(n)[0] as label , count(*) as countNodes";

        var payload = {
            match: countNodesMatch
        }

        $.ajax({// count nodes
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (dataLabels, textStatus, jqXHR) {
                var payload = {
                    match: countRelsMatch
                }
                $.ajax({// counRels
                    type: "POST",
                    url: self.neo4jProxyUrl,
                    data: payload,
                    dataType: "json",
                    success: function (dataRels, textStatus, jqXHR) {
                        var nodes = {};
                        for (var i = 0; i < dataLabels.length; i++) {
                            nodes[dataLabels[i].label] = dataLabels[i].countNodes;
                        }
                        var relations = {};
                        for (var i = 0; i < dataRels.length; i++) {
                            relations[dataRels[i].relType] = dataRels[i];
                        }
                        var output = {
                                nodes: nodes,
                                relations: relations,
                            }
                        ;
                        self.DBstats = output;
                        if (callback)
                            return callback(null, output);

                    }, error: function (err) {
                        if (callback)
                            callback(err);
                    }
                })
            }, error: function (err) {
                if (callback)
                    callback(err);
            }
        });

    }


    self.initNeoModel = function (subGraph, callback) {
        self.labels = {};
        self.labelsRelations = {};
        self.relations = {};
        self.allRelations = {};
        self.allProperties = [""];
        self.allRelationsArray = [""];
        self.allLabels = [""];
        var where = "";
        if (subGraph && subGraph != "")
            where = " where n.subGraph='" + subGraph + "'";


        //   var query = "MATCH (n) OPTIONAL MATCH(n)-[r]-(m) "
        var query = "MATCH(n)-[r]-(m) "
            + where
            + " RETURN distinct labels(n) as labels_n, type(r) as type_r,labels(m)[0] as label_m, labels(startNode(r))[0] as label_startNode,count(n) as count_n,count(r) as count_r,count(m) as count_m";

        var payload = {
            match: query
        }
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            //data : paramsObj,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                if (data.length == 0)
                    callback(null, dataModel);

                //	var data = data.results[0].data;

                for (var i = 0; i < data.length; i++) {
                    var objNeo = data[i];
                    var obj = {
                        labels1: objNeo.labels_n,
                        label2: objNeo.label_m,
                        relStartLabel: objNeo.label_startNode,
                        relType: objNeo.type_r,
                        count1: objNeo.count_n,
                        count2: objNeo.count_m,
                    }

                    if (obj.relType) {
                        if (!dataModel.labelsRelations[obj.label1])
                            dataModel.labelsRelations[obj.label1] = [];
                        dataModel.labelsRelations[obj.label1].push(obj.relType);
                        if (!dataModel.labelsRelations[obj.label2])
                            dataModel.labelsRelations[obj.label2] = [];
                        dataModel.labelsRelations[obj.label2].push(obj.relType);


                        if (obj.labels1) {
                            obj.label1 = obj.labels1[0];
                            if (obj.label1 == obj.relStartLabel)
                                obj.direction = "normal";
                            else
                                obj.direction = "inverse";
                        }

                        if (!dataModel.relations[obj.label1])
                            dataModel.relations[obj.label1] = [];
                        dataModel.relations[obj.label1].push(obj);

                        if (!dataModel.allRelations[obj.relType])
                            dataModel.allRelations[obj.relType] = [];


                        dataModel.allRelations[obj.relType].push({
                            startLabel: obj.label1,
                            endLabel: obj.label2,
                            direction: obj.direction
                        });
                        if (dataModel.allRelationsArray.indexOf(obj.relType) < 0)
                            dataModel.allRelationsArray.push(obj.relType);
                    }
                }
                // fields
                query = "MATCH (n) " + where
                    + " return distinct labels(n) as labels_n,keys(n) as keys_n,count(n) as count_n";
                //  + " return distinct labels(n)[0] as label_n,keys(n) as keys_n,count(n) as count_n";

                payload = {match: query};


                // console.log("QUERY----" + JSON.stringify(payload));
                $.ajax({
                    type: "POST",
                    url: self.neo4jProxyUrl,
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        for (var i = 0; i < data.length; i++) {

                            var labels = data[i].labels_n;

                            for (var k = 0; k < labels.length; k++) {
                                var label = labels[k];
                                if (dataModel.allLabels.indexOf(label) < 0)
                                    dataModel.allLabels.push(label);
                                var fields = data[i].keys_n;
                                if (!dataModel.labels[label])
                                    dataModel.labels[label] = [];

                                for (var j = 0; j < fields.length; j++) {
                                    if (dataModel.allProperties
                                            .indexOf(fields[j]) < 0)
                                        dataModel.allProperties
                                            .push(fields[j]);
                                    if (dataModel.labels[label]
                                            .indexOf(fields[j]) < 0) {
                                        dataModel.labels[label]
                                            .push(fields[j]);
                                    }

                                }
                            }
                        }

                        dataModel.allProperties.sort();
                        dataModel.allLabels.sort();

                        /*  if (dataModel.allProperties.indexOf("subGraph") < 0) {
                              var queryParamsSubGraph = "";
                              if (queryParams.subGraph)
                                  queryParamsSubGraph = queryParams.subGraph;
                              $("#dialog").dialog("option", "title", "result");
                              var str = "Souslesens needs a property called subGraph on each node to allow different subsets in the same Neo4j database";
                              str += "<br>set subGraph property <input id='subGraphName' value='" + queryParamsSubGraph + "'><br><button onclick='dataModel.generateSubGraphPropertyOnAllNodes()'>Apply and continue</button> ";
                              str += "<br><button onclick='window.close();  $(\"#dialog\").dialog(\"close\")')>Quit souslesens</button>"
                              $("#dialog").html(str);
                              $("#dialog").dialog("open");//.position({my: 'center', at: 'center', of: '#tabs-analyzePanel'});


                          }*/


                        //relation Properties
                        query = " match(n)-[r]-(m)" + where + " return distinct type(r)as relType,labels(n)[0] as startLabel,labels(m)[0] as endLabel,  keys(r) as relProperties"
                        payload = {match: query};


                        // console.log("QUERY----" + JSON.stringify(payload));
                        $.ajax({
                            type: "POST",
                            url: self.neo4jProxyUrl,
                            data: payload,
                            dataType: "json",
                            success: function (data, textStatus, jqXHR) {
                                for (var i = 0; i < data.length; i++) {

                                    var relPropsObj = data[i];
                                    var relationObjs = dataModel.allRelations[relPropsObj.relType];
                                    for (var j = 0; j < relationObjs.length; j++) {
                                        var relationObj = relationObjs[j];

                                        if (relationObj && relationObj.direction == "normal" && relationObj.startLabel == relPropsObj.startLabel && relationObj.endLabel == relPropsObj.endLabel) {
                                            dataModel.allRelations[relPropsObj.relType][j].properties = relPropsObj.relProperties;
                                        }
                                        if (relationObj && relationObj.direction == "inverse" && relationObj.endLabel == relPropsObj.startLabel && relationObj.startLabel == relPropsObj.endLabel) {
                                            dataModel.allRelations[relPropsObj.relType][j].properties = relPropsObj.relProperties;
                                        }
                                    }


                                }

                                callback(null, dataModel);
                            }
                            ,
                            error: function (xhr, err, msg) {
                                callback(null);
                                toutlesensController.onErrorInfo(xhr)
                            }
                        })


                    }
                    ,
                    error: function (xhr, err, msg) {
                        callback(null);
                        toutlesensController.onErrorInfo(xhr)
                    }

                })

            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
            }

        });

    }

    self.generateSubGraphPropertyOnAllNodes = function () {
        var name = $("#subGraphName").val();
        if (!name || name == "") {
            $("#dialog").dialog("close")
            return;
        }
        subGraph = name;
        queryParams.subGraph = subGraph;
        var query = "Match(n) set n.subGraph=\"" + subGraph + "\" return count(n)";
        var payload = {match: query};
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                $("#dialog").dialog("close")
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
            }
        })

    }
    self.drawDataModel = function () {

        drawNeoModel(subGraph);
    }

    self.callMongo = function (urlSuffix, payload, callback) {
        if (!urlSuffix)
            urlSuffix = "";
        $.ajax({
            type: "POST",
            url: self.mongoProxyUrl + urlSuffix,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
            }
        });
    }

    self.listSubGraph = function () {
        var match = "MATCH (n)  return distinct n.subGraph";
        self.callNeoMatch(match, self.neo4jProxyUrl, function (data) {
            console.log(data);
        });
    }

    self.callNeoMatch = function (match, url, callback) {
        payload = {
            match: match
        };
        if (!url)
            url = self.neo4jProxyUrl;

        $.ajax({
            type: "POST",
            url: url,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {

                toutlesensController.onErrorInfo(xhr)
                if (err.result) {
                    $("#message").html(err.result);
                    $("#message").css("color", "red");
                }
                else
                    $("#message").html(err);
            }

        });

    }
    return self;
})()
