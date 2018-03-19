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
var infoGenericDisplay = (function () {
    var self = {};

    self.Neo4jStorage = true;
    self.MongoStorage = false;
    self.synchronizeNeoToMongo = false;
    self.currentLabel = null;


    var limit = Gparams.jsTreeMaxChildNodes;
    self.jsTreeDivId = "treeContainer";
    var ids = {};
    self.subGraph;
    self.ignoredFields=['subGraph','id','color']
   // self.userRole = "write";
    var currentNameProperty;
    var currentMenuData;
    self.selectedNodeData;
    self.currentNodeChanges = [];
    self.currentRelationChanges = [];
    self.iconSize = "20px";
    self.isAddingRelation = false;


    self.initLabels = function (subGraph, callback) {
        self.clearNodePropertiesDiv();
        if (self.Neo4jStorage) {
            if (subGraph)
                self.subGraph = subGraph;
            else
                self.subGraph = $("#dbName").val();
            //subGraph= self.subGraph;
            /*  dataModel.initNeoModel(self.subGraph, function () {
             schema.generateNeoImplicitSchema(self.subGraph, true);*/
            var k = 0;

            var labels = [""];
            for (var label in Schema.schema.labels) {
                labels.push(label);

                if (!Schema.schema.labels[label].color) {

                    var paletteColor = Gparams.palette[k % Gparams.palette.length];
                    Schema.schema.labels[label].color = paletteColor;
                    nodeColors[label] = paletteColor;
                    k++;
                }
                else {
                    nodeColors[label] = Schema.schema.labels[label].color;
                }

                //  toutlesensController.setLinkColors();


            }

            labels.sort();


            if (nodesLabelsSelect)
                $("#nodesLabelsSelect").empty()
                    .append('<option value=""></option>')
            common.fillSelectOptionsWithStringArray(nodesLabelsSelect, labels);


        }
        else {
            self.subGraph = $("#dbName").val();
            //   Schema.schema.generateMongoImplicitSchema.schema(self.subGraph, true);
            neoToMongo.listCollections(self.subGraph, function (err, result) {
                common.fillSelectOptionsWithStringArray(nodesLabelsSelect, result);
            });


        }
        if (callback)
            callback();
    }

    self.expandAll = function (jsTreeDivId) {
        $('#' + jsTreeDivId).jstree("open_all");
    }


    self.loadTree = function (label, parentId, _matchStr, treeId) {

        var matchStr = "";
        ids = {};
        if (_matchStr)
            matchStr = _matchStr;
        else {
            currentNameProperty = Schema.getNameProperty(label);
            ids = {};
            var where = "";


            var rootId = "";
            matchStr = "MATCH (n:" + label + ") where n.subGraph='" + self.subGraph + "' return n limit " + limit;
        }

        var payload = {match: matchStr, nodeLabel: label, query: {}, limit: limit};

        self.callAPIproxy(payload, "retrieve", function (error, data) {
            currentDisplayType = "FLOWER";
            currentDisplayType = "VISJS-NETWORK";
            if (error)
                return;


            $("#treeContainer").css("visibility", "visible");


            var treeJson = self.formatResultToFlatJtreeData(data, parentId);
            var treeJson = self.formatResultToJtreeData(data, parentId);

            var plugins = [];
            //   plugins.push("search");
            plugins.push("sort");
            //   plugins.push("types");
            //  plugins.push("contextmenu");
            //  plugins.push("dnd");

            self.selectedNodeDatas = {};
            var types = {};

            var types = {};
            var labels = Schema.schema.labels;
            for (var label in labels) {

                // types[label] = {icon: "/toutlesens/icons/" + labels[label].icon}
            }
            if (!treeId)
                treeId = self.jsTreeDivId;

            var jsTree = $('#' + treeId);
            jsTree.jstree("destroy").empty();
            jsTree.on("select_node.jstree",
                function (evt, obj) {

                    $(".jstree-themeicon").css("background-size", self.iconSize);
                    self.onSelect(obj.node);
                })

                .on("loaded.jstree", function (evt, obj) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);


                })
                .on('rename_node.jstree', function (xx, obj, old) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);
                })
                .on('after_open.jstree', function (e, data) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);
                })
                .on('changed.jstree', function (e, data) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);
                })
                .on('delete_node.jstree', function (e, data) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);
                })
                .on('refresh_node.jstree', function (e, data) {
                    $(".jstree-themeicon").css("background-size", self.iconSize);
                })


                .jstree({
                        'core': {
                            data: treeJson,

                            // so that create works
                            'check_callback': function (operation, node, node_parent, node_position, more) {
                                // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                                // in case of 'rename_node' node_position is filled with the new node name
                                if (operation === "move_node") {
                                    var sourceNode = node.data;
                                    if (!more.ref)
                                        return true;
                                    var targetNode = more.ref.data;
                                    return self.canDrop(sourceNode, targetNode);
                                }
                                return true;  //allow all other operations
                            }
                        },
                        'contextmenu': {
                            'items': customMenu
                        },
                        "dnd": {
                            // check_while_dragging: true
                        },


                        "types": types,
                        "plugins": plugins,

                    }
                ).bind("move_node.jstree", function (e, data) {
                return self.ondDropEnd(data);


            });
            /*
             $(document).bind("dnd_move.vakata", function (data, element, helper, event) {
             self.ondDropEnd(data);

             });*/


        })


    }

    self.loadTreeFromNeoResult = function (parentId, data) {
        $("#waitImg").css("visibility", "hidden")
        $("#treeContainer").css("visibility", "visible");
        var treeJson = self.formatResultToJtreeData(data, parentId);
        self.initTree(treeJson);


    }

    self.initTree = function (treeJson) {
        var plugins = [];
        //   plugins.push("search");
        plugins.push("sort");
        plugins.push("types");
        plugins.push("contextmenu");
        plugins.push("dnd");

        self.selectedNodeDatas = {};
        var types = {};

        var types = {};
        var labels = Schema.schema.labels;
        for (var label in labels) {

            types[label] = {icon: "/toutlesens/icons/" + labels[label].icon}
        }

        $('#' + self.jsTreeDivId).jstree("destroy").empty();
        var jsTree = $('#' + self.jsTreeDivId)
            .on("select_node.jstree",
                function (evt, obj) {

                    $(".jstree-themeicon").css("background-size", self.iconSize);
                    self.onSelect(obj.node);
                })

            .on("loaded.jstree", function (evt, obj) {
                $(".jstree-themeicon").css("background-size", self.iconSize);


            })
            .on('rename_node.jstree', function (xx, obj, old) {
                $(".jstree-themeicon").css("background-size", self.iconSize);
            })
            .on('after_open.jstree', function (e, data) {
                $(".jstree-themeicon").css("background-size", self.iconSize);
            })
            .on('changed.jstree', function (e, data) {
                $(".jstree-themeicon").css("background-size", self.iconSize);
            })
            .on('delete_node.jstree', function (e, data) {
                $(".jstree-themeicon").css("background-size", self.iconSize);
            })
            .on('refresh_node.jstree', function (e, data) {
                $(".jstree-themeicon").css("background-size", self.iconSize);
            })


            .jstree({
                    'core': {
                        data: treeJson,

                        // so that create works
                        'check_callback': function (operation, node, node_parent, node_position, more) {
                            // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                            // in case of 'rename_node' node_position is filled with the new node name
                            if (operation === "move_node") {
                                var sourceNode = node.data;
                                if (!more.ref)
                                    return true;
                                var targetNode = more.ref.data;
                                return self.canDrop(sourceNode, targetNode);
                            }
                            return true;  //allow all other operations
                        }
                    },
                    'contextmenu': {
                        'items': customMenu
                    },
                    "dnd": {
                        // check_while_dragging: true
                    },


                    "types": types,
                    "plugins": plugins,

                }
            ).bind("move_node.jstree", function (e, data) {
                return self.ondDropEnd(data);


            });
    }

    function customMenu(node) {

        var menuItemData = $.extend(true, {}, node.data);//clone

        var items = {}

        if (node.parent != "#") {
            menuItemData.parentId = node.parent;
            menuItemData.parents = node.parents;
            items ["deleteRelation"] = {

                label: "Delete relation",
                data: menuItemData,
                action: (function (menuItem) {
                    self.onMenuDeleteRelation(menuItem);
                })

            }
        }
        var permittedRelations = Schema.getPermittedRelations(node.data.label, "both");
        for (var i = 0; i < permittedRelations.length; i++) {

            var relation = permittedRelations[i];
            var label2 = relation.endLabel;

            if (label2 == node.data.label) {// inverseRelation
                var label2 = relation.startLabel;
                permittedRelations[i].startLabel = permittedRelations[i].endLabel;
                permittedRelations[i].endLabel = label2;
                permittedRelations[i].inverse = 1


            }
            items ["menu" + i] = {
                label: "Add   " + permittedRelations[i].endLabel,
                data: menuItemData,
                relation: permittedRelations[i],
                action: (function (menuItem) {
                    self.onMenuAdd(menuItem);
                })

            }

        }


        /*  if ($(node).hasClass("folder")) {
         // Delete the "delete" menu item
         delete items.deleteItem;
         }*/

        return items;
    }

    self.canDrop = function (source, target) {
        var ok = false;
        var permittedTargetLabels = Schema.getPermittedRelations(source.label, "both")
        // $.each(permittedTargetLabels,function(index,value){
        for (var i = 0; i < permittedTargetLabels.length; i++) {
            if (permittedTargetLabels[i].endLabel == target.label) {
                return true;
            }
            if (permittedTargetLabels[i].inverse && permittedTargetLabels[i].startLabel == target.label) {
                return true;
            }
        }

        return false;

    }
    self.ondDropEnd = function (data) {
        $(".jstree-themeicon").css("background-size", self.iconSize);
        //  console.log("Drop node " + data.node.id + " to " + data.parent);
        var node = data.node.data;
        var sourceDbId = parseInt(node.neoId);
        var newParentObj = ids[parseInt(data.node.parent)];
        var oldParentObj = ids[parseInt(data.old_parent)];
        if (!newParentObj || !newParentObj.label)
            return false;
        var relTypes = Schema.getPermittedRelTypes(node.label, newParentObj.label);
        if (relTypes.length > 1)
            alert("multipleRelTypes possible !!!")// prompt a ecrire
        var payload = {
            sourceNodeQuery: {_id: sourceDbId},
            targetNodeQuery: {_id: oldParentObj.neoId},
            relation: node.relation//for Mongo

        };

        function executeCreateRelation() {
            var payload = {
                sourceNodeQuery: {_id: sourceDbId},
                targetNodeQuery: {_id: newParentObj.neoId},
                relType: relTypes[0],
                relation: node.relation//for Mongo
            };
            self.callAPIproxy(payload, "createRelation", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return false;
                }
                $('#' + self.jsTreeDivId).jstree('open_node', "#" + newParentObj.jtreeId);
                return true;

            });
        }

        var resp = prompt("enter Y if you want to delete the old relation before creating the new one");
        if (resp && resp.toUpperCase() == "Y") {

            self.callAPIproxy(payload, "deleteRelation", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return false;
                }
                executeCreateRelation();
            });

        }
        else {
            executeCreateRelation();
        }
    }
    self.onMenuDeleteRelation = function (menuItem) {

        if (confirm("delete relation( will not delete nodes involved in relation)")) {
            var source = menuItem.item.data;
            var parentJtreeId = parseInt(source.parentId);
            var parentObj = ids[parentJtreeId];

            var payload = {
                sourceNodeQuery: {_id: source.neoId},
                targetNodeQuery: {_id: parentObj.neoId},
                relation: {startLabel: parentObj.label, endLabel: source.label}
            };

            self.callAPIproxy(payload, "deleteRelation", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return;
                }
                if (self.synchronizeNeoToMongo == true) {
                    neoToMongo.syncRelNeoToMongo("delete", payload, self.selectedNodeData);
                }
                $('#' + self.jsTreeDivId).jstree().delete_node("#" + source.jtreeId, function (www) {
                    $("#message").html("relation deleted");
                });


            });

        }
    }

    self.onMenuAdd = function (menuItem) {

        //    setTimeout(function() {
        self.isAddingRelation = true;
        currentMenuData = menuItem.item.data;
        currentMenuData.relation = menuItem.item.relation;
        currentNameProperty = Schema.getNameProperty(currentMenuData.relation.endLabel);
        var whereSubGraph = "";
        if (self.subGraph != Gparams.defaultSubGraph)
            whereSubGraph = " where n.subGraph='" + self.subGraph + "'"
        var matchStr = "MATCH (n:" + currentMenuData.relation.endLabel + ") " + whereSubGraph + " return n order by n." + currentNameProperty;
        var payload = {
            match: matchStr,
            nodeLabel: currentMenuData.relation.endLabel,
            orderBy: currentNameProperty,
            limit: limit,
            relation: currentMenuData.relation//for Mongo
        };
        self.callAPIproxy(payload, "retrieve", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }

            var createRelationDialogStr = "new node with label " + currentMenuData.relation.endLabel + " <br><input id='newNodeName'><button onclick='infoGenericDisplay.createNodeAndRelation()'>Create</button><br>OR<br>" +
                " choose in existing nodes <br><select size='10' id='newRelationNodeSelect' onchange='infoGenericDisplay.createRelation(this)'></select><br><button onclick='infoGenericDisplay.cancelAddRelation()'>cancel</button>";
            self.setEntityDiv(createRelationDialogStr);
            var options = [{id: "", name: ""}];
            for (var i = 0; i < result.length; i++) {
                var node = result[i];
                if (node.n) {//Neo
                    var _id = node.n._id;
                    node = node.n.properties;
                    node._id = _id;
                }
                var option = {
                    neoId: node._id,
                    name: node[currentNameProperty]
                }
                options.push(option)
            }
            common.fillSelectOptions(newRelationNodeSelect, options, "name", "neoId");
            if ($("#tabs-radarRight").length)
                $("#tabs-radarRight").tabs({active: 2});
            $("#relInfosDivWrapper").css("visibility", "hidden");
            $("#info").css("visibility", "hidden");
            // self.clearNodePropertiesDiv()

        });
        //  },500);


    }


    self.createRelation = function () {//choice in list of existing nodes
        self.isAddingRelation = false;
        var targetDbId = $("#newRelationNodeSelect").val();
        if (!targetDbId || targetDbId == "")
            return;

        // targetDbId = parseInt(targetDbId);

        var payload = {

            nodeSubGraph: self.subGraph,
            sourceNodeQuery: {_id: currentMenuData.neoId},
            targetNodeQuery: {_id: targetDbId},
            relType: currentMenuData.relation.type,
            relation: currentMenuData.relation//for Mongo
        };


        self.callAPIproxy(payload, "createRelation", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            var data = result[0];
            if (self.synchronizeNeoToMongo == true) {
                neoToMongo.syncRelNeoToMongo("create", payload, result);
            }
            self.addNodeToJstree(data, currentMenuData.jtreeId, [], true);


        })


    }


    self.createNodeAndRelation = function () {
        self.isAddingRelation = false;
        var name = $("#newNodeName").val()
        if (!name || name.length == 0)
            return;

        var nameObj = {}
        nameObj[currentNameProperty] = name;
        var payload = {
            setNodePrivateId: 1,
            nodeLabel: currentMenuData.relation.endLabel,
            nodeSubGraph: self.subGraph,
            nodeAttrs: nameObj,
            sourceNodeQuery: {_id: currentMenuData.neoId},
            relType: currentMenuData.relation.type,
            relation: currentMenuData.relation//for Mongo
        };


        self.callAPIproxy(payload, "createNodeAndRelation", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            if (self.synchronizeNeoToMongo == true) {
                neoToMongo.syncRelNeoToMongo("create", payload);
            }
            var data = result[0];
            self.addNodeToJstree(data, currentMenuData.jtreeId, [], true)


        })


    }


    self.createNewRootNode = function () {

        var label = $("#nodesLabelsSelect").val();
        if (!label || label == "") {
            alert("choose a label for the new node");
            return;
        }

        var name = prompt("new item name");
        if (!name || name.length == 0)
            return;
        var nameObj = {}
        nameObj[currentNameProperty] = name;
        var payload = {
            setNodePrivateId: 1,
            nodeLabel: label,
            nodeSubGraph: self.subGraph,
            nodeAttrs: nameObj
        };
        self.callAPIproxy(payload, "createNode", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            if (self.synchronizeNeoToMongo == true) {
                var data = result[0].n.properties;
                data.label = result[0].n.labels[0];
                data.neoId = result[0].n._id;

                neoToMongo.syncObjNeoToMongo("create", data, null);
            }
            var data = result[0];
            if (currentMenuData)
                self.addNodeToJstree(data, currentMenuData.jtreeId, [], true);
            else
                self.addNodeToJstree(data, null, [], true);

        })

    }

    self.formatResultToJtreeData = function (data, parentId, ancestors) {
        var labels = [];
        var jsonData = [];
        var names = [];
        var nameKey = Schema.getNameProperty();
        for (var i = 0; i < data.length; i++) {
            var label = data[i].n.labels[0];
            if (labels.indexOf(label) < 0) {
                labels.push(label);


                jsonData.push({parent: "#", text: label, id: label})
                for (var j = 0; j < data.length; j++) {

                    var childLabel = data[j].n.labels[0];
                    if (childLabel == label) {
                        var properties = $.extend(true, {}, data[j].n.properties);
                        var name = properties[nameKey];
                        if (names.indexOf(name) < 0) {
                            names.push(name);

                            properties.label = label;
                            properties.neoId = data[j].n._id;


                            jsonData.push({
                                parent: label,
                                text: name,
                                id: (i + "-" + j),
                                data: properties
                            });
                        }
                    }


                }

            }
        }
        return jsonData;
    }

    self.formatResultToFlatJtreeData = function (data, parentId, ancestors) {
        if (!ancestors)
            ancestors = [];
        if (!parentId)
            parentId = "#";
        var treeJson = [];
        for (var i = 0; i < data.length; i++) {

            var treeObj = self.addNodeToJstree(data[i], parentId, ancestors, false);
            if (treeObj)
                treeJson.push(treeObj);


        }
        return treeJson;
    }

    self.addNodeToJstree = function (obj, parentJtreeId, ancestors, draw) {

        var jtreeId;
        var neoId;
        var relation;
        if (obj.r) {
            relation = obj.r;

        }

        if (obj.m) {//Neo
            if (obj.m.properties.nom && !obj.m.properties.name)
                obj.m.properties.name = obj.m.properties.nom;
            jtreeId = obj.m._id;
            neoId = obj.m._id;
            var label = obj.m.labels[0];
            obj = $.extend(true, {}, obj.m.properties);
            obj.label = label;

        }
        else if (obj.n) {//Neo
            if (obj.n.properties.nom && !obj.n.properties.name)
                obj.n.properties.name = obj.n.properties.nom;
            jtreeId = obj.n._id;
            neoId = obj.n._id;
            var label = obj.n.labels[0];
            obj = $.extend(true, {}, obj.n.properties);
            obj.label = label;


        }


        for (var i = 0; i < ancestors.length; i++) {
            if (ancestors[i].indexOf(jtreeId) > -1)// nodes appears only once in their parents
                return null;

        }


        var label = obj.label;
        var labelStr = "";
        if (false && !parentJtreeId) {//first level
            parentJtreeId = "#";
        }
        if (true || parentJtreeId != "#") {
            jtreeId = jtreeId + "_" + parentJtreeId
            labelStr = "[" + label + "]"
        }
        obj.label = label;
        obj.neoId = neoId;

        if (ids[jtreeId]) {//  jtreeIds must be unique if not excluded infinite loop in jstree
            return null;

        }

        obj.jtreeId = jtreeId;
        if (relation)
            obj.relation = relation;


        ids[jtreeId] = obj;
        var childNameProperty = Schema.getNameProperty(label);
        var text = labelStr + obj[childNameProperty];

        var jstreeObj =
            {
                id: jtreeId,
                parent: parentJtreeId,
                text: text,
                type: label,
                data: obj,

            }


        if (draw) {

            $('#' + self.jsTreeDivId).jstree().create_node(jstreeObj.parent, jstreeObj, "first", function (www) {
                $('#' + self.jsTreeDivId).jstree('open_node', "#" + jstreeObj.parent);
                var node = ids[obj.jtreeId];
                self.showNodeData(node)
            });
        }
        return jstreeObj;


    }


    self.onSelect = function (node) {
        var node = node;
        if (node.parent == "#") {//label node

            currentLabel = node.text;
            if( currentObject)
            currentObject.id = null;
            return toutlesensController.generateGraph(null, {applyFilters: true});
        }

        self.selectedNodeData = node.data;
        self.selectedNodeData.parent = parent;
        var label = node.label
        var parentId = node.data.neoId;


        var parentJstreeId = parseInt(node.id);
        if (node.parent != "#")
            parentJstreeId = parentJstreeId + "_" + node.parent;
        // var  parentJstreeId=node.id
        var parentId = node.data.neoId;




            if (toutlesensController.currentActionObj.type == "findNode") {
                node = ids[parentJstreeId];
            //    $("#tabs-radarRight").tabs("enable", 2);
                self.showNodeData(node);
             //   toutlesensController.addToHistory = true;
                toutlesensController.generateGraph(parentId, {});
               $("#tabs-analyzePanel").tabs("option", "active",0);
                return;
            } else if (toutlesensController.currentActionObj.type == 'findShortestPath') {
                traversalMenu.setTraversalNode(toutlesensController.currentActionObj.stage, node.data);
                return;
            }
        toutlesensController.checkMaxNumberOfNodeRelations(parentId, Gparams.jsTreeMaxChildNodes, function () {
            currentObject = node.data;
            currentObject.id = parentId;

            /*   if (node.data.label)
             var label = node.data.label;*/
            var whereSubGraph = "";
            if (self.subGraph != Gparams.defaultSubGraph)
                whereSubGraph = " and n.subGraph='" + self.subGraph + "'"
            var matchStr = "match (n)-[r]-(m) where ID(m)=" + parentId + whereSubGraph + " return n,r limit " + Gparams.jsTreeMaxChildNodes;
            var payload = {match: matchStr, parentLabel: label, parentId: parentId, limit: limit};
            self.callAPIproxy(payload, "retrieve", function (error, data) {
                var jsonData = self.formatResultToJtreeData(data, parentJstreeId, node.parents);

                for (var i = 0; i < jsonData.length; i++) {

                    $('#' + self.jsTreeDivId).jstree().create_node(parentJstreeId, jsonData[i], "first", function (www) {
                        if (i >= jsonData.length - 1)
                            $('#' + self.jsTreeDivId).jstree('open_node', "#" + parentJstreeId);
                    });

                }

            })
        })

    }

    self.findNodeByNeoId = function (neoId) {
        for (var key in ids) {
            if (ids[key].neoId == neoId)
                return ids[key];
        }
        return null;
    }

    self.showNodeData = function (node, neoId) {
        filters.removeAllFilters();
        if (!node) {
            node = self.findNodeByNeoId(neoId);
            if (!node)
                return;
        }

        self.currentNodeChanges = []

        //   var node = ids[jstreeId];

        self.showRelationData(node);


        var matchStr = "match (n) where ID(n)=" + node.neoId + " return n ";
        var payload = {match: matchStr};
        self.callAPIproxy(payload, "retrieve", function (error, data) {
            node = data[0].n.properties;
            var label = data[0].n.labels[0];
            var attrObject = Schema.schema.properties[label];
            $("#nodeLabel").html(label);

            self.setAttributesValue(label, attrObject, node);
            self.drawAttributes(attrObject, "nodeFormDiv");
            if (queryParams.write)
                $("#infosHeaderDiv").css("visibility", "visible");


        })

    }

    self.showRelationData = function (node) {

        if (node.relation) {
            $("#relationType").html(node.relation.type);
            $("#relInfosDivWrapper").css("visibility", "visible");
            var relationSchema = Schema.getRelationsByType(node.relation.type);
            if (relationSchema.length > 0) {
                var attrRelObject = relationSchema[0].properties;

                if (attrRelObject) {
                    var matchStr = "MATCH ()-[r]-() WHERE id(r)=" + node.relation._id + "  RETURN r";
                    var payload = {match: matchStr};
                    self.callAPIproxy(payload, "retrieve", function (error, data) {
                        var relProperties = data[0].r.properties;
                        self.setAttributesValue(node.relation.name, attrRelObject, relProperties, "relation");
                        self.drawAttributes(attrRelObject, "relInfosDiv");


                    })

                }

            }


        }
    }


    /*********************************************************************************************************/
    /*********************************************************************************************************/
    /*********************************************************************************************************/

    self.saveNode = function (callback) {
        self.saveRelation();
        if (self.currentNodeChanges.length == 0)
            return;
        var setObj = {}
        for (var i = 0; i < self.currentNodeChanges.length; i++) {

            var property = self.currentNodeChanges[i].id;
            property = property.substring(5);
            var value = self.currentNodeChanges[i].value;
            value = common.convertNumStringToNumber(value);
            setObj[property] = value;


        }

        if (self.selectedNodeData && self.selectedNodeData.neoId) {//update
            var payload = {
                nodeAttrs: {_id: self.selectedNodeData.neoId},
                nodeSet: setObj,
                //  label: self.selectedNodeData.label
            }


            self.callAPIproxy(payload, "updateNode", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return;
                }
                $("#message").html("node saved");
                if (callback) {
                    var node = result[0].n.properties;
                    node.id = result[0].n._id
                    node.labelNeo = result[0].n.labels[0];
                    node.label = node.name
                    visjsGraph.updateNode(node);

                   return callback(node);

                }
                //  toutlesensController.replayGraph("same");

                var node = result[0]
                //  var node = self.addNodeToJstree(result[0], null, false);

                if (node.n) {
                    var _id = node.n._id;
                    var label = node.n.labels[0];
                    node = node.n.properties;
                    node.label = label;
                    if (self.synchronizeNeoToMongo == true)
                        neoToMongo.syncObjNeoToMongo("update", self.selectedNodeData, setObj);

                    node.parent = self.selectedNodeData.parent;
                    node.neoId = self.selectedNodeData.neoId;
                    node.jtreeId = self.selectedNodeData.jtreeId;

                }

                ids[self.selectedNodeData.jtreeId] = node;

                if (self.selectedNodeData[currentNameProperty] != node[currentNameProperty]) {
                    var text = node[currentNameProperty];
                    //  if (self.selectedNodeData.parent != "#")
                    text = "[" + node.label + "]" + node[currentNameProperty];
                    $('#' + self.jsTreeDivId).jstree().rename_node(self.selectedNodeData.jtreeId, text);

                }


            })
        }
        else {//new Node
            for (var key in setObj) {
                if (!setObj[key] || setObj[key] == "")
                    delete setObj[key];
            }
            var payload = {
                nodeAttrs: setObj,
                nodeSubGraph: subGraph,
                nodeLabel: self.currentLabel
            }


            self.callAPIproxy(payload, "createNode", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return;
                }
                $("#message").html("node saved");

                if (callback) {
                    var node = result[0].n.properties;
                    node.id = result[0].n._id
                    node.labelNeo = result[0].n.labels[0];
                    node.label = node.name
                    callback(node);
                }
                //  d3graphCreation.addNode(self.currentLabel, setObj)
                //  toutlesensController.replayGraph("same");


            })
        }


    }


    self.deleteNode = function () {
        if (confirm("delete editing node ?")) {
            var payload = {
                nodeAttrs: {_id: self.selectedNodeData.neoId},
                //  nodeLabel: self.selectedNodeData.label
            }


            self.callAPIproxy(payload, "deleteNode", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return;
                }
                if (self.synchronizeNeoToMongo == true)
                    neoToMongo.syncObjNeoToMongo("delete", self.selectedNodeData, null);
                if ($('#' + self.jsTreeDivId).jstree())
                    $('#' + self.jsTreeDivId).jstree().delete_node("#" + self.selectedNodeData.jtreeId);
                self.clearNodePropertiesDiv();
                visjsGraph.removeNode(self.selectedNodeData.neoId);
                $("#dialog").dialog("close");
                    // toutlesensController.replayGraph("same");
            });

        }
    }


    self.saveRelation = function () {
        if (self.currentRelationChanges.length == 0)
            return;
        var setObj = {}
        for (var i = 0; i < self.currentRelationChanges.length; i++) {

            var property = self.currentRelationChanges[i].id;
            property = property.substring(5);
            var value = self.currentRelationChanges[i].value;
            value = common.convertNumStringToNumber(value);
            setObj[property] = value;


        }

        var relId = self.selectedNodeData.relation._id;
        var payload = {
            relAttrs: setObj,
            relId: relId

        }

        self.callAPIproxy(payload, "updateRelationById", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            $("#message").html("relation saved");
            toutlesensController.replayGraph("same");


        })
    }
    self.deleteRelationById = function (id, callback) {
        var payload={
            id:id
        }
        self.callAPIproxy(payload, "deleteRelationById", function (err, result) {
            if (err) {
                if(callback)
                    return callback(err);
                $("#message").html(err);
                return;
            }
            if(callback)
                return callback(null,result)


        });
    }


    self.setEntityDiv = function (str) {
        if (queryParams.write)
            $("#infosHeaderDiv").css("visibility", "visible");
        $("#relInfosDivWrapper").css("visibility", "visibility");
        $("#nodeFormDiv").html(str);
    }
    self.clearNodePropertiesDiv = function () {
        $("#infosHeaderDiv").css("visibility", "hidden");
        $("#relInfosDivWrapper").css("visibility", "hidden");
        $("#nodeFormDiv").html("");
    }


    /********************************************************************************/
    self.callAPIproxy = function (payload, operation, callback) {
        if (self.Neo4jStorage) {
            $.ajax(Gparams.restProxyUrl + '/?' + operation + '=1', {
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
        }

        if (self.MongoStorage) {
            neoToMongo.callMongo(payload, operation, callback);
        }
    }
    self.drawAttributes = function (attrObject, zoneId) {
        var str = "<table>";
        var strHidden = "";

        for (var key in attrObject) {
            if(self.ignoredFields.indexOf(key)>-1)
                continue;

            var strVal = attrObject[key].value;


            var fieldTitle = attrObject[key].title;

            var desc = attrObject[key].desc;
            if (desc) {
                desc = "<img src='/toutlesens/icons/questionMark.png' width=" + self.iconSize + " title='" + desc + "'>";
            }
            else
                desc = "";

            if (attrObject[key].type == 'hidden') {
                strHidden += "<input type='hidden' id='attr_" + key + "' value='" + strVal + ">"
            } else {
                className = 'mandatoryFieldLabel';
                if (!fieldTitle)
                    fieldTitle = key;
                var className = 'fieldLabel';


                if (attrObject[key].control == 'mandatory')
                    className = 'mandatoryFieldLabel';


                str += "<tr><td align='right'><span class=" + className + ">" + fieldTitle + "</span></td><td>" + desc + "</td><td align='left' ><span class='fieldvalue'>" + strVal + "</span></td></tr>";
            }
        }
        str += "</table>" + strHidden;
        $("#" + zoneId).css("visibility", "visible");
        $("#" + zoneId).html(str);

    }
    self.setAttributesValue = function (label, attrObject, obj, changeType) {
        self.currentNodeChanges = []
        self.currentLabel = label;
        if (!changeType)
            changeType = "node";
        for (var key in attrObject) {
            var value = "";
            if (obj)
                var value = obj[key];
            if (!value)
                value = "";
            var type = attrObject[key].type;
            var _userRole = self.userRole;

            if (type && type == 'readOnly' || _userRole == "read") {
                value = util.convertHyperlinks(value);
                attrObject[key].value = "&nbsp;:&nbsp;<b>" + value + "</b>";
                continue;
            }

            var selectValues = null;

            var selectFields = Schema.schema.fieldsSelectValues[label];
            if (selectFields) {
                selectValues = selectFields[key];
                if (selectValues) {
                    if (selectValues.source) {
                        selectValues.source.field = key;
                        selectValues = [];//self.getDynamicSelectValues(selectValues.source);
                    } else {

                        selectValues.sort();
                    }
                }

            }


            //if (type && type == 'select' && selectValues) {
            if (selectValues) {
                var str = "<select  onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' id='attr_" + key + "'>"
                str += "<option  value=''></option>";
                for (var i = 0; i < selectValues.length; i++) {

                    var val = selectValues[i];
                    var strId;
                    var strText;
                    if (val.id) {//dynamic select
                        strText = val.name;
                        strId = val.id;
                    } else {//simple value and text
                        strText = val;
                        strId = val;
                    }

                    var selected = "";
                    if (value == selectValues[i])
                        selected = " selected ";

                    str += "<option value='" + strId + "' " + selected
                        + " >" + strText + "</option>";
                }

                str += "</select>";
                value = str;
            }

            else if (type == 'password') {
                value = "<input type='password' onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                    + key + "'value='" + value + "'>";
            }
            else if (!type || type == 'text') {
                var cols = attrObject[key].cols;
                var rows = attrObject[key].rows;
                var strCols = ""

                if (rows) {// textarea
                    if (cols)
                        strCols = " cols='" + cols + "' ";
                    rows = " rows='" + rows + "' ";
                    value = "<textArea  onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + rows
                        + "id='attr_" + key + "' > " + value + "</textarea>";
                } else {
                    if (cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onblur='incrementChanges(this,\"" + changeType + "\");' class='objAttrInput' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            attrObject[key].value = value;
        }

    }

    self.getDynamicSelectValues = function (source) {
        var dynamicSelectValuesField = {};
        self.allDynamicSelectValues[source.field] = dynamicSelectValuesField;
        var sourceSelectValues = [];
        var sourceSelectIds = [];
        var query = {};
        if (source.query) {

            for (var key in source.query) {
                if (source.query[key].indexOf("$") == 0)
                    query [key] = eval(source.query[key].substring(1));
                else
                    query [key] = source.query[key];

            }

        }
        /*  if (source.distinct) {
         var options = devisuProxy.getDistinct(dbName, source.collection, query, source.distinct);
         return options;
         }
         else {*/
        var options = devisuProxy.loadData(dbName, source.collection, query);
        var field = "name";
        if (source.distinct)
            field = source.distinct;
        for (var i = 0; i < options.length; i++) {
            dynamicSelectValuesField[options[i][field]] = options[i].id;
            var name = options[i][field];
            var id = options[i].id;

            if (sourceSelectIds.indexOf(name) < 0) {
                sourceSelectIds.push(id);
                sourceSelectValues.push(name);
                // sourceSelectValues.push({id: id, name: name});
            }
        }
        return util.sortByField(sourceSelectValues, "name");
        // }
    }


    self.loadSearchResultIntree = (function (err, matchStr) {
        self.loadTree(null, null, matchStr);
    });

    self.cancelAddRelation = function () {
        self.isAddingRelation = false;
        if (self.selectedNodeData) {
            var node = ids[self.selectedNodeData.jtreeId];
            self.showNodeData(node);
        }
        else {
            self.clearNodePropertiesDiv();

        }
    }

    self.setNewNodeProperties = function (labelSelect) {
        var label = $(labelSelect).val();
        if (!label || label == "") {
            return alert("select a label for the new node");
        }
        var attrObject = Schema.schema.properties[label];
        self.selectedNodeData = null;
        self.setAttributesValue(label, attrObject, {});
        self.drawAttributes(attrObject, "nodeFormDiv");

    }


    return self;


})
()


incrementChanges = function (input, type) {
    if (type && type == "relation")
        infoGenericDisplay.currentRelationChanges.push({id: input.id, value: input.value})
    else
        infoGenericDisplay.currentNodeChanges.push({id: input.id, value: input.value})
}