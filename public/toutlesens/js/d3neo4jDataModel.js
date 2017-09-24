/*******************************************************************************
/* SOUSLESENS LICENSE************************
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
var d3neo4jDataModel = (function(){
 var self = {};



/*moved  var dataModel = {
    labels: {},
    labelsRelations: {},
    relations: {},
    allRelations: {},
    allProperties: [""],
    allRelationsArray: [""],
    allLabels: [""]
}*/

   self.initNeoModel=function(subGraph, callback) {
    dataModel = {
        labels: {},
        relations: {},
        labelsRelations: {},
        allRelations: {},
        allProperties: [""],
        allRelationsArray: [""],
        allLabels: [""]
    }
    var where = "";
    if (subGraph && subGraph != "undefined")
        where = " where n.subGraph='" + subGraph + "'";


    var query = "MATCH (n) OPTIONAL MATCH(n)-[r]-(m) "
        + where
        + " RETURN distinct labels(n) as labels_n, type(r) as type_r,labels(m)[0] as label_m, labels(startNode(r))[0] as label_startNode,count(n) as count_n,count(r) as count_r,count(m) as count_m";

    var payload = {
        match: query
    }
    $.ajax({
        type: "POST",
        url: Gparams.neo4jProxyUrl,
        //data : paramsObj,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {

            //	var data = data.results[0].data;

            for (var i = 0; i < data.length; i++) {
                var obj = {
                    label1: data[i].labels_n[0],
                    labels: data[i].labels_n,
                    labels2: data[i].labels_m,
                    label1: data[i].label_n,
                    relType: data[i].type_r,
                    label2: data[i].label_m,
                    count1: data[i].count_n,
                    count2: data[i].count_m,
                }

                if (obj.relType) {
                    if (!dataModel.labelsRelations[obj.label1])
                        dataModel.labelsRelations[obj.label1] = [];
                    dataModel.labelsRelations[obj.label1].push(obj.relType);
                    if (!dataModel.labelsRelations[obj.label2])
                        dataModel.labelsRelations[obj.label2] = [];
                    dataModel.labelsRelations[obj.label2].push(obj.relType);

                }
                if (obj.label1 == data[i].label_startNode)
                    obj.direction = "normal";
                else
                    obj.direction = "inverse";

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
            // fields
            query = "MATCH (n) " + where
                + " return distinct labels(n) as labels_n,keys(n) as keys_n,count(n) as count_n";
            //  + " return distinct labels(n)[0] as label_n,keys(n) as keys_n,count(n) as count_n";

            payload = {match: query};


            // console.log("QUERY----" + JSON.stringify(payload));
            $
                .ajax({
                    type: "POST",
                    url: Gparams.neo4jProxyUrl,
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

                        if (callback) {
                            if (Array.isArray(callback)) {
                                for (var i = 0; i < callback.length; i++) {
                                    callback[i](subGraph);
                                }
                            }
                            else
                                callback(subGraph);
                        }

                    }
                    ,
                    error: function (xhr, err, msg) {
                        console.log(xhr);
                        console.log(err);
                        console.log(msg);
                    }

                })

        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });

}

   self.drawDataModel=function() {

    drawNeoModel(subGraph);
}
   self.callMongo=function(urlSuffix, payload, callback) {
    if (!urlSuffix)
        urlSuffix = "";
    $.ajax({
        type: "POST",
        url: Gparams.mongoProxyUrl + urlSuffix,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }
    });
}
   self.callNeoMatch=function(match, url, callback) {
    payload = {
        match: match
    };
    if (!url)
        url = Gparams.neo4jProxyUrl;

    $.ajax({
        type: "POST",
        url: url,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {

            console.log(xhr);
            console.log(err);
            console.log(msg);
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