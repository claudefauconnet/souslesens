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

var toutlesensDialogsController = (function(){
 var self = {};


   self.getAllpropertiesDialogContent=function(onclickAction) {
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
        str += "<script>common.fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.labels['" + label + "']);</script>";

    } else
     str += "<script>common.fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);</script>";
//	str += "<script>fillSelectOptionsWithStringArray($('#propertyType')[0],dataModel.allProperties);$('#propertyType').val(\'nom\');</script>";
    return str;
}
   self.getAllRelationsDialogContent=function(onclickAction) {
    var str = "<table><tr><td>type de propriete</td><td><select id='relType'></select></td></tr>"
    str += "<tr><td><select id='relDir'><option>all</option><option>in</option><option>out</option></select></td></tr>"
    str += "</table><button onclick='" + onclickAction + "();'>OK</button>";
    str += "<script>common.fillSelectOptionsWithStringArray(relType,dataModel.allRelationsArray);</script>";
    return str;
}
   self.getSetAttributeDialogContent=function(onclickAction) {
    var str = "<table><tr><td>Attribute</td><td><input id='selectionAttrName'></td></tr>"
    str += "<tr><td>Value</td><td><input id='selectionAttrVal'></td></tr>"
    str += "</table><button onclick='" + onclickAction + "();'>OK</button>";
    return str;
}

   self.searchNodesUIByPropertyValue=function() {
    $("#dialog").dialog("option", "title", "valeur d'une propriete");
self.getAllpropertiesDialogContent("setSearchNodeReturnFilterVal()");
    $("#dialog").html(str);
    $("#dialog").dialog("open").position({my: 'center', at: 'center', of: '#tabs-radarLeft'});
}


   self.showAdvancedSearchDialog=function() {
    if (!isAdvancedSearchDialogInitialized) {
        isAdvancedSearchDialogInitialized = true;
        $("#advancedSearchIframe").prop("src", "./advancedSearchDialog.html?subGraph=" + subGraph);
    }

    $("#dialogAdvancedSearch").dialog("open").position({my: 'center', at: 'center', of: '#tabs-radarLeft'});
}

   self.showGanttDialog=function() {
    if (!isGanttDialogInitialized) {
        isGanttDialogInitialized = true;
        $("#dialogGanttIframe").prop("src", "./ganttDialog.html?subGraph=" + subGraph);
    }

    $("#dialogGantt").dialog("open").position({my: 'center', at: 'center', of: '#tabs-radarLeft'});
}



   self.showGraphDecorationObjsDialog=function() {
    if (!isAdvancedDisplayDialogInitialized) {
        isAdvancedDisplayDialogInitialized = true;
        $("#advancedDisplayIframe").prop("src", "./advancedDisplayDialog.html?subGraph=" + subGraph);
    }
    else {
        $("#advancedDisplayIframe").prop('contentWindow').advancedDisplay.initDecorationDiv();
    }
    $("#dialogAdvancedDisplay").dialog("open").position({my: 'center', at: 'center', of: '#tabs-radarLeft'});


}


   self.hideAdvancedSearch=function() {
    $("#dialogAdvancedSearch").dialog("close");

}

   self.hideAdvancedDisplay=function() {
    $("#dialogAdvancedDisplay").dialog("close");

}

   self.hideGanttDialog=function() {
    $("#dialogGantt").dialog("close");

}
   self.saveStoredDecorationObjsDialog=function() {
    $("#dialog").dialog("option", "title", "enregistrer une representation");
    var str = "<table><tr><td>nom</td><td><input id='storedDecorationObjsName'></input></td></tr>" +
        " <tr><td>description</td><td><textArea id='storedDecorationObjsDescription' <row='3' cols='30'></textArea></td></tr>" +
        " <tr><td>scope</td><td><select id='storedDecorationObjsScope'><option>public</option><option>prive</option><option>groupe</option></select></td></tr>" +
        "<tr><td colspan=2'><span id='dialogMessage'></span></td></tr>"
    str += "</table><button onclick= saveDisplaySet()>OK</button>";
    $("#dialog").html(str);
    $("#dialog").dialog("open")//;.parent().position({ my: 'center', at: 'center', of: '#tabs-radarRight' });
}




   self.setPopupMenuNodeInfoContent=function() {
       var name;
      var label;
      if(currentObject.labelNeo)// because visjs where label is the node name
          label=currentObject.labelNeo;
      else
          label=currentObject.label;
       if(currentObject.neoAttrs)
           name= currentObject.neoAttrs[Schema.schema.defaultNodeNameProperty]
       else
           name= currentObject[Schema.defaultNodeNameProperty]
 name=textOutputs.formatNode(name+"<br>");

  /*  var str =
        "<input type='image' height='15px' alt='infos'  onclick='dispatchAction(\"nodeInfosPopup\")' src='images/infos.png'/>" +
        "<input type='image' height='15px'  alt='set as rootNode' onclick='dispatchAction(\"setAsRootNode\")' src='images/squareRoot.png'/>" + "&nbsp;" +
        "<B><span style='color:" + nodeColors[currentObject.label] + "'> [" + currentObject.label + "]<span>" +name+"</B>"*/

  var str="<table> <tr>" +
        "<td> <input type='image' height='20px' alt='infos'  onclick='toutlesensController.dispatchAction(\"nodeInfosPopup\")' src='images/infos.png'/></td>";
  if(currentDisplayType=="SIMPLE_FORCE_GRAPH")
    str+= "<input type='image' height='15px'  alt='set as rootNode' onclick='toutlesensController.dispatchAction(\"addNodeToGraph\",null," + currentObject.id + ")' src='images/add.jpg'/>" + "&nbsp;";
    str+=   "<td><input type='image' height='15px'  alt='set as rootNode' onclick='toutlesensController.dispatchAction(\"setAsRootNode\")' src='images/squareRoot.png'/></td>"
    if(Gparams.readOnly ==false){
        str+="<td> <input type='image' height='20px' alt='infos'  onclick='toutlesensController.dispatchAction(\"modifyNode\")' src='images/modify.png'/></td>"+
        "<td><input type='image' height='20px'  alt='set as rootNode' onclick='toutlesensController.dispatchAction(\"linkSource\")' src='images/sourceLink.png'/></td>"+
            "<td><input type='image' height='20px'  alt='set as rootNode' onclick='toutlesensController.dispatchAction(\"linkTarget\")' src='images/targetLink.png'/></td>"+
        "<td><input type='image' height='20px'  alt='set as rootNode' onclick='toutlesensController.dispatchAction(\"newNode\")' src='images/new.jpg'/></td>"
    }
    str+="</tr></table>";

    str+=   "<B><span style='color:" + nodeColors[label] + "'> [" + label + "]<span>" +"</B>"+name;
       str +="<br><br>"+customizeUI.customInfo(currentObject)+"<br>";


    if (currentObject.hiddenChildren) {
        str += "<ul>";
        currentHiddenChildren = {};
        var child = currentObject.hiddenChildren[i];

        for (var i = 0; i < currentObject.hiddenChildren.length; i++) {
            var child=currentObject.hiddenChildren[i];
            currentHiddenChildren[child.id]=child;
textOutputs.formatNode(child).name;

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



 return self;
})()