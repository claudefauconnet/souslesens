

function getAllpropertiesDialogContent(onclickAction) {
  var label=$("#nodesLabelsSelect").val();
    var str = "<table><tr><td>type de propriete</td><td><select id='propertyType'></select></td></tr>"
    str += "<tr><td align='right'>= </td><td><input id='propertyEquals'></input></td></tr>"
    str += "<tr><td align='right'>contains</td><td><input id='propertyContains'></input></td></tr>"
    str += "<tr><td align='right'>&gt;</td><td><input id='propertyGreater'></input></td></tr>"
    str += "<tr><td align='right'>&lt; </td><td><input id='propertyLower'></input></td></tr>"
    str += "</table><button id='getAllpropertiesDialogOkBtn' onclick=" + onclickAction + ";>OK</button>";
    if(label && label.length>0) {
        if(dataModel.labels[label].indexOf("")<0)
        dataModel.labels[label].splice(0,0,"");
        str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.labels['" + label + "']);</script>";

    } else
     str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);</script>";
//	str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);$('#propertyType').val(\'nom\');</script>";
    return str;
}
function getAllRelationsDialogContent(onclickAction) {
    var str = "<table><tr><td>type de propriete</td><td><select id='relType'></select></td></tr>"
    str += "<tr><td><select id='relDir'><option>all</option><option>in</option><option>out</option></select></td></tr>"
    str += "</table><button onclick='" + onclickAction + "();'>OK</button>";
    str += "<script>fillSelectOptionsWithStringArray(relType,dataModel.allRelationsArray);</script>";
    return str;
}
function getSetAttributeDialogContent(onclickAction) {
    var str = "<table><tr><td>Attribute</td><td><input id='selectionAttrName'></td></tr>"
    str += "<tr><td>Value</td><td><input id='selectionAttrVal'></td></tr>"
    str += "</table><button onclick='" + onclickAction + "();'>OK</button>";
    return str;
}

function searchNodesUIByPropertyValue() {
    $("#dialog").dialog("option", "title", "valeur d'une propriete");
    var str = getAllpropertiesDialogContent("setSearchNodeReturnFilterVal()");
    $("#dialog").html(str);
    $("#dialog").dialog("open").parent().position({my: 'center', at: 'center', of: '#tabs-radarRight'});
}


function showAdvancedSearchDialog() {
    if (!isAdvancedSearchDialogInitialized) {
        isAdvancedSearchDialogInitialized = true;
        $("#advancedSearchIframe").prop("src", "./advancedSearchDialog.html?subGraph=" + subGraph);
    }

    $("#dialogAdvancedSearch").dialog("open").parent().position({my: 'center', at: 'center', of: '#tabs-radarRight'});
}

function showGanttDialog() {
    if (!isGanttDialogInitialized) {
        isGanttDialogInitialized = true;
        $("#dialogGanttIframe").prop("src", "./ganttDialog.html?subGraph=" + subGraph);
    }

    $("#dialogGantt").dialog("open").parent().position({my: 'center', at: 'center', of: '#tabs-radarRight'});
}



function showGraphDecorationObjsDialog() {
    if (!isAdvancedDisplayDialogInitialized) {
        isAdvancedDisplayDialogInitialized = true;
        $("#advancedDisplayIframe").prop("src", "./advancedDisplayDialog.html?subGraph=" + subGraph);
    }
    else {
        $("#advancedDisplayIframe").prop('contentWindow').initDecorationDiv();
    }
    $("#dialogAdvancedDisplay").dialog("open").parent().position({my: 'center', at: 'center', of: '#tabs-radarRight'});


}


function hideAdvancedSearch() {
    $("#dialogAdvancedSearch").dialog("close");

}

function hideAdvancedDisplay() {
    $("#dialogAdvancedDisplay").dialog("close");

}

function hideGanttDialog() {
    $("#dialogGantt").dialog("close");

}
function saveStoredDecorationObjsDialog() {
    $("#dialog").dialog("option", "title", "enregistrer une representation");
    var str = "<table><tr><td>nom</td><td><input id='storedDecorationObjsName'></input></td></tr>" +
        " <tr><td>description</td><td><textArea id='storedDecorationObjsDescription' <row='3' cols='30'></textArea></td></tr>" +
        " <tr><td>scope</td><td><select id='storedDecorationObjsScope'><option>public</option><option>prive</option><option>groupe</option></select></td></tr>" +
        "<tr><td colspan=2'><span id='dialogMessage'></span></td></tr>"
    str += "</table><button onclick= saveDisplaySet()>OK</button>";
    $("#dialog").html(str);
    $("#dialog").dialog("open")//;.parent().position({ my: 'center', at: 'center', of: '#tabs-radarRight' });
}

function setPopupMenuNodeInfoContent() {
    var name = formatNode(currentObject).name;

  /*  var str =
        "<input type='image' height='15px' alt='infos'  onclick='dispatchAction(\"nodeInfosPopup\")' src='images/infos.png'/>" +
        "<input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"setAsRootNode\")' src='images/squareRoot.png'/>" + "&nbsp;" +
        "<B><span style='color:" + nodeColors[currentObject.label] + "'> [" + currentObject.label + "]<span>" +name+"</B>"*/

    var str="<table> <tr>" +
        "<td> <input type='image' height='20px' alt='infos'  onclick='dispatchAction(\"nodeInfosPopup\")' src='images/infos.png'/></td>";
  if(currentDisplayType=="SIMPLE_FORCE_GRAPH")
    str+= "<input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"addNodeToGraph\",null," + currentObject.id + ")' src='images/add.jpg'/>" + "&nbsp;";
    str+=   "<td><input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"setAsRootNode\")' src='images/squareRoot.png'/></td>"
    if(Gparams.readOnly ==false){
        str+="<td> <input type='image' height='20px' alt='infos'  onclick='dispatchAction(\"modifyNode\")' src='images/modify.png'/></td>"+
        "<td><input type='image' height='20px'  alt='set as rootNode' onclick='dispatchAction(\"linkSource\")' src='images/sourceLink.png'/></td>"+
            "<td><input type='image' height='20px'  alt='set as rootNode' onclick='dispatchAction(\"linkTarget\")' src='images/targetLink.png'/></td>"+
        "<td><input type='image' height='20px'  alt='set as rootNode' onclick='dispatchAction(\"newNode\")' src='images/new.jpg'/></td>"
    }
    str+="</tr></table>";

    str+=   "<B><span style='color:" + nodeColors[currentObject.label] + "'> [" + currentObject.label + "]<span>" +name+"</B>"


    if (currentObject.hiddenChildren) {
        str += "<ul>";
        currentHiddenChildren = {};
        var child = currentObject.hiddenChildren[i];

        for (var i = 0; i < currentObject.hiddenChildren.length; i++) {
            var child=currentObject.hiddenChildren[i];
            currentHiddenChildren[child.id]=child;
            var name=formatNode(child).name;

            var child = currentObject.hiddenChildren[i];


            str +="<li><input type='image' height='15px' alt='infos'  onclick='dispatchAction(\"nodeInfosPopup\"," + child.id + ")' src='images/infos.png'/>" +


                "<input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"setAsRootNode\"," + child.id + ")' src='images/squareRoot.png'/>" + "&nbsp;" +
                "<span style='color:" + nodeColors[child.label] + "'> [" + child.label + "]</span>" + name + "&nbsp;</li>";


        }
        str += "</ul>"
    }

    str += "</table>";
    $("#popupMenuNodeInfo").html(str);

}
