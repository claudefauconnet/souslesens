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
    $("#dialog").dialog("open").position({my: 'center', at: 'center', of: '#tabs-analyzePanel'});
}


   self.showAdvancedSearchDialog=function() {
    if (!isAdvancedSearchDialogInitialized) {
        isAdvancedSearchDialogInitialized = true;
        $("#advancedSearchIframe").prop("src", "./advancedSearchDialog.html?subGraph=" + subGraph);
    }

    $("#dialogAdvancedSearch").dialog("open").position({my: 'center', at: 'center', of: '#tabs-analyzePanel'});
}

   self.showGanttDialog=function() {
    if (!isGanttDialogInitialized) {
        isGanttDialogInitialized = true;
        $("#dialogGanttIframe").prop("src", "./ganttDialog.html?subGraph=" + subGraph);
    }

    $("#dialogGantt").dialog("open").position({my: 'center', at: 'center', of: '#tabs-analyzePanel'});
}



   self.showGraphDecorationObjsDialog=function() {
    if (!isAdvancedDisplayDialogInitialized) {
        isAdvancedDisplayDialogInitialized = true;
        $("#advancedDisplayIframe").prop("src", "./advancedDisplayDialog.html?subGraph=" + subGraph);
    }
    else {
        $("#advancedDisplayIframe").prop('contentWindow').advancedDisplay.initDecorationDiv();
    }
    $("#dialogAdvancedDisplay").dialog("open").position({my: 'center', at: 'center', of: '#tabs-analyzePanel'});


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
    $("#dialog").dialog("open");
}


self.getNodeInfoButtons=function(){
      var str= "<input type='image' height='20px'  title='expand all' onclick='toutlesensController.dispatchAction(\"expandNode\")' src='images/expand.png'/>";
    str+=   "<input type='image' height='15px'  title='expand label...' onclick='toutlesensController.dispatchAction(\"expandNodeWithLabel\")' src='images/expandLabel.png'/>";
    str+=   "<input type='image' height='20px'  title='set as rootNode' onclick='toutlesensController.dispatchAction(\"setAsRootNode\")' src='images/center.png'/>"
    str+=   "<input type='image' height='20px'  title='remove node from graph' onclick='toutlesensController.dispatchAction(\"removeNode\")' src='images/trash.png'/>"
    return  str;
}

    self.setPopupMenuRelationInfoContent=function() {

       var str="";
      str+= "relType :"+currentObject.type+"<br>";
        str+= "["+currentObject.fromNode.labelNeo+"]"+currentObject.fromNode.label+"<br>";
        str+= "--> ["+currentObject.toNode.labelNeo+"]"+currentObject.toNode.label;
        str+="<td> <input type='image' height='20px' title='infos'  onclick='toutlesensController.dispatchAction(\"deleteRelation\")' src='images/trash.png'/></td>";
        if(false && currentObject.type=="composite")
        str+="<a href='javascript:toutlesensController.dispatchAction(\"showClusterIntermediateNodes\");'>show intermediateNodes</a>";
        return str;
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
           name= currentObject[Schema.schema.defaultNodeNameProperty]
 name=textOutputs.formatNode(name+"<br>");



  var str="<table> <tr>" ;//+
       str+="<td>"+ self.getNodeInfoButtons()+"</td>";
    if(Gparams.readOnly ==false){
        str+="<td> <input type='image' height='20px' title='infos'  onclick='toutlesensController.dispatchAction(\"modifyNode\")' src='images/modify.png'/></td>"+
      "<td><input type='image' height='20px'  title='set as rootNode' onclick='toutlesensController.dispatchAction(\"linkSource\")' src='images/sourceLink.png'/></td>"+
            "<td><input type='image' height='20px'  title='set as rootNode' onclick='toutlesensController.dispatchAction(\"linkTarget\")' src='images/targetLink.png'/></td>"
     //  +"<td><input type='image' height='20px'  title='set as rootNode' onclick='toutlesensController.dispatchAction(\"newNode\")' src='images/new.jpg'/></td>"
    }

  str+="</td></tr><tr><td>"

    str+=   "<B><span style='color:" + nodeColors[label] + "'> [" + label + "]<span>" +"</B>"+name+"<br>";
    var customInfo=customizeUI.customInfo(currentObject);

       str+="</td></tr><tr><td>"
    if(customInfo && customInfo.length>0)
       str +=customizeUI.customInfo(currentObject)+"<br>";


       if( true){// show properties
           toutlesensData.getNodeInfos(currentObject.id, function (obj) {

               str += textOutputs.formatNodeInfo(obj[0].n.properties);
               str += "<br>" + customizeUI.customInfo(obj);
               $("#nodeInfoMenuDiv").html(str);
               return;
           });

       }
       str+="</td>"
       if( currentObject.neoAttrs && currentObject.neoAttrs.image ){
           str+="<td> <img src='"+currentObject.neoAttrs.image+"' width='100px'></td>"
       }
       str+="<td>"

       str += "</td>";
       str += "</tr>";
    str += "</table>";
   return str;

}



 return self;
})()