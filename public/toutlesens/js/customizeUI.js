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
    self.hideFilters=false;

    var idsList;
 //   var legendDivWidth=Gparams.rightPanelWidth;

    self.customInfo = function (obj) {



        if (queryParams.sinequaCallbackUrl && obj.labelNeo=="norme") {
			
            var str = "";

            if (obj.neoAttrs && obj.neoAttrs.id_doc){
				
                // str = "<a href='" + queryParams.sinequaCallbackUrl + "?~~ID~~=" + obj.neoAttrs.id_doc + "target='_parent'>search in Sinequa</a>";
				str = '<a href="'+
					//decodeURIComponent(queryParams.sinequaCallbackUrl).replace('~~ID~~',obj.neoAttrs.id_doc)+
                  (queryParams.sinequaCallbackUrl).replace('~~ID~~',obj.neoAttrs.id_doc)+
					'" target="_parent">Show in Sinequa</a>';
			}

            return str;

        }
        if (queryParams.entityFilterUrl && obj.labelNeo=="ref") {

            var str = "";

            if (obj.neoAttrs && obj.neoAttrs.ref){

                // str = "<a href='" + queryParams.sinequaCallbackUrl + "?~~ID~~=" + obj.neoAttrs.id_doc + "target='_parent'>search in Sinequa</a>";
                str = '<a href="'+
                   // decodeURIComponent(queryParams.entityFilterUrl).replace('~~ID~~',obj.neoAttrs.ref)+
                    (queryParams.entityFilterUrl).replace('~~Ref~~',obj.neoAttrs.ref)+
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


            var idsList=initialQuery.split(",");
            Gparams.startWithBulkGraphView = false;
            currentDisplayType="SIMPLE_FORCE_GRAPH";

            toutlesensController.setResponsiveDimensions(0);
            toutlesensData.setSearchByIdsListStatement(idsList, function (err, result) {
                    toutlesensController.generateGraph(null,true,function(){

                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");



                    });

            })

        }
        else{
            toutlesensController.setResponsiveDimensions(rightPanelWidth);
            if(Gparams.startWithBulkGraphView )
             advancedSearch.showBulkGraph(subGraph);
        }


    }





    return self;
})()