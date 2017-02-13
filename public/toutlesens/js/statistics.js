/**
 * Created by claud on 10/02/2017.
 */


var statQueries = {
    Relations_count: " MATCH (n:$sourceLabel)$incoming-[r]-$outgoing(m$targetLabel)  return DISTINCT n as node,labels(n) as sourceLabels,labels(m) as targetLabels, type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
   // incomingRelsCount: "MATCH (m:$sourceLabel)-[r]->(n$targetLabel)  return DISTINCT n.name as node,labels(n) as nodeLabels,type(r) as relType ,count(type(r))as relCount order by relCount desc limit $limit",
}


function setCurrentQueriesSelect() {
    var array = [""];

    for (var key in statQueries) {
        array.push(key);
        fillSelectOptionsWithStringArray(currentQueriesSelect, array);

    }
}

function initLabelsCurrentQueries() {
    initLabels(subGraph, "currentQueriesSourceLabelSelect");
    initLabels(subGraph, "currentQueriesTargetLabelSelect");
}


function onCurrentQueriesSelect() {
    currentActionObj = {type: "frequentQuery"}
}


function executeFrequentQuery() {


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
    buildStatTree(queryName, query, function (jsonTree) {

        currentDataStructure = "tree";
        currentDisplayType = "TREEMAP";
        window.parent.hideAdvancedSearch();
        window.parent.cachedResultTree = jsonTree;
        window.parent.displayGraph(jsonTree, currentDisplayType, null)
    })

}

function buildStatTree(title, query, callback) {

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
                valueField: "value"
            }
            for (var i = 0; i < data.length; i++) {
                var name=data[i].node.properties.name;
                if(!name){
                    data[i].node.properties.name=data[i].node.properties.nom
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

