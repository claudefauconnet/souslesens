var eventsController = (function () {
        var self = {};
        self.stopEvent=false;
        self.startSearchNodesTime = null;

        self.initInputEvents = function () {


            $("#word").focus();
            $("body").click(function (e) {
                currentMousePosition = {
                    x: e.pageX,
                    y: e.pageY
                }
            });


            $("#advancedSearchButton").click(function (e) {
                advancedSearch.showDialog({multipleClauses: true});
            });

            $("#tagCloudButton").click(function (e) {
                toutlesensController.searchNodesUI('exec', null, null, tagCloud.drawCloud);
              //  $("#findTabs").tabs({active:4});

            });

            $("#graphDiv").click(function (e) {
            var xx=e;
            })


            $("#schemaButton").click(function (e) {
                var storedSchema = localStorage.getItem("schemaGraph_" + subGraph)
                if (e.ctrlKey && storedSchema) {
                    localStorage.removeItem("schemaGraph_" + subGraph);
                }
                toutlesensController.dispatchAction("showSchema")

            });

            $("#word").keyup(function (e) {
                //********************************************************
//trigger search depending on mode and keys
                if (Gparams.searchNodeAutocompletion) {
                    if (!eventsController.startSearchNodesTime) {// temporisateur
                        eventsController.startSearchNodesTime = new Date();
                        return;
                    } else {
                        var now = new Date();
                        if (now - eventsController.startSearchNodesTime < Gparams.searchInputKeyDelay)
                            return;
                    }


                } else {
                    if (e.keyCode != 13)
                        return;
                }
                toutlesensController.searchNodesUI('matchStr', null, null, treeController.loadSearchResultIntree);

            });

            $("#eraseWordButton").click(function (e) {
                self.startSearchNodesTime = null;
                $('#word').val('').focus();
            });


            $('#visJsSearchGraphButton').on('keypress', function (e) {
                if (e.which === 13) {
                    var expression = $("#visJsSearchGraphButton").val();
                    visjsGraph.findNode(expression, "blue", 15);
                }
            });

           $("#queryDiv").on('mousedown', function (e) {
              if( self.stopEvent)
                  return  self.stopEvent=false;
            toutlesensController.setRightPanelAppearance(true);
            })
;
            $("#analyzePanel").on('mousedown', function (e) {
                if( self.stopEvent)
                    return  self.stopEvent=false;
                toutlesensController.setRightPanelAppearance(false);
            })


//*******************************************components**************************************
//*****************************************************************************************
            self.initcomponentEvents = function () {

                $("#advancedQueriesAccordion").accordion(
                    {
                        active: false,
                        collapsible: true,
                        activate: function (event, ui) {
                            $("#dialog").dialog("close");
                            $("#graphPopup").css("visibility", "hidden");
                        }
                    });
                ;

                $("#tabs-analyzePanel").tabs({


                    activate: function (event, ui) {
                        $("#dialog").dialog("close");
                        $("#graphPopup").css("visibility", "hidden");

                        var index = ui.newTab.index();

                        if (index == 0) {
                            toutlesensController.currentActionObj.mode = "infos";

                        }
                        if (index == 1) {
                            toutlesensController.currentActionObj.mode = "filter";
                        /*    var filterMovableDiv = $("#filterMovableDiv").detach();
                            $("#searchCriteriaTextDiv").css("visibility", "hidden");
                            $("#searchCriteriaAddButton").css("visibility", "hidden");

                            $("#filterDiv").append(filterMovableDiv);
                            $("#filterActionDiv").html(
                                "<button onclick=\"filters.filterOnProperty(null,'only')\">Only</button>" +
                                "<button onclick=\"filters.filterOnProperty(null,'not')\">Not</button>" +
                                "<button onclick=\"filters.filterOnProperty(null,'removeAll')\">Clear Filter</button>"
                            );
                            filters.setLabelsOrTypes("node");*/
                        }
                        if (index == 2) {
                            toutlesensController.currentActionObj.mode = "highlight";

                            /*   $("#searchCriteriaTextDiv").css("visibility","hidden").css("height","10px");
                               $("#searchCriteriaAddButton").css("visibility", "hidden");
                               $("#propertiesSelectionDialog_propertySelect").val("");
                               var filterMovableDiv = $("#filterMovableDiv").detach();
                               $("#highlightDiv").append(filterMovableDiv);*/
                         /*   $("#highlightDiv").load("htmlSnippets/paintDialog.html", function () {
                                paint.initColorsPalette(10, "paintDialogPalette");
                                filters.setLabelsOrTypes("node");
                            });*/

                        }

                        if (index == 3) {
                            advancedSearch.searchSimilars(currentObject);
                        }


                    }
                });
                $("#findTabs").tabs({
                    load: function (event, ui) {

                    },
                    activate: function (event, ui) {
                        $("#dialog").dialog("close");
                        $("#graphPopup").css("visibility", "hidden");
                        toutlesensController.setRightPanelAppearance(true);
                        var index = ui.newTab.index();
                        if (index == 0) {
                            toutlesensController.currentActionObj = {type: "findNode"}
                            advancedSearch.context = {pathType: "neighbour"};
                            var nodeDivDetach = $("#nodeDivDetachable").detach();

                            $("#nodeDiv").append(nodeDivDetach);

                        }
                        if (index == 0)
                            ;//toutlesensController.currentActionObj = {type: "findNode"}
                        if (index == 1)
                        toutlesensController.currentActionObj = {type: "findNode"}

                        if (index == 2)
                            toutlesensController.currentActionObj = {type: "relation"}
                        if (index == 3)
                            toutlesensController.currentActionObj = {type: "pathes"}
                        if (index == 4)
                         ;//   toutlesensController.searchNodesUI('exec', null, null, tagCloud.drawCloud);
                    },
                    create: function (event, ui) {
                        toutlesensController.currentActionObj = {type: "findNode"}

                    }
                });
                $("#graphDiv").click(function (e) {
                    if (currentDisplayType = "VISJS-NETWORK")
                        return;
                    var dat = e.target.__data__;
                    if (!dat) {
                        toutlesensController.hidePopupMenu();
                        return;
                    }
                    if (dat.id == null || dat.id == "")
                        toutlesensController.hidePopupMenu();

                });


                $("#dialog").dialog({
                    autoOpen: false,
                    height: Gparams.smallDialogSize.h,
                    width: Gparams.smallDialogSize.w,

                    modal: true,
                    position: {my: "left top", at: "left bottom", of: $("#mainButtons")}


                });

                $("#dialogLarge").dialog({
                    autoOpen: false,
                    height: Gparams.bigDialogSize.h,
                    width: Gparams.bigDialogSize.w,
                    modal: true

                });

                $("#BIlegendDiv").draggable();


            }


        }


        return self;

    }
)()