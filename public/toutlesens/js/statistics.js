/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
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

var statistics = (function(){
 var self = {};



 var statQueries = {
    Relations_count: " MATCH (n:$sourceLabel)$incoming-[r]-$outgoing(m$targetLabel)  return DISTINCT n as node,labels(n) as sourceLabels,labels(m) as targetLabels, type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
   // incomingRelsCount: "MATCH (m:$sourceLabel)-[r]->(n$targetLabel)  return DISTINCT n.name as node,labels(n) as nodeLabels,type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
}


   self.setCurrentQueriesSelect=function() {
   var array = [];//[""];

    for (var key in statQueries) {
        array.push(key);
common.fillSelectOptionsWithStringArray(currentQueriesSelect, array);

    }
}

   self.initLabelsCurrentQueries=function() {
toutlesensController.initLabels(subGraph, "currentQueriesSourceLabelSelect");
toutlesensController.initLabels(subGraph, "currentQueriesTargetLabelSelect");
}


   self.onCurrentQueriesSelect=function() {
    currentActionObj = {type: "frequentQuery"}
}


   self.executeFrequentQuery=function() {


    var queryName = $("#currentQueriesSelect").val();
    var sourceLabel = $("#currentQueriesSourceLabelSelect").val();
    var targetLabel = $("#currentQueriesTargetLabelSelect").val();
    var direction = $("#currentQueriesDirectionSelect").val();
    var limit = parseInt($("#currentQueriesLimit").val());

    if(queryName=="") {
        $("#message").html("choose a query")
        return;
    }
    if(sourceLabel=="") {
        $("#message").html("choose a sourceLabel")
        return;
    }

    var query = statQueries[queryName];
    query = query.replace("$sourceLabel", sourceLabel);


    if (targetLabel && targetLabel != "")
        targetLabel = ":" + targetLabel;
    else
        targetLabel = "";
    query = query.replace("$targetLabel", targetLabel);


    if(direction=="any"){
        query = query.replace("$incoming", "");
        query = query.replace("$outgoing", "");
    }
    else   if(direction=="outgoing"){
        query = query.replace("$incoming", "");
        query = query.replace("$outgoing", ">");
    }
    else   if(direction=="incoming"){
        query = query.replace("$incoming", "<");
        query = query.replace("$outgoing", "");
    }

    query = query.replace("$limit", limit);
self.buildStatTree(queryName, query, function (jsonTree) {

        currentDataStructure = "tree";
        currentDisplayType = "TREEMAP";
        window.parent.toutlesensDialogsController.hideAdvancedSearch();
        window.parent.cachedResultTree = jsonTree;
        window.parent.toutlesensController.displayGraph(jsonTree, currentDisplayType, null)
    })

}

   self.buildStatTree=function(title, query, callback) {

    var payload = {match: query};

    console.log(query);
    $.ajax({
        type: "POST",
        url: Gparams.neo4jProxyUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            $("#message").html("")
            if (!data || data.length == 0) {
                 common.setMessage("No results", blue);
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                var str = "ERROR :";
                for (var i = 0; i < errors.length; i++) {
                    str += errors[i].code + " : " + errors[i].message + "<br>"
                        + JSON.stringify(paramsObj);
                }
                 common.setMessage("!!! erreur de requete", red);
                console.log(str);
                return;
            }
            var root = {
                name: title,

                children: [],
                valueField: "value"
            }
            for (var i = 0; i < data.length; i++) {
                var name=data[i].node.properties.name;
                if(!name){
                    data[i].node.properties.name=data[i].node.properties[Gparams.defaultnodeNameField]
                }

                var neoAttrs= data[i].node.properties;
                neoAttrs.value= data[i].relCount;
                neoAttrs.relType= data[i].relType;


                var obj = {
                    name: data[i].node.properties.name + " --" + data[i].relType +" ("+data[i].relCount+") "+ "--> " + data[i].targetLabels[0],
                    label: data[i].targetLabels[0],
                    id:data[i].node._id,
                    neoAttrs: neoAttrs
                }
                root.children.push(obj);
            }

            callback(root)


        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        },

    })


}


 return self;
})()