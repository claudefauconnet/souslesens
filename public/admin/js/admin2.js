var admin = (function () {

    var self = {};





    self.onPageLoaded=function(){
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


    return self;


})()