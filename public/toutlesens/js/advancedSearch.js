var advancedSearch = (function () {

    var self = {};
    self.filterLabelWhere = ""
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;

    self.showDialog = function (initialLabel) {


        var filterMovableDiv = $("#filterMovableDiv").detach();
        $("#dialog").html(filterMovableDiv);
        advancedSearch.onChangeObjectName(currentObject.name);

        var str = "";

        //str += labelsCxbs;
        str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"advancedSearch.searchNodes('matchStr')\">List</button>";
        str += ' <button id="advancedSearchDialog_searchAndGraphButton" onclick="advancedSearch.searchNodes(\'matchStr\',advancedSearch.nodesQueryToGraph)">Graph</button>';

        $("#filterActionDiv").html(str);

        /*  $("#dialog").load("htmlSnippets/advancedSearchMenu.html", function () {*/
        $("#dialog").dialog("option", "title", "Advanced search");
        $("#dialog").dialog({modal: false});
        $("#dialog").dialog("open");
        var objectNameInput = $("#propertiesSelectionDialog_ObjectNameInput").val();
        if (!objectNameInput || objectNameInput == "") {
            filters.init();

        }
        $("#propertiesSelectionDialog_valueInput").val("")
        $("#propertiesSelectionDialog_valueInput").focus()
        if(initialLabel){
            $("#propertiesSelectionDialog_ObjectNameInput").val(initialLabel)
        }

        $("#filterOptionsDiv").html("");
        /*    toutlesensController.initLabels(advancedSearchDialog_LabelSelect);
            filters.initLabelProperty("",advancedSearchDialog__propsSelect)
            $("#advancedSearchDialog__propsSelect").val(Schema.getNameProperty())

        })*/
    }

    self.onChangeObjectName = function (value) {
        self.setPermittedLabelsCbxs(value);
        filters.initProperty(null, value, propertiesSelectionDialog_propsSelect)
    }
    self.setPermittedLabelsCbxs = function (label) {
        var labelsCxbs = "<br><b>Show nodes with label </b><ul>";
        var labels = Schema.getPermittedLabels(label,true,true);
        for (var i = 0; i < labels.length; i++) {
            var label2=labels[i];//.replace(/^-/,"");
            labelsCxbs += "<li><input type='checkbox' checked='checked' name='advancedSearchDialog_LabelsCbx' value='" + label2 + "'>" + label2 + "</li>"
        }
        labelsCxbs += "<ul>";
        $("#filterOptionsDiv").html(labelsCxbs);
    }


    /**
     * 
     * 
     * @param resultType "string" or "object"
     * @param callback
     */

    self.searchNodes = function (resultType,callback) {
        currentObject.id = null;
        $("#waitImg").css("visibility", "visible")
        var searchObj = {};
        self.filterLabelWhere = ""


        var objectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
        if (objectType == "node")
            searchObj.label = $("#propertiesSelectionDialog_ObjectNameInput").val();
        if (objectType == "relation")
            searchObj.relType = $("#propertiesSelectionDialog_ObjectNameInput").val();
        searchObj.property = $("#propertiesSelectionDialog_propsSelect").val();
        searchObj.operator = $("#propertiesSelectionDialog_operatorSelect").val();
        searchObj.value = $("#propertiesSelectionDialog_valueInput").val();

        var selectedLabels = [];
        $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
            selectedLabels.push($(this).val());
        });

        if (selectedLabels.length > 0) {
            var whereFilter = "labels(m) in ["
            for (var i = 0; i < selectedLabels.length; i++) {
                if (i > 0)
                    whereFilter += ','
                whereFilter += '"' + selectedLabels[i] + '"'
            }
            whereFilter += ']';
            self.filterLabelWhere = whereFilter;


        }


        //if  no value consider that there is no property set
        if (searchObj.value == "")
            searchObj.property = "";


        if (searchObj.property == "") {
            if (searchObj.value == "") {// only  search on label or type
                var options = {
                    subGraph: subGraph,
                    label: searchObj.label,
                    word: null,
                    resultType: resultType,
                    limit: Gparams.jsTreeMaxChildNodes,
                    from: 0,
                    resultType:resultType
                }
                toutlesensData.searchNodesWithOption(options, function (err, result) {
                    //   toutlesensData.searchNodes(subGraph, searchObj.label, null, "matchStr", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                    if (callback) {
                        return callback(result);
                    }
                    infoGenericDisplay.loadSearchResultIntree(err, result);
                    setTimeout(function () {
                        toutlesensController.setRightPanelAppearance(true);
                        infoGenericDisplay.expandAll("treeContainer");
                        $("#dialog").dialog("close");
                    }, 500)


                })
                return;

            }

          /*  if(false) {
                var data = [];// stack all results and then draw tree
                var index = 0;
                var countOptions = $('#propertiesSelectionDialog_propsSelect').children('option').length - 1;
                $("#propertiesSelectionDialog_propsSelect option").each(function () {
                    var property = $(this).val();

                    if (property != "") {
                        var value = property + ":~ " + searchObj.value;
                        var options = {
                            subGraph: subGraph,
                            label: searchObj.label,
                            word: value,
                            resultType: "list",
                            limit: Gparams.jsTreeMaxChildNodes,
                            from: 0
                        }
                        toutlesensData.searchNodesWithOption(options, function (err, result) {
                            //  toutlesensData.searchNodes(subGraph, searchObj.label, value, "list", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                            index += 1;
                            for (var i = 0; i < result.length; i++) {
                                data.push(result[i])
                            }
                            if (index >= countOptions) {
                                if (callback) {
                                    return callback(data);
                                }
                                infoGenericDisplay.loadTreeFromNeoResult("#", data);
                            }
                            setTimeout(function () {

                                toutlesensController.setRightPanelAppearance(true);
                                infoGenericDisplay.expandAll("treeContainer");
                            }, 500)

                        })
                    }
                });
            }*/

        } else {
            if (searchObj.operator == "contains")
                searchObj.operator = "~";
            var value = searchObj.property + ":" + searchObj.operator + " " + searchObj.value;
            var options = {
                subGraph: subGraph,
                label: searchObj.label,
                word: value,
                resultType: resultType,
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0
            }
            toutlesensData.searchNodesWithOption(options, function (err, result) {
                // toutlesensData.searchNodes(subGraph, searchObj.label, value, "matchStr", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                if (callback) {
                    return callback(result);
                }
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
            //if ((/[\s\S]+/).test(value))
            if (!(/^-?\d+\.?\d*$/).test(value))//not number
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
                    $("#similarsDialogSimilarsDiv").html("nos similarities found");
                    return;//messageDivId.html("nos similarities found");
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


    self.searchLabelsPivots = function (sourceLabel, pivotLabel, sourceNodeId, pivotNumber, messageDivId) {
        if (!sourceLabel) {
            return $(messageDivId).html("require source label");

        }
        var whereStatement = "";
        if (subGraph) {
            whereStatement = " where n.subGraph='" + subGraph + "' "
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

        var strWhere = "";
        var limit = pivotNumber;
        if (sourceNodeId)
            strWhere = ' where id(n)=' + sourceNodeId + ' ';
        if (subGraph) {
            if (strWhere == "")
                strWhere = ' where n.subGraph="' + subGraph + '" ';
            else
                strWhere += ' and n.subGraph="' + subGraph + '" ';
        }
        var statement = "Match path=((n:" + sourceLabel + ")-[r]-(p" + pivotLabelStr + ")--(m:" + sourceLabel + ")) " + strWhere + " RETURN distinct p, count(p) as countR order by countR desc limit " + limit;
        console.log(statement);
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: {match: statement},
            dataType: "json",
            success: function (pivotIds, textStatus, jqXHR) {
                var idsWhere = " where ID(m) in["
                for (var i = 0; i < pivotIds.length; i++) {
                    if (i > 0)
                        idsWhere += ","
                    idsWhere += pivotIds[i].p._id;
                }
                idsWhere += "] ";

                var where2 = "";
                if (sourceNodeId)
                    where2 = ' and id(n)=' + sourceNodeId + ' ';
                if (subGraph)
                    where2 += ' and n.subGraph="' + subGraph + '" ';

                var statement = "match path=((n:" + sourceLabel + ")--(m" + pivotLabelStr + "))";//--(m:" + sourceLabel + ")) "
                statement += idsWhere + where2 + toutlesensData.standardReturnStatement + " limit " + Gparams.maxResultSupported;

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
                        var distinctSourceNodesArray = [];
                        var sourceNodesArray = [];
                        for (var i = 0; i < data.length; i++) {
                            var name = data[i].nodes[0].properties[Schema.getNameProperty()];
                            if (distinctSourceNodesArray.indexOf(name) < 0) {
                                sourceNodesArray.push({name: name, id: data[i].nodes[0]._id});
                                distinctSourceNodesArray.push(name);
                            }

                        }
                        sourceNodesArray.sort(function (a, b) {
                            if (a > b)
                                return 1;
                            if (a < b)
                                return -1;
                            return 0;
                        });
                        sourceNodesArray.splice(0, 0, "");
                        common.fillSelectOptions(pivotsDialogSourceNodeSelect, sourceNodesArray, "name", "id");

                        var setPivotsLayout = function () {
                            var updatedNodes = [];
                            var offsetX = 0;
                            offsetX = $("#graphDiv").width();
                            var offsetY = 0;
                            offsetY = $("#graphDiv").height();
                            var offsetX = (offsetX) - 200;
                            var offsety = (offsetY / 2) + 20;
                            var count0 = pivotIds[0].countR;
                            for (var i = 0; i < Math.min(pivotIds.length, 20); i++) {
                                var node = {id: pivotIds[i].p._id, shape: "star", size: 18}
                                if (i == 0 || count0 == pivotIds[i].countR) {
                                    node.size = 20;
                                }
                                node.x = -offsetX;//+(i*50);
                                node.y = -(offsetY / 2) + (i * 60);
                                node.label = pivotIds[i].p.properties[Schema.getNameProperty()];//+ " (" + pivotIds[i].countR + " relations)";

                                updatedNodes.push(node)
                            }

                            visjsGraph.nodes.update(updatedNodes);

                            var node = pivotIds[(Math.round(pivotNumber / 2)) - 2].p._id
                            visjsGraph.network.focus(node,
                                {
                                    scale: 0.7,
                                    animation: {
                                        duration: 1000,
                                    }
                                });
                            //  visjsGraph.network.fit()
                        }
                        toutlesensData.cachedResultArray = data;
                        currentDisplayType = "VISJS-NETWORK";

                        visjsGraph.setLayoutType("random", null);

                        var options = {
                            showNodesLabel: false,
                            stopPhysicsTimeout: 1000,
                            onFinishDraw: setPivotsLayout,
                            // clusterByLabels:["document"]
                        }
                        toutlesensController.displayGraph(data, options, function (err, result) {


                            $("#filtersDiv").html("");
                            $("#graphMessage").html("");


                        });


                    },
                    error: function (err) {
                        return console.log(err);
                    }
                });
            }
            ,
            error: function (err) {
                return console.log(err);
            }
        });




    }
    /**
     * execute node query to get ids ans then build a graph query and display it
     *
     *

     * @param query
     */
    self.nodesQueryToGraph = function (query) {

        var payload = {
            match: query
        }

        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var ids = [];
                for (var i = 0; i < data.length; i++) {
                    ids.push(data[i].n._id)
                }


                toutlesensData.setSearchByPropertyListStatement("_id", ids, function (err, result) {
                  /*  if(toutlesensData.whereFilter!="")
                        toutlesensData.whereFilter+= " and " + self.filterLabelWhere;
                    else*/
                      //  toutlesensData.whereFilter =self.filterLabelWhere;
                    toutlesensController.generateGraph(null, {applyFilters: true,  dragConnectedNodes:true}, function () {

                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");


                    });

                })
            }
        })


    }
    self.transitiveRelationsAction = function (action) {
        if (action == "add") {
            var label = $("#transitiveRelations_labelsSelect").val();
            $('#transitiveRelations_selectedLabels').append($('<option>', {
                value: label,
                text: label

            }));

            $("#transitiveRelations_labelsSelect option").remove();
            var getPermittedLabels = Schema.getPermittedLabels(label);
            getPermittedLabels.splice(0, 0, "");
            for (var i = 0; i < getPermittedLabels.length; i++) {
                var label2 = getPermittedLabels[i];//.replace("-","");
                if (label2 != label)

                    $('#transitiveRelations_labelsSelect').append($('<option>', {
                        value: label2,
                        text: label2

                    }));
            }
        }

        else if (action == "removeOption") {

            value = $("#transitiveRelations_selectedLabels").val();
            $('#transitiveRelations_selectedLabels').find('option[value="' + value + '"]').remove();


        }
        else if (action == "reset") {
            $("#transitiveRelations_selectedLabels option").remove();
            toutlesensController.initLabels(transitiveRelations_labelsSelect, true);


        }
        else if (action == "draw") {
            var match = "MATCH path=";
            var size = $('#transitiveRelations_selectedLabels option').size();
            $("#transitiveRelations_selectedLabels option").each(function (index, value) {
                var label = this.value;
                if (index == 0)
                    match += "(n:" + label + ")-[r]";
                else if (index >= (size - 1))
                    match += "->(m:" + label + ")";
                else
                    match += "->(:" + label + ")-[]";

            })
            toutlesensData.matchStatement = match;

            toutlesensController.generateGraph(null);


        }


    }

    return self;

})()