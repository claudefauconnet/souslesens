function getAllpropertiesDialogContent(onclickAction) {
    var str = "<table><tr><td>type de propriete</td><td><select id='propertyType'></select></td></tr>"
    str += "<tr><td align='right'>valeur (contient)</td><td><input id='propertyContains'></input></td></tr>"
    str += "<tr><td align='right'>= </td><td><input id='propertyEquals'></input></td></tr>"
    str += "<tr><td align='right'>&gt;</td><td><input id='propertyGreater'></input></td></tr>"
    str += "<tr><td align='right'>&lt; </td><td><input id='propertyLower'></input></td></tr>"
    str += "</table><button id='getAllpropertiesDialogOkBtn' onclick=" + onclickAction + ";>OK</button>";
    str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);</script>";
//	str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);$('#propertyType').val(\'nom\');</script>";
    return str;
}
function getAllRelationsDialogContent(onclickAction) {
    var str = "<table><tr><td>type de propriete</td><td><select id='relType'></select></td></tr>"
    str += "<tr><td><select id='relDir'><option>all</option><option>in</option><option>out</option></select></td></tr>"
    str += "</table><button onclick=" + onclickAction + ";>OK</button>";
    str += "<script>fillSelectOptionsWithStringArray(relType,dataModel.allRelationsArray);</script>";
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
    var name = currentObject.name
    var match = /_[0-9]*/.exec(name);
    if (match) {
        var p = match.index;
        if (p > -1)
            name= name.substring(0, p);
    }
    var str =
        "<input type='image' height='15px' alt='infos'  onclick='dispatchAction(\"nodeInfosPopup\")' src='images/infos.png'/>" +
        "<input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"setAsRootNode\")' src='images/squareRoot.png'/>" + "&nbsp;" +
        "<B><span style='color:" + nodeColors[currentObject.label] + "'> [" + currentObject.label + "]<span>" +name+"</B>"


    if (currentObject.hiddenChildren) {
        str += "<ul>";
        currentHiddenChildren = {};
        var child = currentObject.hiddenChildren[i];

        for (var i = 0; i < currentObject.hiddenChildren.length; i++) {
            var child=currentObject.hiddenChildren[i];
            currentHiddenChildren[child.id]=child;
            var name=child.name;
            var match = /_[0-9]*/.exec(name);
            if (match) {
                var p = match.index;
                if (p > -1)
                    name= name.substring(0, p);
            }

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
