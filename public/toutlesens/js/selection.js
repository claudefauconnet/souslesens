/**
 * Created by claud on 13/03/2017.
 */

var d3NodesSelection = [];


function addToSelection(node) {
    $("#tabs-radarLeft").tabs("option", "active", 3)
    addNodeToSelection(node);
}
function addNodeToSelection(node) {
    d3NodesSelection.push(node);
    $("#d3SelectionSelect").append($('<option>', {
        value: node.id,
        text: node.name + " [" + node.label + "]"
    }));
}

function clearSelection() {
    d3SelectionSelect.options.length = 0;
    d3NodesSelection = [];
}

function removeNodeFromSelection() {
    var value = $("#d3SelectionSelect").val();
    $("#d3SelectionSelect option[value='" + value + "']").remove();
    for (var i = 0; i < d3NodesSelection.length; i++) {
        if (d3NodesSelection[i].id == value) {
            d3NodesSelection.splice(i, 1)
            break;
        }
    }

}
function d3SelectionAction(select) {
    var action = $(select).val();
    if (action == "clear") {
        clearSelection();
    }
    else if (action == "defineAsLinkSourceNodes") {
        currentObject = {};
        currentObject.nodes = d3NodesSelection;
        currentObject.name = "graphSelection"
        dispatchAction("linkSource");
    }
    else if (action == "defineAsLinkTargetNodes") {
        currentObject = {};
        currentObject.nodes = d3NodesSelection;
        currentObject.name = "graphSelection"
        dispatchAction("linkTarget");
    }
    else if (action == "setAttributeDialog") {
        var str = getSetAttributeDialogContent("setSelectionAttr");
        $("#dialog").html(str);
        $("#dialog").dialog("open");
        $("#dialog").html(str);

    }

    else if (action == "deleteRelationTypeDialog") {
        var str = getAllRelationsDialogContent("deleteSelectionRelationType");
        $("#dialog").html(str);
        $("#dialog").dialog("open");
        $("#dialog").html(str);


    }


}

function setSelectionAttr() {
    var attrName = $("#selectionAttrName").val();
    var attrVal = $("#selectionAttrVal").val();
    var props = {};
    props[attrName] = attrVal;
    for (var i = 0; i < d3NodesSelection.length; i++) {
        updateProperties(d3NodesSelection[i], props)
    }
    $("#dialog").dialog("close");
}

function deleteSelectionRelationType() {

    var relType = $("#relType").val();
    if (confirm("delete links related to selection with type " + relType)) {
        deleteRelations(d3NodesSelection, relType, null)
    }
    $("#dialog").dialog("close");
}

/*
 limité au noeud source (j<1)



 */
function setSelectionFromQuery(json) {

    clearSelection();
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
                node.name = node.nom;
            node.label = nodes[j].labels[0]
            if (ids.indexOf(node.id) < 0) {
                ids.push(node.id)
                addNodeToSelection(node)
            }


        }
    }
    $("#tabs-radarLeft").tabs("option", "active", 3);
}
