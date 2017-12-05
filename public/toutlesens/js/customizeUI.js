/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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
var customizeUI = (function () {
    self = {}
    self.hideFilters=false
    var legendDivWidth=Gparams.legendWidth;

    self.customInfo = function (obj) {



        if (queryParams.sinequaCallbackUrl) {
			
            var str = "";

            if (obj.neoAttrs.id_doc){
				
                // str = "<a href='" + queryParams.sinequaCallbackUrl + "?~~ID~~=" + obj.neoAttrs.id_doc + "target='_parent'>search in Sinequa</a>";
				str = '<a href="'+
					decodeURIComponent(queryParams.sinequaCallbackUrl).replace('~~ID~~',obj.neoAttrs.id_doc)+
					'" target="_parent">Search in Sinequa</a>';
			}

            return str;

        }
        return "";


    }
    self.init = function () {




    if( queryParams.sinequaCallbackUrl)
        customizeUI.customizationName="Sinequa";
    }

    self.customize = function () {

        if (queryParams.ui == "basic") {


        }
        var initialQuery = queryParams.initialQuery;
        if (initialQuery && initialQuery.length > 0) {

            toutlesensController.setSplitterPosition(Gparams.splitterMin);
            Gparams.startWithBulkGraphView = false;
            currentDisplayType="SIMPLE_FORCE_GRAPH"

            var normes = initialQuery.split(",");
          Gparams.legendWidth=0

           // $($("#tabs-radarRight").find("li")[2]).hide()
            $("#graphLegendDiv").width( Gparams.legendWidth);
            $("#graphDiv").width((totalWidth ));
            advancedSearch.searchByNamesList(normes, function (err, result) {
                    toutlesensController.generateGraph(null,false,function(){
                        $("#tabs-radarRight").tabs("option", "disabled", [2]);
                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");
                        $("#dataMenuButton").css("visibility","hidden");
                        $("#parametersMenuButton").css("visibility","hidden");


                    });

            })

        }
        else{
            mainMenu.showDataMenu();
            if(Gparams.startWithBulkGraphView )
             advancedSearch.showBulkGraph(subGraph);
        }


    }

    self.customizeOld = function () {

        if (queryParams.ui == "basic") {
            customizeUI.noLeftDivDisplay();
            customizeUI.setVisButton();
        }
        var initialQuery = queryParams.initialQuery;
        if (initialQuery && initialQuery.length > 0) {
            var normes = initialQuery.split(",");

            advancedSearch.searchByNamesList(normes, function (err, result) {

                Gparams.startWithBulkGraphView = false;
                var graphDisplay = queryParams.graphDisplay;
                if (graphDisplay && graphDisplay.length > 0) {
                    currentDisplayType = graphDisplay;
                    //     $("#representationSelect").val(graphDisplay);
                    toutlesensController.generateGraph(null,true)

                    /*
                     FLOWER
                     SIMPLE_FORCE_GRAPH_BULK
                     SIMPLE_FORCE_GRAPH
                     TREE
                     */

                }

            })

        }
        else{
            if(Gparams.startWithBulkGraphView )
                advancedSearch.showBulkGraph(subGraph);
        }


    }



    self.noLeftDivDisplay = function () {


        splitter.position("0%");
        $("#tabs-radarRight").width(totalWidth - 20);
        customizeUI.hideFilters=true;
        $("#filtersDiv").css("visibility", "hidden");


        legendDivWidth=30;
        $("#graphDiv").width((totalWidth - 10)-legendDivWidth)
        $("#graphLegendDiv").css("left", (totalWidth - 10) -legendDivWidth)
        $("#graphLegendDiv").width(legendDivWidth);
    }


    self.setVisButton = function () {

        $("#treemapButton").css("visibility", "hidden");
        $("#treeButton").css("visibility", "hidden")
        $("#treeButton").css("visibility", "hidden")
        $("#formButton").css("visibility", "hidden")

        //  $("#verticalVisButtonsDiv").css("width",100)
        $("#verticalVisButtonsDiv").css("height", 400)
        $("#verticalVisButtonsDiv").css("left", (totalWidth-52) -legendDivWidth)
        $("#verticalVisButtonsDiv").css("top", 60)
        $("#verticalVisButtonsDiv").css("visibility", "visible")
        $("#verticalVisButtonsDiv").css("z-index", 100);

        $('#verticalVisButtonsTable').tableflip($('#visButtonTableDiv'));
        $('#verticalVisButtonsTable td').css("align", "center");


    }
    self.setDepth = function (select) {
        $("#depth").val($(select).val());
        toutlesensController.generateGraph();
    }


    return self;
})()