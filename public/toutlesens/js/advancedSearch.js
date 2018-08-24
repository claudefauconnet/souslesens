var advancedSearch = (function () {

    var self = {};
    self.filterLabelWhere = "";
    self.currentObject = {};
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
    self.context = {}
    self.searchClauses = [];

    self.showDialog = function (options) {
        self.filterLabelWhere = "";


        $("#dialog").load("htmlSnippets/advancedSearchDialog.html", function () {

            searchMenu.init(Schema);

        });
        $("#dialog").dialog("option", "title", "Advanced search");
        $("#dialog").dialog({modal: false});
        $("#dialog").dialog("open");


    }


    self.showDialogOld = function (options) {

        filters.setLabelsOrTypes("node");
        $("#word").val("");


        if (!options)
            options = {};
        var initialLabel = options.initialLabel;
        if (self.context && self.context.pathType) {
            self.searchClauses = [];
            $("#searchCriteriatextSelect").find('option').remove();
            $("#searchCriteriaTextDiv").css("visibility", "hidden");
        }


        if (options.multipleClauses) {
            $("#searchCriteriaAddButton").css("visibility", "visible");
            if (self.searchClauses.length > 0) {
                $("#searchCriteriaTextDiv").css("visibility", "visible");
            }
        }


        else
            $("#searchCriteriaAddButton").css("visibility", "hidden");
        var filterMovableDiv = $("#filterMovableDiv").detach();
        $("#dialog").html(filterMovableDiv);
        $("#BIlegendDiv").html("");
        advancedSearch.onChangeObjectName(currentObject.name);

        var str = "";

        //str += labelsCxbs;

        if (self.context.pathType == "allTransitivePaths") {
            if (self.context.target == "source")
                str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setStartLabelQuery()\">OK</button>";
            else if (self.context.target == "target") {
                str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery()\">OK</button>";


            }

        }

        else if (false) {
            str += "<b>Graph</b>"
            str += " <button id=\"advancedSearchDialog_searchAndGraphButton\"  onclick=\"advancedSearch.searchNodes('matchStr',null,advancedSearch.graphNodesAndDirectRelations);$('#dialog').dialog('close')\">Neighbours</button>&nbsp;";
            str += " <button id=\"advancedSearchDialog_searchAndGraphButton\"  onclick=\"advancedSearch.graphOnly();$('#dialog').dialog('close')\">Only</button>&nbsp;";
            str += "<br><b></b>"
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"advancedSearch.searchNodes('matchStr',null,infoGenericDisplay.loadSearchResultIntree);$('#dialog').dialog('close'); $('#findTabs').tabs({active:0});\">List</button>";
        }


        else {
            str += "<select id='advancedSearchAction'   onchange='searchMenu.onSearchAction($(this).val())'><option value=''>Choose...</option><option value='listNodes'>list nodes</option><option value='graphNodes'>graph nodes</option><option value='graphAllNeighbours'>graph all neigbours</option><option value='graphSomeNeighbours'>graph some neigbours...</option><option value='graphSimilars'>graph similars </option></select>";
        }


        $("#filterActionDiv").html(str);

        $("#advancedSearchDialog_searchAndGraphButton").css("background-color", "#5F5F5F");

        /*  $("#dialog").load("htmlSnippets/advancedSearchDialog.html", function () {*/
        $("#dialog").dialog("option", "title", "Advanced search");
        $("#dialog").dialog({modal: false});
        $("#dialog").dialog("open");
        var objectNameInput = $("#searchDialog_NodeLabelInput").val();
        if (!objectNameInput || objectNameInput == "") {
            filters.init();

        }
        $("#searchDialog_valueInput").val("")
        $("#searchDialog_valueInput").focus();
        if (initialLabel) {
            $("#searchDialog_NodeLabelInput").val(initialLabel)
        }

        $("#filterOptionsDiv").html("");

        if (options.setValueInput)
            $("#searchDialog_valueInput").val(options.setValueInput)
        if (options.addClauses) {
            for (var i = 0; i < options.addClauses.length; i++) {
                self.addClause(options.addClauses[i]);
            }
        }

    }

    self.onChangeObjectName = function (value) {
        // self.setPermittedLabelsCbxs(value);
        $("#searchDialog_valueInput").val("");
        $('#searchDialog_valueInput').focus();
        $("#searchDialog_NextPanelButton").css('visibility', 'visible');
        self.clearClauses();
        if (searchDialog_propertySelect) ;
        filters.initProperty(null, value, searchDialog_propertySelect);
        $("#searchDialog_propertySelect").val(Schema.getNameProperty(value))
    }
    self.setPermittedLabelsCbxs = function (label, selectId) {
        var labelsCxbs = "<br><table style='text-align: left;background-color: #eee; width: 300px;margin-bottom: 15px;'>";
        var labels = Schema.getPermittedLabels(label, true, true);
        for (var i = 0; i < labels.length; i++) {
            var label2 = labels[i];//.replace(/^-/,"");
            labelsCxbs += "<tr><td><input type='checkbox'  name='advancedSearchDialog_LabelsCbx' value='" + label2 + "'></td><td>" + label2 + "</td></tr>"
        }
        labelsCxbs += "</table>";
        $("#" + selectId).html(labelsCxbs);
    }

    self.addClauseUI = function (operator) {

        ;
        var clauseText = $("#searchDialog_propertySelect").val() + " " + $("#searchDialog_operatorSelect").val() + " " + $("#searchDialog_valueInput").val();
        self.searchNodes("matchSearchClause", null, function (err, clause) {
            if (err)
                return;
            $("#searchDialog_valueInput").val("");
            for (var i = 0; i < self.searchClauses.length; i++) {
                if (clause.nodeLabel != "" && self.searchClauses[i].nodeLabel != "" && clause.nodeLabel != self.searchClauses[i].nodeLabel)
                    return alert("you cannot add criteria on different labels :" + clause.nodeLabel != "" && self.searchClauses[i].nodeLabel)
            }


            self.addClause(clause);
            // clause.operator=operator;

        })
    }

    self.addClause = function (clause) {

        $("#searchDialog_NextPanelButton").css('visibility', 'visible');
        var clauseText = clause.nodeLabel + " ? " + clause.where;
        if (clauseText == " ? ")
            return;
        if (clause.where == "" && self.searchClauses.length > 0)
            return;
        $("#searchCriteriatextSelect option").each(function () {
            if ($(this).val() == clauseText)
                return; // already present
        })

        var clauseTextHuman = clauseText.replace("=~'(?i).*", " contains '")
        var clauseTextHuman = clauseTextHuman.replace("*'", "'")
        clause.title = clauseTextHuman;

        self.searchClauses.push(clause);
        $("#searchCriteriatextSelect").append($('<option>', {
            value: clauseText,
            text: clauseTextHuman
        }));
        //  $("#searchCriteriatextSelect").attr("size", self.searchClauses.length);
        $("#clearAllCreteriaButton").css("visibility", "visible");
        $("#searchDialog_SaveQueryButton").css("visibility", "visible")
        $("#searchDialog_Criteriatext").css("visibility", "visible");


    }

    self.clearClauses = function () {
        self.searchClauses = [];
        $('#searchCriteriatextSelect option').each(function () {
            $(this).remove();
        });

    }
    self.clearClause = function (select) {
        var value = $(select).val();
        self.searchClauses.splice(select.selectedIndex, 1);
        $('#searchCriteriatextSelect option').each(function () {
            if ($(this).val() == value) {
                $(this).remove();
            }
        });


    }

    self.getMultiCriteriaClauses = function () {
        var whereStr = "";
        var label = self.searchClauses[0].nodeLabel;
        if (subGraph)
            whereStr = "  n.subGraph=\"" + subGraph + "\" ";

        for (var i = 0; i < self.searchClauses.length; i++) {
            if (self.searchClauses[i].where != "") {
                if (whereStr == "")
                    whereStr = "";
                else
                    whereStr += " AND ";
                whereStr += self.searchClauses[i].where;
            }
        }
        $("#graphInfosDiv").html(whereStr);
        return {where: whereStr, nodeLabel: label};
    }


    self.searchNodesWithClauses = function (options, callback) {
        var clauses = self.getMultiCriteriaClauses();
        var whereStr = clauses.where;
        var label = clauses.nodeLabel;
        var labelStr = "";
        if (label && label.length > 0)
            labelStr = ":" + label;


        var query = "MATCH (n" + labelStr + ") " + " WHERE " + whereStr + " RETURN n";

        console.log(query);
        if (callback)
            return callback(null, query)
        self.graphNodesAndDirectRelations(null, query)


    }


    /**
     *
     *
     * Graph only nodes that match the query (n and m match teh query)
     *
     */

    /*self.graphOnly = function () {
        var where = "";
        var label = "";

        function execGraph() {
            var labelStr = "";
            if (label)
                labelStr = ":" + label;
            query = "MATCH path=(n" + labelStr + ")-[r]-(m" + labelStr + ") WHERE " + where + " AND " + where.replace(/n\./g, "m.") + " " + toutlesensData.standardReturnStatement;

            console.log(query);
            var payload = {match: query};
            $.ajax({
                type: "POST",
                url: toutlesensData.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    toutlesensController.displayGraph(data);
                },
                error: function (err) {
                    console.log(err);
                }
            })
        }

        if (self.searchClauses.length > 0) {
            var clauses = self.getMultiCriteriaClauses();
            label = clauses.nodeLabel;
            where = clauses.where;
            execGraph();


        } else {
            self.searchNodes("matchObject", null,function (err, result) {
                label = result.nodeLabel;
                where = result.where;
                execGraph();
            })


        }
    }*/


    /**
     *
     *
     * @param resultType "string" or "object"
     * @param callback
     */

    self.searchNodes = function (resultType, _options, callback) {
        if (!_options)
            _options = {}


        $("#waitImg").css("visibility", "visible")

        if (_options.targetNodesLabels) {
            var str = "[";
            for (var i = 0; i < _options.targetNodesLabels.length; i++) {
                if (str.length > 1)
                    str += ",";
                str += '"' + _options.targetNodesLabels[i] + '"';


            }
            str += "]";
            if (toutlesensData.whereFilter.length > 0)
                toutlesensData.whereFilter += " and "
            self.filterLabelWhere = " labels(m) in " + str + " ";

        }
        if (resultType != "matchSearchClause" && self.searchClauses.length > 0) {// multiple clauses

            return self.searchNodesWithClauses(_options, callback);
        }
        if (!currentObject)
            currentObject = {}
        currentObject.id = null;

        var searchObj = {};
        self.filterLabelWhere = "";
        var options = {};


        var objectType = $("#searchDialog_ObjectTypeInput").val();
        if (objectType == "node")
            searchObj.label = $("#searchDialog_NodeLabelInput").val();
        if (objectType == "relation")
            searchObj.relType = $("#searchDialog_NodeLabelInput").val();
        searchObj.property = $("#searchDialog_propertySelect").val();
        searchObj.operator = $("#searchDialog_operatorSelect").val();
        searchObj.value = $("#searchDialog_valueInput").val();


        /*  var selectedLabels = [];
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


          }*/


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
                    resultType: resultType
                }
                if (_options.matchType)
                    options.matchType = _options.matchType;


                toutlesensData.searchNodesWithOption(options, function (err, result) {
                    //   toutlesensData.searchNodes(subGraph, searchObj.label, null, "matchStr", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                    if (callback) {
                        return callback(err, result);
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
                  var countOptions = $('#searchDialog_propertySelect').children('option').length - 1;
                  $("#searchDialog_propertySelect option").each(function () {
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
                    return callback(err, result);
                }
                infoGenericDisplay.loadSearchResultIntree(err, result);
                setTimeout(function () {
                    toutlesensController.setRightPanelAppearance(true);
                    infoGenericDisplay.expandAll("treeContainer");
                }, 500)
                $("#dialog").dialog("close");


            })
        }


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


    self.searchSimilars = function (node, similarityTypes) {
        $("#similarsDialogSimilarsDiv").html("");
        var messageDivId = $("#similarsDialogMessageDiv");
        messageDivId.html("");
        if (!node)
            return messageDivId.html("no node selected");
        var label = node.label;
        if (node.labelNeo)
            label = node.labelNeo

        var statement = "match(n:" + label + ")-->(p)<--(m:" + label + ")";
        //  var statement = "match(n:" + label + ")-->(r)<--(m)";
        statement += " where id(n)=" + node.id + " ";

        if (similarityTypes && similarityTypes.length > 0) {
            var where2 = " and labels(p) in ["
            for (var i = 0; i < similarityTypes.length; i++) {
                if (i > 0)
                    where2 += ","
                where2 += '"' + similarityTypes[i] + '"';
            }
            where2 += "] "
            statement += where2;
        }

        statement += " return n as sourceNode,m as similarNode, collect(labels(p)[0]) as similarLabels,collect(p) as commonNodes, count(*) as count order by count desc";
        console.log(statement);
        var payload = {match: statement};


        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                if (data.length == 0) {
                    $("#similarsDialogSimilarsDiv").html("no similarities found");
                    return;//messageDivId.html("nos similarities found");
                }
                self.currentObject.similarLabels = []
                self.currentObject.similarNodes = [node.id]
                toutlesensData.cachedResultArray = data;
                var str = "<ul>";
                var max = data[0].count;
                for (var i = 0; i < data.length; i++) {


                    var line = data[i]
                    if (line.count == max) {
                        var str2 = "<ul>";
                        if (self.currentObject.similarNodes.indexOf(line.similarNode._id) < 0)
                            self.currentObject.similarNodes.push(line.similarNode._id)
                        for (var j = 0; j < line.commonNodes.length; j++) {

                            if (self.currentObject.similarLabels.indexOf(line.similarLabels[j]) < 0) {
                                self.currentObject.similarLabels.push(line.similarLabels[j]);
                            }
                            var linkstr2 = "javascript:toutlesensController.generateGraph(" + line.commonNodes[j]._id + ")";
                            str2 += "<li>[" + line.similarLabels[j] + "]<a href='" + linkstr2 + "'>" + line.commonNodes[j].properties[Schema.getNameProperty()] + "</a> </li> "
                        }
                        str2 += "</ul>";
                        var linkstr = "javascript:toutlesensController.generateGraph(" + line.similarNode._id + ")";
                        str += "<li><a href='" + linkstr + "'>" + line.similarNode.properties[Schema.getNameProperty()] + " </a>: " + str2 + "</li>";
                    }
                }
                str += "</ul>"
                var str2 = data[0].sourceNode.properties[Schema.getNameProperty()] + " :<b>Most similar nodes</b><button onclick='advancedSearch.similarsDialogShowRefineDialog()'>Refine</button>";
                str2 += "&nbsp;<button onclick='advancedSearch.similarsGraphSimilars()'>Graph</button>"
                str2 += "<br>" + str
                $("#similarsDialogSimilarsDiv").html(str2);
            },
            error: function (err) {

                console.log(err.responseText)
            }
        })


    }

    self.similarsDialogShowRefineDialog = function () {
        $("#similarsDialogSimilarsDiv").html("");
        var labelsCxbs = "Select aspects of the similarities<ul>"
        for (var i = 0; i < self.currentObject.similarLabels.length; i++) {
            var label2 = self.currentObject.similarLabels[i];
            labelsCxbs += "<li><input type='checkbox' checked='checked' name='advancedSearchDialog_LabelsCbx' value='" + label2 + "'>" + label2 + "</li>"
        }
        labelsCxbs += "<ul>";

        var str = labelsCxbs + "<br><button onclick='advancedSearch.similarsDialogExecRefine()'>refine</button>";
        $("#dialog").html(str);
        $("#dialog").dialog({modal: false});
        $("#dialog").dialog("option", "title", "Refine similar");
        $("#dialog").dialog("open");

    }
    self.similarsDialogExecRefine = function () {
        var similarityTypes = [];
        $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
            similarityTypes.push($(this).val());
        });
        self.searchSimilars(currentObject, similarityTypes);
    }


    self.similarsGraphSimilars = function () {
        currentObject.id = null;
        toutlesensData.setSearchByPropertyListStatement("_id", self.currentObject.similarNodes, function (err, result) {

            toutlesensController.generateGraph(null, null, function (err, result) {
                var selectedNodes = []
                for (var i = 0; i < self.currentObject.similarNodes.length; i++) {
                    selectedNodes.push({id: self.currentObject.similarNodes[i], shape: "star", size: 50, color: "red"})
                }
                visjsGraph.nodes.update(selectedNodes)
                //  visjsGraph.paintNodes(self.currentObject.similarNodes, null, null, null, "star")
            })
        })


    }


    self.searchLabelsPivots = function (sourceLabel, pivotLabel, sourceNodeId, pivotNumber, messageDivId) {

        var scope = $("#pivotsDialogScopeSelect").val();
        if (!sourceLabel) {
            return $(messageDivId).html("require source label");

        }
        var whereStatement = "";


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
        else if (scope == "currentGraph" && toutlesensData.currentStatement != null)
            strWhere = toutlesensData.getCurrentWhereClause()
        else if (subGraph) {
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
                                var node = {id: pivotIds[i].p._id, shape: "star", shape: "star", size: 50, color: "red"}
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
    self.graphNodesAndDirectRelations = function (err, query,callback) {

        if (err)
            return console.log(err);
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
                    if (self.filterLabelWhere.length > 0) {
                        if (toutlesensData.whereFilter != "")
                            toutlesensData.whereFilter += " and " + self.filterLabelWhere;
                        else
                            toutlesensData.whereFilter = self.filterLabelWhere;
                    }
                    if (callback) {
                        return callback();
                    }
                    toutlesensController.generateGraph(null, {
                        applyFilters: true,
                        dragConnectedNodes: true
                    }, function () {

                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");


                    });

                })
            }
        })


    }
    

    self.graphNodesOnly = function (err, query) {
        if (err)
            return console.log(err);
        var payload = {
            match: query
        }

        return cards.drawCards("domain", null, "cards")

        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var nodes = [];
                var labels = [];
                var data2 = [];
                // format data to be compliant with  connectors.neoResultsToVisjs
                for (var i = 0; i < data.length; i++) {
                    var node = data[i].n;
                    data2.push({nodes: [node]})
                }


                var json = connectors.neoResultsToVisjs(data2);

                visjsGraph.draw("graphDiv", json, {});
                visjsGraph.drawLegend(filters.currentLabels);
                if (paint.currentBIproperty && paint.currentBIproperty != "")
                    paint.paintClasses(paint.currentBIproperty)
            }
        })


    }

    self.graphNodesAndSimilarNodes = function (err, query) {
        if (err)
            return console.log(err);
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
                    toutlesensController.generateGraph(null, {
                        applyFilters: true,
                        dragConnectedNodes: true
                    }, function () {

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