/**
 * Created by claud on 10/02/2017.
 */


var statQueries = {
    outgoingRelsCount: " MATCH (n:$label)-[r]->(m)  return DISTINCT n.name as node,labels(n) as nodeLabels,type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
    incomingRelsCount: "MATCH (m:$label)-[r]->(n)  return DISTINCT n.name as node,labels(n) as nodeLabels,type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
}


function setCurrentQueriesSelect() {
    var array = [""];

    for (var key in statQueries) {
        array.push(key);
        fillSelectOptionsWithStringArray(currentQueriesSelect, array);

    }
}

function initLabelsCurrentQueries() {
    initLabels(subGraph, "currentQueriesLabelSelect");
}


function onCurrentQueriesSelect() {
    currentActionObj = {type: "frequentQuery"}
}


function executeFrequentQuery(){
    var queryName= $("#currentQueriesSelect").val();
    var label= $("#currentQueriesLabelSelect").val();
    var limit= parseInt($("#currentQueriesLimit").val());
    var query= statQueries[queryName];
    query=query.replace("$label",label);
    query=query.replace("$limit",limit);
    buildStatTree(queryName,query, function(jsonTree){

        currentDataStructure = "tree";
        currentDisplayType = "TREEMAP";
        window.parent. hideAdvancedSearch();
        window.parent.cachedResultTree=jsonTree;
        window.parent.displayGraph(jsonTree, currentDisplayType, null)
    })

}

function buildStatTree(title, query,callback) {

    var payload = {match: query};

    console.log(query);
    $.ajax({
        type: "POST",
        url: Gparams.neo4jProxyUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {

            if (!data || data.length == 0) {
                setMessage("No results", blue);
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                var str = "ERROR :";
                for (var i = 0; i < errors.length; i++) {
                    str += errors[i].code + " : " + errors[i].message + "<br>"
                        + JSON.stringify(paramsObj);
                }
                setMessage("!!! erreur de requete", red);
                console.log(str);
                return;
            }
            var root = {
                name: title,
                children: [],
                valueField:"value"
            }
            for (var i = 0; i < data.length; i++) {
                var obj = {
                    name: data[i].node,
                    label: data[i].nodeLabels[0],
                    neoAttrs: {
                        value: data[i].relCount,
                        relType: data[i].relType,

                    }
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

