/**
 * Created by claud on 19/11/2017.
 */

var traversalMenu = (function () {

    var self = {};
  self.context={
      source:{},
      target:{},
      currentNode:""


  }

    self.searchNodesUI = function (select) {
        if (!startSearchNodesTime) {// temporisateur
            startSearchNodesTime = new Date();
            return;
        } else {
            now = new Date();
            if (now - startSearchNodesTime < Gparams.searchInputKeyDelay)
                return;
        }
        var word = "";
        $(select).val("")
        currentLabel = null;
        var label = ""
        word = $(select).val();
        if (word && word.length < Gparams.searchInputMinLength && label && label.length == "") {
            return;
        }
        if (label == "" && word == "")
            return;
        infoGenericDisplay.jsTreeDivId="traversalTreeContainer";
        debugger;
        toutlesensData.searchNodes(subGraph, label, word, resultType, limit, from, function(err,query){
            infoGenericDisplay.loadTree ("", "#", query,"traversalTreeContainer")

        });
        /*  setTimeout(function(){
              infoGenericDisplay.expandAll("treeContainer");
          },500)*/

    }

    self.traversalInitNodeDialog = function (select) {

        var value = $("#dialogNodesLabelsSelect").val()
        if (value.length > 0) {
          //  currentActionObj[currentActionObj.currentTarget].label = value;
            toutlesensData.searchNodes(Schema.subGraph, value, null, null, Gparams.listDisplayLimitMax, 0, function (err, data) {
                var nodes = [];
                var nodeNames = [];
                for (var i = 0; i < data.length; i++) {
                    var nodeId = data[i].n._id
                    if (nodeNames.indexOf(nodeId) < 0) {
                        var props=data[i].n.properties;
                        props.id=nodeId;
                        nodes.push(props)

                    }
                }
                common.fillSelectOptions(traversalDialogNodeSelect, nodes, Gparams.defaultNodeNameProperty, "id")

              //  bringToFront('traversalDialogNode')
            });
        }

    }
    self.traversalInitPropertiesDialog=function(){
        var label=$("#dialogNodesLabelsSelect").val()
        filters.initLabelPropertySelection(label,propertiesSelectionDialog_propsSelect)
    }

    self.traversalSetLabel=function(select){
        var value = $(select).val()
        $("#"+currentActionObj.currentTarget).val( value)
        currentActionObj[currentActionObj.currentTarget].label = value;
        $("#graphPathSourceNode").text( value)

    }


    self.traversalSetNode=function(select){
        var index = select.selectedIndex;
        var valueText = select.options[select.selectedIndex].text;
        var valueId = $(select).val();
        if(self.context.currentNode=="source") {
            $("#traversalSourceNode").val(valueText);
            self.context.source={type:"node",id:valueId};
        }
        else {
            $("#traversalTargetNode").val(valueText);
            self.context.target={type:"node",id:valueId};
        }


            bringToFront('traversalDialogMain')


    }

 self.executeTraversalSearch=function() {
     var maxDistance = parseInt($("#traversalNodeshMaxDistance").val());
     if (self.context.source.type == "node" && self.context.target.type == "node") {
         var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
         graphTraversalQueries.getAllSimplePaths(self.context.source.id, self.context.target.id, maxDistance, algo, function (err, data) {
             if (err) {
                 console.log(err)
                 return err;
             }

             currentDisplayType = "VISJS-NETWORK";
             visjsGraph.draw("graphDiv",   connectors.neoResultsToVisjs(data));
             filters.initGraphFilters (data);
             setTimeout(function(){
                 visjsGraph.paintNodes([self.context.source.id, self.context.target.id],"blue",null,10)

             },2000)
             //  toutlesensController.displayGraph(data, currentDisplayType, null);
             //  });


         })


     }
 }
    self.cancelMenu=function(){
     $("#dialog").html("");
        $("#dialog").dialog("close");

    }

    return self;
})
()