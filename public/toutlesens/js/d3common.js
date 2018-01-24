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
var d3common = (function () {
    var self = {};


//moved  var currentMouseOverCoords;
//moved  var dragListener;

    self.d3CommonClick = function (d) {
       /* if (window.event.originalEvent.detail > 1) {// bypass click if dblclick
            return;
        }*/
        if (d.nodeType && d.nodeType == "label")
            return;
        var id = d.id;
        currentObject = d;
        currentSourceNode = d;
        if (d3.event.ctrlKey) {
            selection.addToSelection(currentObject)

        }

      /*  else if (false && Gparams.readOnly == true) {
            toutlesensController.dispatchAction('nodeInfos');




        }*/


        else {
            var e = d3.event;


            var x = e.offsetX + 10;
            var y = e.offsetY + 100;

            if (e.offsetX < 50) {// IE
                var xy0 = $("#graphDiv").offset();
                var x = e.clientX - xy0.left + 10;
                var y = e.clientY - xy0.top + 100;

            }

            toutlesensController.showPopupMenu(x, y);
            infoGenericDisplay.showNodeData(null,id);
        }

    }

    self.d3CommonDblclick = function (d) {
        currentObject = d;
        currentSourceNode = d;
        toutlesensController.dispatchAction('setAsRootNode');

    }


    self.d3CommonMouseover = function (d) {



        if (d.neoAttrs && d.neoAttrs.path) {
            return;
        }
        var e = d3.event;
        var x = e.offsetX + 30 //+ 10;
        var y = e.offsetY// + 100;
        if (e.offsetX < 50) {// IE
            var xy0 = $("#graphDiv").offset();
            var x = e.clientX - xy0.left + 50// +0;
            var y = e.clientY - xy0.top// + 100;

        }
        currentObject = d;
        currentMouseOverCoords = {x: x, y: y}
        if(d.target){//relation
            delete currentObject.target.relProperties.NeoId;
            currentObject.target.relProperties.source=currentObject.source[Schema.getNameProperty()];
            currentObject.target.relProperties.target=currentObject.target[Schema.getNameProperty()];
            var str = textOutputs.formatNodeInfo(currentObject.target.relProperties)
            $("#relInfoDiv").html(str);

        }
        else {
            toutlesensController.showPopupMenu(x, y, "nodeInfo");
        }
        return;


    };

    self.d3CommonMouseout = function (d) {

        if (d.neoAttrs && d.neoAttrs.path) {
            return;
        }
        var popupSize = {
            w: $("#popupMenuNodeInfoDiv").width(),
            h: $("#popupMenuNodeInfoDiv").height(),

        }
        var e = d3.event;
        var x = e.offsetX + 20;
        var y = e.offsetY;
        if (e.offsetX < 50) {// IE
            var xy0 = $("#graphDiv").offset();
            var x = e.clientX - xy0.left + 40;
            var y = e.clientY - xy0.top;

        }
        if (x < currentMouseOverCoords.x - 10)
            $("#popupMenuNodeInfoDiv").css('display', 'none');
        if (y < currentMouseOverCoords.y - 10)
            $("#popupMenuNodeInfoDiv").css('display', 'none');


        //  $("#popupMenuNodeInfoDiv").style('display', 'none');


    }

    self.commonDnD = function () {
        dragListener = d3.behavior.drag().on("dragstart", function (d) {
            var xxx = d3.select(this);
            var e = d3.event;

            if (e.ctrlKey) {
                // eventFactory.showNodeInfo(d);
                return;
            }


        }).on("drag", function (d) {
            var xxx = d3.select(this);


        }).on("dragend", function (d) {
            var xxx = d3.select(this);
            return;

        });

    }


    self.showThumbnails = function (nodes) {

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i][0][0];
            var nodeData = node.__data__;
            var position = {x: nodeData.x, y: nodeData.y};
            if (nodeData.neoAttrs && nodeData.neoAttrs.path) {
                var xxx = d3.select(node);
                d3.select(node).append("svg:image")
                    .on("mouseover", function (d) {

                        d3.select(this).attr("width", 200).style('opacity', CodeFlower.imgOpacityStrong)
                            .attr("x", function (d) {
                                return 0;
                            })
                            .attr("y", function (d) {
                                return 0;
                            });
                        d3.select(this).moveToFront();
                    })
                    .on("mouseout", function (d) {
                        d3.select(this).attr("width", 60).style('opacity', CodeFlower.imgOpacityWeak)
                            .attr("x", function (d) {
                                return 0
                            })
                            .attr("y", function (d) {
                                return 0
                            });
                        d3.select(this).moveToBack();
                    })
                    .attr("xlink:href", function (d) {
                        //   console.log(d.neoAttrs.path);

                        //return "http://127.0.0.1:3002/JAVATHEQUE"+encodeURIComponent(d.neoAttrs.path);
                        textOutputs.decodePath(nodeData.neoAttrs.path);
                        return encodeURI(Gparams.imagesRootPath + str);
                        //   return encodeURI(d.neoAttrs.path);

                    })
                    .attr("x", function (d) {
                        return -30
                    })
                    .attr("y", function (d) {
                        return -25
                    }).on("click", function (d) {
                    d3.select(this).attr("transform", function (d) {
                        return "rotate(-90)";
                    })

                })
                    .style('opacity', CodeFlower.imgOpacityStrong)
                    .attr("class", "d3NodeImage")
                    .attr("width", "60")
            }
        }
    }
    function highlightNode(id) {
        var www = d3.selectAll("#P_" + id);
        d3.selectAll("#P_" + id).each(function (d) {

            d3.select(this).select("circle").style("stroke-width", "3px").style("stroke", "red")

            //console.log(JSON.stringify(d))
            /*if (d.__data__.id == id) {
             var xx = "a"
             }*/
        })
    }


    self.appendSplitText = function (d3Group, text, fontSize) {
        var witdh, height;
        var xxx = d3.select(d3Group).selectAll("rect")[0][0]
        witdh = xxx.__data__.dx;
        height = xxx.__data__.dy;
        if (text.indexOf("Apollon") > -1)
            var x = "";

        var charsByLine = witdh / fontSize * 1.8;
        var array = [];
        var index = 0;
        var chars = [];
        var lastSpaceIndex = -1;
        while (index < text.length) {

            chars.push(text[index]);
            if (text[index] == " ")
                lastSpaceIndex = chars.length - 1;
            index++;
            if (chars.length >= charsByLine || index >= text.length) {
                var str = chars.join("");
                if (lastSpaceIndex > -1) {
                    var str2 = str.substring(lastSpaceIndex);
                    str = str.substring(0, lastSpaceIndex);

                    index -= str2.length;//(a cause du index++ plus haut)
                    index++;
                    lastSpaceIndex = -1;//
                }
                array.push(str);

                chars = [];

            }
        }

        var x = d3.scale.linear()
            .domain([0, 500])
            .range([0, 500]);

        var y = d3.scale.linear()
            .domain([0, 500])
            .range([0, 500]);
        var finish = false;
        for (var i = 0; i < array.length; i++) {
            if ((fontSize * (i + 2)) > height) {// troncature des textes si trop hauts
                array[i] = array[i].substring(0, Math.min(array[i].length, 3)) + "...";
                finish = true;
            }


            d3.select(d3Group).append('svg:text').text(array[i]).attr("x", function (d) {
                return x(d.x) + 6;
            })
                .attr("y", function (d) {
                    return y(d.y) + (fontSize * (i + 1));
                });
            if (finish)
                break;
        }
        return d3Group;
        // splitTextInLines(null,"dsgvsdvqdfbssfbhdfsgflkdfgqsdf",{w:50},12);


    }
    ,self.showRelationsOnGraph=function(link,d){


  //  var linkId=link[0][0].children[0].id; KO for IE
         var linkId=link[0][0].childNodes[0].id;


        if( Gparams.showRelationNames  ) {// ||  Gparams.showRelationAttrs
            var drawRelAttr = null;
            var relAttrsStr = "";
            if (Gparams.showRelationAttrs) {
                for (var key in d.target.relProperties) {
                    if (key != "subGraph") {
                        if (relAttrsStr.length > 0)
                            relAttrsStr += "-";
                        relAttrsStr += d.target.relProperties[key];
                        drawRelAttr = true;
                    }
                }

            }
            var aLine =link.append("text").attr("dy", -5)
                .append("textPath")
                .text(function (d) {
                    relName = "";
                    if (Gparams.showRelationNames) {
                        if (d.target.relDir == "normal")
                            relName = d.target.relType + " ->";
                        else
                            relName = "<- " + d.target.relType;
                    }
                    if (Gparams.showRelationAttrs) {
                        return relName + relAttrsStr
                    }
                    return relName;

                })
                .attr("xlink:href","#"+linkId)//  "#path_" +d.target.id)
                .attr("marker-end", "url(#arrowhead)")
                .style("text-anchor", "middle") // place the text halfway on the arc
                .attr("startOffset", "50%")
                .attr("class", "relName")
                .style("font-size", function (d) {
                    if (drawRelAttr)
                        return "18px";
                    return "10px";
                })
                //  .style("font-weight", "bold")
                .style("fill", function (d) {
                    if (linkColors[d.target.relType])
                        return linkColors[d.target.relType];
                    else
                        return " brown";

                })
                .style("opacity", function (d) {
                    if (d.target.decoration)
                        return .4;
                    return .6
                });
        }
    }


    return self;
})()
