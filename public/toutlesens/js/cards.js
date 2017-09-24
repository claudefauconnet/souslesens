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
 *******************************************************************************/
var cards = (function () {
    var self = {};
    self.currentNodes = {};
    self.defaultnodeNameField = "name";
    //  self.currentState.currentDiv="";
    //  self.currentState.parentDiv="";
    self.currentChildrenLabels = {};
    self.detachedDivs = {};
    self.currentLabel;
    self.iconSize = "20px";
    self.subGraph;
    self.zIndex = 0;
    self.write = 0;


    self.currentState = {
        selectedDiv: "",
        labelDiv: "",
        nodeDiv: "",
        parentDiv: "",
        zIndex: 0


    }
    var infosControlsDivHtml = "";

    self.init = function () {
        infosControlsDivHtml = $("#infosControlsDiv").html();
        $("#backgroundDiv").html("");
        if (Schema)
            self.defaultnodeNameField = Schema.getNameProperty();
        self.currentState = {
            selectedDiv: "",
            labelDiv: "",
            nodeDiv: "",
            parentDiv: "",
            zIndex: 0


        }
    }

    var closeDivHtml = "<input type='image' src='./icons/cross.png' onclick='cards.closeDiv(this.parentElement)' width='15px' align='right'>  "


    self.onDivClick = function (event, childDiv) {
        window.event.stopPropagation();

        //************ modify border on selected div **********************
        $(".parent").css("border-width", "1px");
        $(".parent").css("border-color", "black");
        $(".child").css("border-width", "1px");
        $(".child").css("border-color", "black");

        $(childDiv).css("border-width", "6px");
        $(childDiv).css("border-color", "#ddd");


        self.currentState.selectedDiv = childDiv;
        if (childDiv.id.indexOf("L_") == 0) {//&& ( self.currentState.parentDiv.id.indexOf("L_") != 0)) {//click on child label div

            var neoId = getDivNeoId(childDiv.id);
            var label = getDivLabel(childDiv.id);

            self.showData(neoId, function (html) {

                if (true) {
                 //   self.drawCards(label, neoId, "childrenNodes");
                    self.drawCards(label, neoId, "childrenNodes");
                }
                else {
                    $(childDiv).prepend("<div>" + html + "</div>");
                    var childnode = self.currentNodes[neoId];
                    self.drawCards(label, neoId, "childrenNodes");

                }

            });


        }
        else {// click on node div
            self.currentState.nodeDiv = childDiv;

            var neoId = getDivNeoId(childDiv.id);
            if (true || event.altKey) {

                var childnode = self.currentNodes[neoId];
                if (!childnode)
                    self.drawCards(null, neoId);
                else
                    self.drawCards(null, childnode.neoId, "childrenLabels");

            }
            else {
                self.showData(neoId, function (html) {

                    $(childDiv).prepend("<div>" + html + "</div>");
                    var childnode = self.currentNodes[neoId];
                    self.drawCards(null, childnode.neoId, "childrenLabels");

                });
            }
        }

        self.currentState.parentDiv = self.currentState.selectedDiv;
    }

    /*  self.onDblClickchild = function (childDiv) {
     window.event.stopPropagation();
     self.currentState.currentDiv = childDiv;

     var neoId = getDivNeoId(childDiv.id);

     var childnode = self.currentNodes[neoId];

     self.drawCards(childnode.label, childnode.neoId, true);
     }*/

    /*  self.onBackToParent = function (neoId) {
     var node = self.currentNodes[neoId];

     if (node.parent && self.currentNodes[node.parent].parent)
     self.drawCards(null, node.neoId, true);
     else if (self.currentLabel)
     self.drawCards(self.currentLabel, true);
     }*/

    self.closeDiv = function (div) {
        window.event.stopPropagation();
        $(div).remove();

    }

    /*
     self.initFilters = function () {
     var str = "";
     for (var label in self.currentChildrenLabels) {

     var divId = "\"F_" + label + "\"";
     var style = ""// " style=\"background-color:" + Schema.schema.labels[label].color + ";z-index:"+(self.zIndex++)+ "\"";
     str += "<span class='filter' id=" + divId + style + " onclick='cards.setFilters(this)'>" + label + "</span>"

     }
     $("#filterDiv").html(str);
     }*/

    /*self.setFilters = function (filter) {
     var label = filter.id.substring(2);
     var status = -self.currentChildrenLabels[label].show;
     self.currentChildrenLabels[label].show = status;
     for (var neoId in self.currentNodes) {

     var node = self.currentNodes[neoId];
     if (node.label == label && node.divId) {

     if (status == -1) {

     var parentDivId = $('#' + node.divId);
     var parentDivId = $('#' + node.divId).parent().attr('id');
     var html = $('#' + node.divId).html();
     self.detachedDivs[node.divId] = {parentdivId: parentDivId, html: html};
     $('#' + node.divId).detach();
     }
     else {
     var divObj = self.detachedDivs[node.divId];
     $('#' + divObj.parentdivId).append(divObj.html);

     }


     }
     }

     }*/


    self.showData = function (neoId, callback) {
        // self.initFilters()
        var matchStr = "match (n) where ID(n)=" + neoId + " return n ";
        var payload = {match: matchStr};
        infoGenericDisplay.callAPIproxy(payload, "retrieve", function (error, data) {
            var node = data[0].n.properties;
            var label = data[0].n.labels[0];
            node.label = label;
            var attrObject = Schema.schema.properties[label];
            infoGenericDisplay.userRole = (self.write == 1 ? "write" : "read");
            infoGenericDisplay.setAttributesValue(label, attrObject, node);
            infoGenericDisplay.drawAttributes(attrObject, "nodeInfosDiv");


            var html = $("#nodeInfosDiv").html();
            if (self.write == 1) {
                html = infosControlsDivHtml + html;
            }

            return callback(html);
            //   $("#dialog").dialog("option", "title","["+node.label+"] "+node[self.defaultnodeNameField]);
            //  $("#dialog").dialog("open")


        })


    }

    self.save = function () {
        infoGenericDisplay.saveNode();
    }
    self.delete = function () {
        infoGenericDisplay.deleteNode();
    }
    self.add = function () {
        var permittedRelations = Schema.getPermittedRelations(self.currentNodes[neoId].label);

    }

    self.drawCards = function (label, id, displayMode, newNodes) {
        infoGenericDisplay.userRole = self.wr
        if (label)
            self.currentLabel = label;


        function execute(newNodes) {
            var oldHtml = $("#backgroundDiv").html();


            function getChildNodeHtml(child) {

                var title = child[self.defaultnodeNameField];

                var style = " style='z-index:" + (self.currentState.zIndex++) + "' ";
                var icon = "";
                var color = "#eee";
                if (Schema.schema.labels[child.label]) {
                    color = Schema.schema.labels[child.label].color;

                    /*   var icon2 = Schema.schema.labels[child.label].icon;
                     if (icon2) {
                     style = ""
                     icon = "<span class='imgframe' style=\"padding:10px;background-color:" + color + "\"><img src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " ></span>";
                     }*/
                    icon = "";


                }


                var childDivId = getDivFromNeoId("C", child.neoId);
                self.currentNodes[childKey].divId = childDivId;

                var html = ' <div id=' + childDivId + style + ' class="child"  draggable="true" ondragstart="drag(event)"  ondblclick="cards.onDblClickchild(this)" onclick="cards.onDivClick(event,this)" >' + icon + title + closeDivHtml + '</div>';
                return html;
            }


            function getChildrenLabelsHtml(nodes) {
                var labelClusters = {};
                var html = "";

                for (var key in  nodes) {

                    var list = nodes[key];

                    var map = {};
                 if (false  && list.children) {
                        map = list.children;
                    }
                    else {
                        map = nodes;
                    }
                }

                    var newHtml = "";
                    for (var childKey in  map) {
                        var child = map[childKey];
                        if (!labelClusters[child.label])
                            labelClusters[child.label] = []
                        labelClusters[child.label].push(child);
                    }
                    //  }




                for (var childLabel in  labelClusters) {
                    color = Schema.schema.labels[childLabel].color;
                  var count = labelClusters[childLabel].length;
                  //  var count =Object.keys(nodes).length;
                    var icon2 = Schema.schema.labels[childLabel].icon;
                    if (icon2) {
                        style = " style='z-index:" + (self.currentState.zIndex++) + "' ";
                        //   icon = "<span class='imgframe' style=\"padding:10px;background-color:" + color + "\"><img src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " >";
                        icon = "<img  class='imgframe' style='border-color:" + color + "' src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " >";
                    }

                    var nodeId = labelClusters[childLabel];
                    var labelDivId = getDivFromNeoId("L", list.parent, childLabel);
                    html += ' <div id=' + labelDivId + style + ' class="childLabel"   onclick="cards.onDivClick(event,this)"  >' + icon + childLabel + " (" + count + ") " + closeDivHtml + '</div>';
                }
                return html;
            }


            if (displayMode == "childrenLabels" && id) {// already have list
                var newHtml = getChildrenLabelsHtml(newNodes)
                $(self.currentState.selectedDiv).append(newHtml);
            }

            else if (displayMode == "childrenNodes" && id) {// already have list and a card is dblclicked
                for (var key in  newNodes) {

                    var list = newNodes[key];

                    if (list.neoId == id) {
                        var newHtml = "";
                        for (var childKey in  list.children) {
                            var child = list.children[childKey];

                            self.currentNodes[childKey] = child;
                            newHtml+= getChildNodeHtml(child);

                        }


                        $(self.currentState.selectedDiv).append(newHtml);


                    }


                }

            }
            else if (displayMode == "cards") {
                var html = "";
                var lists = [];
                var sort = $("#sortSelect").val();
                $("#backgroundDiv").html("");

                for (var key in  newNodes) {
                    var node = newNodes[key];
                    self.currentNodes[key] = node;
                    if (node.isParent) {
                        lists.push(node);
                    }
                }
                lists.sort(function (a, b) {

                    if (sort == "children+")
                        return a.nChildren - b.nChildren;
                    else if (sort == "children-")
                        return b.nChildren - a.nChildren;
                    else if (sort == "alphabetic") {
                        if (a[defaultnodeNameField] > b[defaultnodeNameField])
                            return 1;
                        else if (a[defaultnodeNameField] < b[defaultnodeNameField])
                            return -1
                        else
                            return 0;
                    }

                    return 0;
                })


                for (var i = 0; i < lists.length; i++) {

                    var list = lists[i];
                    if (list.isParent) {
                        var title = "[" + list.label + "]" + list[self.defaultnodeNameField];
                        var backInput = "";


                        var style = " style='z-index:" + (self.currentState.zIndex++) + "' ";
                        var icon = "";
                        var color = "#eee";
                        if (Schema.schema.labels[list.label]) {
                            color = Schema.schema.labels[list.label].color;
                            var icon2 = Schema.schema.labels[list.label].icon;
                            if (icon2) {
                                //   icon = "<span class='imgframe' style=\"padding:10px;background-color:" + color + "\"><img src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " ></span>";
                                icon = "<img  class='imgframe' style='border-color:" + color + "' src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " >";
                                style = ""
                            }


                        }

                        var parentDivId = getDivFromNeoId("P", list.parent);
                        self.currentNodes[list.neoId].divId = parentDivId;
                        html = ' <div id=' + parentDivId + style + ' class="parent" ondrop="drop(event)"  onclick="cards.onDivClick(event,this)" ondragover="allowDrop(event)">' + icon + title;


                        var childrenNodes = {}
                        for (var childKey in  list.children) {
                            var child = list.children[childKey];
                            self.currentNodes[childKey] = child;
                            childrenNodes[childKey] = list.children[childKey];

                        }
                        html += getChildrenLabelsHtml(childrenNodes);


                        /*
                         var style = " style='z-index:" + (self.currentState.zIndex++) + "' ";
                         var icon = "";
                         var color = "#eee";
                         if (Schema.schema.labels[child.label]) {
                         color = Schema.schema.labels[child.label].color;
                         var icon2 = Schema.schema.labels[child.label].icon;
                         if (icon2) {
                         //   icon = "<img src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " >";
                         //  style = ' style="background-color:' + color + ';z-index:' + (self.zIndex++) + '" ';
                         style = ""
                         //   icon = "<span  class='imgframe' style=\"padding:10px;background-color:" + color + "\"><img src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " ></span>";
                         icon = "<img  class='imgframe' style='border-color:" + color + "' src='/toutlesens/icons/" + icon2 + "' width=" + self.iconSize + " >";

                         }


                         }
                         var title = "[" + child.label + "]" + child[self.defaultnodeNameField];
                         var childDivId = getDivFromNeoId("C", child.neoId);
                         self.currentNodes[childKey].divId = childDivId;
                         html += ' <div id=' + childDivId + style + ' class="child"  draggable="true" ondragstart="drag(event)" ondblclick="cards.onDblClickchild(this)" onclick="cards.onDivClick(event,this)" >' + icon + title + closeDivHtml + '</div>';

                         }*/


                        html += '</div>';
                        $("#backgroundDiv").append(html);
                    }

                }

            }
        }

        if (newNodes) {
            execute(newNodes);

        }
        else {
            self.setCurrentNodes(label, id, displayMode, function (err, newNodes) {
                execute(newNodes);
            })
        }


    }

    self.setCurrentNodes = function (label, id, displayMode, callback) {

        var where = "";
        if (!self.subGraph)
            self.subGraph = subGraph;
        if (self.subGraph)
            where = " WHERE n.subGraph=\"" + self.subGraph + "\" ";
        if (id) {
            if (where == "")
                where += " WHERE ID(n)=" + id + " ";
            else
                where += " AND ID(n)=" + id + " ";
        }
        else {
            self.currentChildrenLabels = {};
        }
        var nLabel = "";
        var mLabel = "";
        if (label && displayMode == "cards")
            nLabel = ":" + label;
        else if (label)
            mLabel = ":" + label;

        var matchStr = "MATCH (n" + nLabel + ")-[r]-(m" + mLabel + ") " + where + " RETURN n,r,m";
        var payload = {match: matchStr};
        var previousParentId;
        /*  if (id && self.currentNodes[id] && self.currentNodes[id].parent )
         previousParentId=self.currentNodes[id].parent;*/
        console.log(matchStr);
        self.callAPIproxy(payload, "retrieve", function (error, data) {
            if (error)
                return callback(error);

            var newNodes = {};
            var relation, neoId;
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                if (obj.r) {
                    relation = obj.r;

                }


                if (obj.n) {//Neo

                    neoId = obj.n._id;
                    if (!newNodes[neoId]) {
                        var label = obj.n.labels[0];
                        obj = $.extend(true, {}, obj.n.properties);
                        obj.label = label;
                        obj.neoId = neoId;
                        obj.isParent = 1;
                        obj.nChildren = 0;


                        newNodes[neoId] = obj;
                        newNodes[neoId].children = {}
                    }
                    else
                        newNodes[neoId].nChildren += 1;


                }
                obj = data[i];
                if (obj.m) {//Neo


                    childNeoId = obj.m._id;
                    if (self.currentNodes[neoId] && childNeoId == self.currentNodes[neoId].parent)// dont repeat parent in children
                        continue;

                    var label = obj.m.labels[0];
                    if (!self.currentChildrenLabels[label])
                        self.currentChildrenLabels[label] = {show: 1};
                    var childObj = $.extend(true, {}, obj.m.properties);
                    childObj.label = label;
                    childObj.neoId = childNeoId;
                    childObj.parent = neoId;
                    if (self.currentNodes[id] && self.currentNodes[id].parent)
                        obj.ancestor = self.currentNodes[id].parent;
                    childObj.isChild = 1;
                    childObj.nChildren = 0;
                    if (!newNodes[neoId].children)
                        newNodes[neoId].children = {};
                    if (!newNodes[neoId].children[childNeoId])
                        newNodes[neoId].children[childNeoId] = childObj;
                    if (!newNodes[childNeoId])
                        newNodes[childNeoId] = childObj;

                }
            }
            callback(null, newNodes)

        });


    }

    self.callAPIproxy = function (payload, operation, callback) {

        $.ajax('/rest/?' + operation + '=1', {
            data: payload,
            dataType: "json",
            type: 'POST',
            error: function (error, ajaxOptions, thrownError) {
                console.log(error.responseText);
                $("#message").html("ERROR " + method + " : " + error.responseText);
                callback(error.responseText);
            }
            ,
            success: function (data) {
                callback(null, data);
            }
        })


        if (self.MongoStorage) {
            neoToMongo.callMongo(payload, operation, callback);
        }
    }

    function getDivNeoId(divId) {
        var p = divId.indexOf("-");
        var value = divId.substring(2, p);
        // return parseInt(value);
        return value;
    }

    function getDivLabel(divId) {
        if (divId.indexOf("-") <0) {
            return "";
        }
        var p = divId.indexOf("-");
        var q = divId.substring(2).indexOf("_")+2;
        var value = divId.substring(p + 1, q);
        // return parseInt(value);
        return value;
    }

    function getDivFromNeoId(preffix, neoId, label) {
        var random = Math.round(Math.random() * 1000000);
        return preffix + '_' + neoId + "-" + label + "_" + random + ''

    }


    return self;


})
();