var advancedSearch = (function () {

    var self = {};
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;

    self.showDialog = function () {
        var filterMovableDiv = $("#filterMovableDiv").detach();
        $("#dialog").append(filterMovableDiv);
        // toutlesensController.initLabels(advancedSearchDialog_LabelSelect);
        $("#filterActionDiv").html(" <button id=\"advancedSearchDialog_searchButton\" onclick=\"advancedSearch.searchNodes()\">Search</button>");

        /*  $("#dialog").load("htmlSnippets/advancedSearchMenu.html", function () {*/
        $("#dialog").dialog("option", "title", "Advanced search");
        $("#dialog").dialog("open");
        filters.init();
        /*    toutlesensController.initLabels(advancedSearchDialog_LabelSelect);
            filters.initLabelProperty("",advancedSearchDialog__propsSelect)
            $("#advancedSearchDialog__propsSelect").val(Schema.getNameProperty())

        })*/
    }
    self.searchNodes = function () {
        currentObject.id = null;
        $("#waitImg").css("visibility", "visible")
        var searchObj = {};


        var objectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
        if (objectType == "node")
            searchObj.label = $("#propertiesSelectionDialog_ObjectNameInput").val();
        if (objectType == "relation")
            searchObj.relType = $("#propertiesSelectionDialog_ObjectNameInput").val();
        searchObj.property = $("#propertiesSelectionDialog_propsSelect").val();
        searchObj.operator = $("#propertiesSelectionDialog_operatorSelect").val();
        searchObj.value = $("#propertiesSelectionDialog_valueInput").val();


        if (searchObj.property == "") {
            if (searchObj.value == "") {// only  search on label or type
                toutlesensData.searchNodes(subGraph, searchObj.label, null, "matchStr", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                    infoGenericDisplay.loadSearchResultIntree(err, result);
                    setTimeout(function () {
                        toutlesensController.setRightPanelAppearance(true);
                        infoGenericDisplay.expandAll("treeContainer");
                        $("#dialog").dialog("close");
                    }, 500)


                })
                return;

            }
            var data = [];// stack all results and then draw tree
            var index = 0;
            var countOptions = $('#propertiesSelectionDialog_propsSelect').children('option').length - 1;
            $("#propertiesSelectionDialog_propsSelect option").each(function () {
                var property = $(this).val();

                if (property != "") {
                    var value = property + ":~ " + searchObj.value;
                    toutlesensData.searchNodes(subGraph, searchObj.label, value, "list", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                        index += 1;
                        for (var i = 0; i < result.length; i++) {
                            data.push(result[i])
                        }
                        if (index >= countOptions) {
                            infoGenericDisplay.loadTreeFromNeoResult("#", data);
                        }
                        setTimeout(function () {
                            toutlesensController.setRightPanelAppearance(true);
                            infoGenericDisplay.expandAll("treeContainer");
                        }, 500)

                    })
                }
            });

        } else {
            var value = searchObj.property + ":~ " + searchObj.value;
            toutlesensData.searchNodes(subGraph, searchObj.label, value, "matchStr", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                infoGenericDisplay.loadSearchResultIntree(err, result);
                setTimeout(function () {
                    toutlesensController.setRightPanelAppearance(true);
                    infoGenericDisplay.expandAll("treeContainer");
                }, 500)


            })
        }
        $("#dialog").dialog("close");


    }

    /**
     if @str simple word return regex of the word  for the property defaultNodeNameProperty
     else
     @str form property:operator value


     */
    self.getWhereProperty = function (str, nodeAlias) {
        if (!str)
            return "";
        var property = Gparams.defaultNodeNameProperty;
        var p = str.indexOf(":");
        var operator;
        var value;
        if (p > -1) {
            property = str.substring(0, p);
            str = str.substring(p + 1);
            var q = str.indexOf(" ");
            operator = str.substring(0, q);
            value = str.substring(q + 1);
        }
        else {
            property = Gparams.defaultNodeNameProperty
            operator = "~";
            value = str;
            // console.log("!!!!invalid query");
            // return "";
        }

        if (operator == "~") {
            operator = "=~"
            // value = "'.*" + value.trim() + ".*'";
            value = "'(?i).*" + value.trim() + ".*'";
        }
        else {
            if ((/[\s\S]+/).test(str))
                value = "\"" + value + "\"";
        }
        var propStr = "";
        if (property == "any")
            propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

        else {
            propStr = nodeAlias + "." + property + operator + value.trim();
        }
        return propStr;

    }


    self.searchSimilars = function (node) {
        $("#similarsDialogSimilarsDiv").html();
        var messageDivId = $("#similarsDialogMessageDiv");
        messageDivId.html("");
        if (!node)
            return messageDivId.html("no node selected");
        var label = node.label;
        if (node.labelNeo)
            label = node.labelNeo

        var statement = "match(n:" + label + ")-->(r)<--(m:" + label + ")";
        //  var statement = "match(n:" + label + ")-->(r)<--(m)";
        statement += " where id(n)=" + node.id + " "
        statement += " return n as sourceNode,m as similarNode, collect(labels(r)[0]) as similarLabels,collect(r) as similarNodes, count(*) as count order by count desc";
        console.log(statement);
        var payload = {match: statement};


        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                if (data.length == 0) {
                    return messageDivId.html("nos similarities found");
                }

                toutlesensData.cachedResultArray = data;
                var str = "<ul>";
                var max = data[0].count;
                for (var i = 0; i < data.length; i++) {


                    var line = data[i]
                    if (line.count == max) {
                        var str2 = "<ul>";
                        for (var j = 0; j < line.similarNodes.length; j++) {
                            var linkstr2 = "javascript:toutlesensController.generateGraph(" + line.similarNodes[j]._id + ")";
                            str2 += "<li>[" + line.similarLabels[j] + "]<a href='" + linkstr2 + "'>" + line.similarNodes[j].properties[Schema.getNameProperty()] + "</a> </li> "
                        }
                        str2 += "</ul>";
                        var linkstr = "javascript:toutlesensController.generateGraph(" + line.similarNode._id + ")";
                        str += "<li><a href='" + linkstr + "'>" + line.similarNode.properties[Schema.getNameProperty()] + " </a>: " + str2 + "</li>";
                    }
                }
                str += "</ul>"
                str = data[0].sourceNode.properties[Schema.getNameProperty()] + " :<b>Most similar nodes</b><br>" + str;
                $("#similarsDialogSimilarsDiv").html(str);
            },
            error: function (err) {

                console.log(err.responseText)
            }
        })


    }


    self.searchLabelsPivots = function (sourceLabel, pivotLabel, sourceNodeId, messageDivId) {
        if (!sourceLabel) {
            return $(messageDivId).html("require source label");

        }
        var whereStatement = "" ;
        if( subGraph){
            whereStatement= " where n.subGraph='"+subGraph+"' "
        }
        if (sourceNodeId) {
            whereStatement = " and Id(n)=" + sourceNodeId + " ";
        }
        var inverseRel = false;
        var pivotLabelStr = "";
        if (pivotLabel && pivotLabel != "") {
            if (pivotLabel.indexOf("-") == 0) {
                inverseRel = true;
                pivotLabel = pivotLabel.substring(1);
            }

            pivotLabelStr = ":" + pivotLabel;

        }
        var statement = "match path=((n:" + sourceLabel + ")--(r" + pivotLabelStr + ")--(m:" + sourceLabel + ")) "
        statement += whereStatement + toutlesensData.standardReturnStatement;
        console.log(statement);
        var payload = {match: statement};

        $("#waitImg").css("visibility", "visible");
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                if (data.length == 0) {
                    return $(messageDivId).html("no pivot values found");
                    $("#graphDiv").html("no pivot values found");
                }

                toutlesensData.cachedResultArray = data;
                currentDisplayType = "VISJS-NETWORK";

                visjsGraph.setLayoutType("random", null);
                toutlesensController.displayGraph(data, null, function (err, result) {


                    var nodes = visjsGraph.nodes;
                    var pivotNodes = [];
                    var distinctLabels = []
                    var distinctSourceNodes = {}

                    for (var key in nodes._data) {

                        var node = nodes._data[key];
                        if (node.labelNeo == sourceLabel && !distinctSourceNodes[node.label])
                            distinctSourceNodes[node.label] = node


                        if (distinctLabels.indexOf(node.labelNeo) < 0)
                            distinctLabels.push(node.labelNeo);

                        if (node.labelNeo != sourceLabel) {
                            node.nConnections = visjsGraph.getConnectedNodes(node.id).length
                            pivotNodes.push(node);


                        }


                    }

                    pivotNodes.sort(function (a, b) {
                        if (a.nConnections > b.nConnections)
                            return -1;
                        if (b.nConnections > a.nConnections)
                            return 1;
                        return 0


                    });

                //outline best pivots
                    var distinctPivotBetterNodes = []
                    for (var i = 0; i < pivotNodes.length; i++) {
                        if (i > (pivotNodes.length / 3))
                            break;
                        distinctPivotBetterNodes.push({id: pivotNodes[i].id, shape: "triangle"})
                    }
                    visjsGraph.updateNodes(distinctPivotBetterNodes)
                    if(sourceNodeId){
                        visjsGraph.updateNodes({id:sourceNodeId,shape:"star",size:50})
                    }



                    // var sss = pivotNodes[0];
                    visjsGraph.scaleNodes(nodes, "nConnections");

                    visjsGraph.drawLegend(distinctLabels);
                    toutlesensController.setRightPanelAppearance();

                    var distinctSourceNodesArray = [];
                    for (var key in distinctSourceNodes) {
                        distinctSourceNodesArray.push(distinctSourceNodes[key])
                    }
                    distinctSourceNodesArray.sort(function (a, b) {
                        if (a.label > b.label)
                            return 1;
                        if (a.label > b.label)
                            return -1;
                        return 0
                    })

                    distinctSourceNodesArray.splice(0, 0, "");
                    common.fillSelectOptions(pivotsDialogSourceNodeSelect, distinctSourceNodesArray, "label", "id");
                    $("#waitImg").css("visibility", "hidden");


                })


            },
            error: function (err) {
                console.log(err.responseText);
                $("#waitImg").css("visibility", "hidden");
            }
        })

    }
    /*


        self.buildCypherQuery = function (searchObj) {

            var maxDistance = searchObj.maxDistance;
            var str = ""

            var matchStr = "(n"
            if (searchObj.graphPathSourceNode.label)

                matchStr += ":" + searchObj.graphPathSourceNode.label;
            matchStr += ")-[r" + "*.."
                + maxDistance
                + "]-(m";
            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.label)
                matchStr += ":" + searchObj.graphPathTargetNode.label;
            matchStr += ")";

            var whereStr = ""
            if (searchObj.graphPathSourceNode.property)
                self.getWhereProperty(searchObj.graphPathSourceNode.property, "n");

            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.property) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                self.getWhereProperty(searchObj.graphPathTargetNode.property, "m");
            }
            if (searchObj.graphPathSourceNode.nodeId) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                whereStr += "ID(n)=" + searchObj.graphPathSourceNode.nodeId;
            }

            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.nodeId) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                whereStr += "ID(m)=" + searchObj.graphPathTargetNode.nodeId;
            }
            if (toutlesensData.queryExcludeNodeFilters)
                whereStr += toutlesensData.queryExcludeNodeFilters;


            var query = "Match path=" + matchStr;
            if (whereStr.length > 0)
                query += " WHERE " + whereStr;




            query += " RETURN  " + returnStr;

            query += " LIMIT " + limit;
            console.log(query);

            self.executeCypherAndDisplayGraph(query, searchObj);
        }
    */

    return self;

})()