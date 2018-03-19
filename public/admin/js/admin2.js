var admin = (function () {

    var self = {};
self.labels=[];

self.drawVisjsGraph= function (){

        subGraph = $("#subGraphSelect").val();
        Schema.createSchema(function(err, result){
            admin.setNeoKey(neoSourceLabel,neoSourceKey,mongoSourceField);
            admin.setNeoKey(neoTargetLabel,neoTargetKey,mongoTargetField);

            // Schema.load(subGraph, function(err, result) {
            dataModel.getDBstats();
            var data = connectors.toutlesensSchemaToVisjs(Schema.schema);

            visjsGraph.draw("graphDiv", data,{scale:2});
         /*   setTimeout(function(){

                var options = {
                    position: {x:positionx,y:positiony},
                    scale: scale,
                    offset: {x:offsetx,y:offsety},
                    animation: {
                        duration: duration,
                        easingFunction: easingFunction
                    }
                };
                statusUpdateSpan.innerHTML = 'Doing Animation.';
                finishMessage = 'Animation finished.';
                visjsGraph.network.moveTo(options);
            },1000)*/

        });
    }


    self.onPageLoaded=function(){
        messageDivId= message;
        $("#importNodesDiv").load("htmlSnippets/importNodesDialog.html", function () {

        })
        $("#importRelationsDiv").load("htmlSnippets/importRelationsDialog.html", function () {

        })

        $("#savedQueriesDiv").load("htmlSnippets/savedQueriesDialog.html", function () {

        })

        $("#neoDbDiv").load("htmlSnippets/neoDbDialog.html", function () {
            loadSubgraphs();
        })

        $("#importExportGraphDiv").load("htmlSnippets/importExportGraphDialog.html", function () {

        })

    }

    self.initImportDialogSelects=function(columnNames){
        columnNames.splice(0,0,"");
        common.fillSelectOptionsWithStringArray(mongoKey,columnNames);
        common.fillSelectOptionsWithStringArray(mongoField,columnNames);

        common.fillSelectOptionsWithStringArray(mongoSourceField,columnNames);
        common.fillSelectOptionsWithStringArray(mongoTargetField,columnNames);

        common.fillSelectOptionsWithStringArray(neoSourceLabel,self.labels);
        common.fillSelectOptionsWithStringArray(neoTargetLabel,self.labels);

      //  common.fillSelectOptionsWithStringArray(mongoKey,columnNames);

    }

    self.dispatchAction = function (action) {
        if (action == "linkSource") {
            $("#neoSourceLabel").val(currentObject.label)
        }
        if (action == "linkTarget") {
            $("#neoTargetLabel").val(currentObject.label)
        }

        $("#popupMenu").css("visibility","hidden")
    }


    self.showPopupMenu = function (x, y) {
        var graphDivPosition={
            x: $("#graphDiv").css('left'),
            y: $("#graphDiv").css('top'),

        }
        $("nodeInfos").html(JSON.stringify(currentObject.neoAttrs))
            $("#popupMenu").css("visibility","visible").css("top",y+10).css("left",x)

    }

    self.setNeoKey=function(select,targetSelect,columnSelect){
        var label=$(select).val();
        var column=$(columnSelect).val();


        var properties=[];
        for(var prop in Schema.schema.properties[label]){
            properties.push(prop);
        }
        properties.splice(0,0,"");
        common.fillSelectOptionsWithStringArray(targetSelect,properties);
        if(!column || column==""){
            return;
        }
        else if(properties.indexOf(column)<0){
            alert ("choose the property corresponding to the column 'id' ")
        }else{
            $(targetSelect).val(column);
        }


    }

    return self;


})()