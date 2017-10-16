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


var selection = (function () {
    var self = {};


//moved  var d3NodesSelection = [];


    self.addToSelection = function (node) {
        $("#tabs-radarLeft").tabs("option", "active", 3)
        self.addNodeToSelection(node);
    }
    self.addNodeToSelection = function (node) {
        d3NodesSelection.push(node);
        $("#d3SelectionSelect").append($('<option>', {
            value: node.id,
            text: node.name + " [" + node.label + "]"
        }));
    }

    self.clearSelection = function () {
        d3SelectionSelect.options.length = 0;
        d3NodesSelection = [];
    }

    self.removeNodeFromSelection = function () {
        var value = $("#d3SelectionSelect").val();
        $("#d3SelectionSelect option[value='" + value + "']").remove();
        for (var i = 0; i < d3NodesSelection.length; i++) {
            if (d3NodesSelection[i].id == value) {
                d3NodesSelection.splice(i, 1)
                break;
            }
        }

    }
    self.d3SelectionAction = function (select) {
        var action = $(select).val();
        if (action == "clear") {
            self.clearSelection();
        }
        else if (action == "defineAsLinkSourceNodes") {
            currentObject = {};
            currentObject.nodes = d3NodesSelection;
            currentObject.name = "graphSelection"
            toutlesensController.dispatchAction("linkSource");
        }
        else if (action == "defineAsLinkTargetNodes") {
            currentObject = {};
            currentObject.nodes = d3NodesSelection;
            currentObject.name = "graphSelection"
            toutlesensController.dispatchAction("linkTarget");
        }
        else if (action == "setAttributeDialog") {
            toutlesensDialogsController.getSetAttributeDialogContent("setSelectionAttr");
            $("#dialog").html(str);
            $("#dialog").dialog("open");
            $("#dialog").html(str);

        }

        else if (action == "deleteRelationTypeDialog") {
            toutlesensDialogsController.getAllRelationsDialogContent("deleteSelectionRelationType");
            $("#dialog").html(str);
            $("#dialog").dialog("open");
            $("#dialog").html(str);


        }


    }

    self.setSelectionAttr = function () {
        var attrName = $("#selectionAttrName").val();
        var attrVal = $("#selectionAttrVal").val();
        var props = {};
        props[attrName] = attrVal;
        for (var i = 0; i < d3NodesSelection.length; i++) {
            modifyData.updateProperties(d3NodesSelection[i], props)
        }
        $("#dialog").dialog("close");
    }

    self.deleteSelectionRelationType = function () {

        var relType = $("#relType").val();
        if (confirm("delete links related to selection with type " + relType)) {
            modifyData.deleteRelations(d3NodesSelection, relType, null)
        }
        $("#dialog").dialog("close");
    }

    /*
     limité au noeud source (j<1)



     */
    self.setSelectionFromQuery = function (json) {

        self.clearSelection();
        var ids = [];
        for (var i = 0; i < json.length; i++) {
            var nodes = [];
            if (json[i].path) {// pattern
                nodes = json[i].path.nodes;
            }
            else if (json[i].nodes) {
                nodes = json[i].nodes;
            }
            for (var j = 0; j < 1; j++) {
                var node = {};
                if (nodes[j].properties)
                    node = nodes[j].properties;
                else
                    node = nodes[j];
                node.id = nodes[j]._id;
                if (!node.name)
                    node.name = node[Gparams.defaultNodeNameProperty];
                node.label = nodes[j].labels[0]
                if (ids.indexOf(node.id) < 0) {
                    ids.push(node.id)
                    self.addNodeToSelection(node)
                }


            }
        }
        $("#tabs-radarLeft").tabs("option", "active", 3);
    }


    self.selectAllGraphNodes = function () {
        var json = toutlesensData.cachedResultArray;
        self.setSelectionFromQuery(json);
    }
    return self;
})()