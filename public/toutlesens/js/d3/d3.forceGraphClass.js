/**************************  TOUTLESENS LICENCE*************************

The MIT License (MIT)

Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**********************************************************************/

function ForceGraph(_graphDiv, _nodesData, _linksData) {
	this.graphDiv = _graphDiv;
	this.nodesData = _nodesData;
	this.linksData = _linksData;
	this.nodeColors={};
	Gparams.defaultNodeColor="#ddd";
	var linksData = _linksData;
	

	var radius = 6;

	var www=$(_graphDiv)[0].parentElement;
	var graphWidth=$(www).width();
	var graphHeight=$(www).height();
	
	var distance = 40;
	distance=100;
	//distance=graphWidth/10;
    var charge=currentGraphCharge;
	var charge = -200;
	var nodeFontSizes = {};

	var currentTextColor = "#000";
	var currentLinkColor = "#000";
	var currentTextSize = 12;
	

	var selectedNode;
	var targetNode;
	var lessFrequentNature;
	var path;
	var nodes;
	var force;
	var mouseClip = {
		x1 : 0,
		y1 : 0,
		x2 : 0,
		y2 : 0
	};
	var clippedNodes = [];

	var hoverRect;
	var hoverText;
	var clipRect;

	this.redrawGraph = function() {
		this.drawGraph();
	}
	
//	this.cleanGraph = function(){
//		$(this.graphDiv).html("");
//		d3.select("svg").selectAll("*").remove();
//	}
	
	
	this.highlightLinkedNodesExt=function(node){
		highlightLinkedNodes(node);
	}
	

	this.drawGraph = function() {
		setZoom();
		initDrag();
		if (true) {
			$(this.graphDiv).html("");
			d3.select("svg").selectAll("*").remove();
		//	this.cleanGraph()
		}

		 force = d3.layout.force().nodes(d3.values(this.nodesData)).links(this.linksData).size([ graphWidth, graphHeight ]).linkDistance(distance).charge(charge).on("tick", tick).start();
		var v = d3.scale.linear().range([ 0, 100 ]);
		v.domain([ 0, d3.max(this.linksData, function(d) {
			return d.value;
		}) ]);

		var svg = d3.select(this.graphDiv).append("svg").attr("width", graphWidth).attr("height", graphHeight).on("click",clickBG);

		// build the arrow.
		svg.append("svg:defs").selectAll("marker").data([ "end" ]) // Different
		// link/path
		// types can be
		// defined here
		.enter().append("svg:marker"); // This section adds in the arrows
		/*
		 * .attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX",
		 * 15).attr("refY", -1.5).attr("markerWidth", 6).attr("markerHeight",
		 * 6).attr("orient", "auto") .append("svg:path").attr("d",
		 * "M0,-5L10,0L0,5");
		 */

		// add the links and the arrows
		var sss = force.links();
		path = svg.append("svg:g").selectAll("path").data(force.links()).enter().append("svg:path").attr("class", function(d) {
			return "link";
		}).attr("marker-end", "url(#end)").style("stroke", function(d) {
			return currentLinkColor;
		}).attr("pointer-events", "mouseover").on("mouseover", function(link) {
			overPath(link);
		}).on("mouseout", function(link) {
			outPath(link);
		});

		// define the nodes
		nodes = svg.selectAll(".node").data(force.nodes()).enter().append("g").attr("class", "node").on("click", click).on("dblclick", dblclick).attr("pointer-events", "mouseover").on("mouseover",
				function(node) {
					overCircle(node);
				}).on("mouseout", function(node) {
			outCircle(node);
		}).call(force.drag);

		// add the nodes
		nodes.append("circle").attr("r", function(d) {
			/*
			 * var r = 2 * radius / Math.exp(1 / (d.nLinks)); if (r > 30) {
			 * console.log(r + " : " + d.nLinks); }
			 */
            if(d.decoration && d.decoration.size)
                return d.decoration.size;
			return 10;

		}).style("fill", function(d) {
				var color= nodeColors[d.label];
			if(!color)
				return Gparams.defaultNodeColor;
			return color;
		});

		nodes.each(function(aNode, index) {
			if (!aNode)
				return;

			// var xxx = 3.select(node[0][index]);
			d3.select(this).append("text").attr("dx", function(d) {
				if (d.parentNode  && d.parentNode.x < d.x)
					return -100+"px";
				else
					return 0+"px";
			}).attr("dy", ".35em").text(function(d) {
				return d.abbrev;
			}).attr("dx", "20px")
			.style("fill", function(d) {
				if(d.label=="MotCle")
					return red;
				return currentTextColor;

			}).attr("class", "textGraph").attr("font-size", function(d) {

				return currentTextSize;
			})

			.attr("text-anchor", function(d) {
				if (d.parentNode  &&  d.parentNode.x < d.x)
					return "start";
				else
					return "start";
				// return "middle";

			});

		});
		
		/*nodes.filter(function(dd) {
			return ("text")}).insert("rect","text")
	    .attr("x", function(d){
	    	return d.bbox.x})
	    .attr("y", function(d){return d.bbox.y})
	    .attr("width", function(d){return d.bbox.width})
	    .attr("height", function(d){return d.bbox.height})
	    .style("fill", "#FFE6F0");*/

		/*
		 * attr("transform", function(d) { if(d.level){ var
		 * x=(radius*Math.exp(1/d.level))-d.x; return "translate(" + x + "," +0 +
		 * ")"; } return ""; })
		 */

		hoverRect = svg.append("rect").attr("x", 100).attr("y", 100).attr("width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10).style("fill", "#FFF78C").attr("visibility", "hidden");
		hoverText = svg.append("text").attr("x", 100).attr("y", 100).attr("dy", ".35em").text("ABBBBBA").attr("class", "textHover").style("fill", "black").attr("visibility", "hidden");

		clipRect = svg.append("rect").attr("x", 100).attr("y", 100).attr("width", 10).attr("height", 10).attr("type", "clipRect").style("stroke", "white").attr("class", "clipRect").attr("visibility",
				"hidden");

		// ********************DND********************
		var sa;

		var drag = d3.behavior.drag().on("dragstart", function(a) {
			sa = a;
		}).on("drag", function(a, b, c, d, e) {
		}).on("dragend", function(d) {
			if (targetNode) {
				if (d != targetNode) {
					if ($.inArray(d.nature, nodeNatures[targetNode.nature].linkLogic) < 0) {
						setMessage("Link not allowed", "red");
						return;
					}
					if (!userCanCreateLink()) {
						setMessage("action not allowed", "red");
						return;
					}
					addGraphLink(d, targetNode);
				} else { // drag prend le pas sur click

				}
			}
		});

		d3.selectAll(".node").call(drag);

	}

	// ************************************************

	// add the curvy lines
	function tick() {

		path.attr("d", function(d) {
			var xxx = d;
			if (isNaN(d.target.x) || isNaN(d.target.y) || isNaN(d.source.x) || isNaN(d.source.y)) {
				// console.log("---" + d);
				return "";
			}
			var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
			if (dx === 0 && dy === 0)
				return "";
			return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
		});

		nodes.attr("transform", function(d) {
			if (isNaN(d.x) || isNaN(d.y)) {
				// console.log(d);
				return "";
			}

			return "translate(" + d.x + "," + d.y + ")";
		});
	}

	d3.selectAll(".link").on("click", clickLink);
	// d3.selectAll(".node").on("dblclick", dblclick);

	// action to take on mouse double click
	function clickLink() {
		var data = d3.select(this).datum();
		selectedLink = data;
		showLinkPopup(data);

	}

	// action to take on mouse click
	function click() {
		
		var e = d3.event;
		hidePopupMenu();
		selectedNode = d3.select(this).datum();
		currentObject=selectedNode;
		if (e.ctrlKey) {
			/*hidePopup();
			zoomGraphToSelectedNode(selectedNode);
			selectedNode.color=nodeColors[selectedNode.label];
			addToBreadcrumb(selectedNode);*/
		} else if (e.altKey) {
			;
			scrollToCenter();
		} else {
			
			$("#popupMenu").css("visibility","visible").css("top",e.layerY).css("left",e.layerX);	
		//	showInfos(selectedNode);
				
			
		}

	}
	
	function clickBG(){
 hidePopupMenu();
		//selectedNode = d3.select(this).datum();
		 if(d3.event.target.nodeName=="svg"){
			// zoomGraph(null);
		 }
	}

	scrollToCenter();

	// action to take on mouse double click
	function dblclick() {
		selectedNode = d3.select(this).datum();
		var id=selectedNode.id;
		getGraphDataAroundNode(id);

	}

	function initDrag() {
		var clicked = false, clickY;
		var dragStarted = false;
		$("#graph").on({
			"mousemove" : function(e) {
				mouseClip.x2 = e.offsetX;
				mouseClip.y2 = e.offsetY;
				if (dragStarted)
					showClipRect(mouseClip);
				// clicked && updateScrollPos(e);
			},
			"mousedown" : function(e) {
				mouseClip.x1 = e.offsetX;
				mouseClip.y1 = e.offsetY;
				clicked = true;
				clickY = e.pageY;
				dragStarted = true;

			},
			"mouseup" : function(e) {

				mouseClip.x2 = e.offsetX;
				mouseClip.y2 = e.offsetY;

				clicked = false;
				if (mouseClip.x2 - mouseClip.x1 > 10 && mouseClip.y2 - mouseClip.y1 > 10)
					setMouseSelection(mouseClip);
				$("html").css("cursor", "auto");
				dragStarted = false;
				hideClipRect(mouseClip);

			}
		});

		var updateScrollPos = function(e) {
			$("html").css("cursor", "row-resize");
			$("#graph").scrollTop($(window).scrollTop() + (clickY - e.pageY));
		};
	}

	$(document).dblclick(function(e) {
		if (e.target.nodeName == "svg" || e.target.CFtype) { // } &&
			// selectedNode)
			// {
			selectedNode = null;
			selectedNode2 = null;
			clippedNodes = [];
			drawGraph(true);

			cancelPopup(graphNodePopup);
			cancelPopup(graphLinkPopup);
		}
	});

	function overCircle(node) {
		hoverShow(node.x, node.y, node.label);
		if (targetNode != node) {
			targetNode = node;
		}
	}

	function outCircle(node) {
		hoverHide();
	}

	function overPath(link) {
		var p = getMiddlePoint({
			x : link.source.x,
			y : link.source.y
		}, {
			x : link.target.x,
			y : link.target.y
		});
		hoverShow(p.x, p.y, "aaa" + link.desc);

	}

	function outPath(link) {
		hoverHide();
	}

	function hoverShow(x, y, text) {
		if (!text.length)
			return;
		hoverRect.attr("x", x + 7);
		hoverRect.attr("y", y - 7);
		hoverRect.attr("width", 8 * text.length);
		hoverText.attr("x", x + 12);
		hoverText.attr("y", y + 3);
		hoverText.text(text);
		hoverRect.attr("visibility", "visible");
		hoverText.attr("visibility", "visible");
	}

	function hoverHide() {
		// return;
		hoverRect.attr("visibility", "hidden");
		hoverText.attr("visibility", "hidden");
	}

	function highlightNode(node) {
		var d = d3.select("#graph");
		var nodes = d3.selectAll(".node")[0];
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i].__data__.name == node.name) {
				hoverShow(node.x, node.y, node.label);
			}
		}
		
	}

	function shouldDrawText() {
		/*
		 * console.log(distance); console.log(charge); console.log(nNodes);
		 */

		if (nNodes < 100 || drawLabels === true || selectNode) {
			return true;
		} else {
			drawLabels = false;
			return false;
		}

	}

	function setNodeFrequenciesAndFontSizes(_nodes) {
		NN = 0;
		for ( var prop in nodeNatures) {
			nodeNatures[prop].freq = 0;

		}
		nNodes = 0;
		for ( var prop in _nodes) {
			nNodes++;
			nodeNatures[_nodes[prop].nature].freq += 1;
			NN++;
		}

		var freqs = [];
		for ( var prop in nodeNatures) {
			if (nodeNatures[prop].freq > 0) {
				freqs.push({
					"nat" : prop,
					"freq" : nodeNatures[prop].freq,
					"drawLabels" : nodeNatures[prop].drawLabels,
				});
			}
		}
		freqs.sort(function(a, b) {
			return a.freq > b.freq ? 1 : -1;
		});
		lessFrequentNature = null;
		nodeFontSizes = {};
		for (var i = 0; i < freqs.length; i++) {

			nodeFontSizes[freqs[i].nat] = 16 - (i * 2); // - (Math.log(NN) /
			// Math.log(10) * 2);
			if (freqs[i].freq > 0 && lessFrequentNature === null) {
				lessFrequentNature = freqs[i].nat;
			}

		}

	}

	function initNodesPosition(_nodes) {
		// var theta=3.14116/(180*nNodes);

		var n = 0;
		for ( var prop in _nodes) {
			n++;
		}
		var theta = Math.PI * 2 / n;
		var i = 0;
		for ( var prop in _nodes) {
			_nodes[prop].x = (graphWidth / 2) + (Math.cos(theta * i) * 200);
			_nodes[prop].y = (graphHeight / 2) + (Math.sin(theta * i) * 200);
			i++;
			// console.log( _nodes[prop].x+" "+ _nodes[prop].y);
		}

	}

	function getMiddlePoint(p1, p2) {
		var x, y;
		if (p2.x > p1.x)
			x = p1.x + ((p2.x - p1.x) / 2);
		else
			x = p2.x + ((p1.x - p2.x) / 2);
		if (p2.y > p1.y)
			y = p1.y + ((p2.y - p1.y) / 2);
		else
			y = p2.y + ((p1.y - p2.y) / 2);
		return {
			x : x,
			y : y
		};
	}

	function setMouseSelection(rect) {
		// clippedNodes = [];

		var i = 0;
		for ( var prop in nodes) {
			var node = nodes[prop];
			if (node.x > rect.x1 && node.x < rect.x2) {
				if (node.y > rect.y1 && node.y < rect.y2) {
					// setMessage(rect.x1+","+rect.y1+" :
					// "+rect.x2+","+rect.y2);
					clippedNodes[i++] = nodes[prop];
				}
			}
		}
		if (clippedNodes.length > 0) {
			setSlidersVal(-chargeSliderMaxValue, distanceSliderMaxValue);
			//console.log("charge " + -chargeSliderMaxValue);
			//console.log("distance " + distanceSliderMaxValue);
			$("#withAllLabels").prop("checked", true);
			drawGraphOrTree();
		}

	}

	function showClipRect(rect) {
		clipRect.attr("x", rect.x1);
		clipRect.attr("y", rect.y1);
		clipRect.attr("width", Math.abs(rect.x2 - rect.x1));
		clipRect.attr("height", Math.abs(rect.y2 - rect.y1));
		clipRect.attr("visibility", "visible");
	}

	function hideClipRect(rect) {
		clipRect.attr("x", rect.x1);
		clipRect.attr("y", rect.y1);
		clipRect.attr("width", 0);
		clipRect.attr("height", 0);
		clipRect.attr("visibility", "hidden");
	}

	function scrollToCenter() {
		var parentDiv = $(_graphDiv).parent();
		var h = ($(_graphDiv).height() / 2);
		var w = ($(_graphDiv).width()) / 2;
		var x = ($(parentDiv).height() / 2);
		var y = ($(parentDiv).width()) / 2;
		/*
		 * $(parentDiv).scrollTop(y - h); $(parentDiv).scrollLeft(x - w);
		 */
		$("#graphContainerDiv").scrollTop(-500);

	}
	function setZoom() {

	}
	
	
	

	 var highlightLinkedNodes=function(node) {

		var nodeId = node.id;
		var neighborIds = [];
		var l = linksData.length;
		for (var i = 0; i < l; i++) {
			var link = linksData[i];
			/*console.log(link.source_id + " " + link.target_id);
			if (!link.source_id || !link.target_id) {
				continue;
			}*/
			if (link.source.id == nodeId) {
				if (neighborIds.indexOf(link.source.id) < 0)
					neighborIds.push(link.source.id);
				if (neighborIds.indexOf(link.target.id) < 0)
					neighborIds.push(link.target.id);
			}

			if (link.target.id == nodeId) {
				if (neighborIds.indexOf(link.target.id) < 0)
					neighborIds.push(link.target.id);
				if (neighborIds.indexOf(link.source.id) < 0) {
					neighborIds.push(link.source.id);
				}
			}
		}

		d3.selectAll(".node").attr("opacity", 0.1);
		d3.selectAll(".link").attr("opacity", 0.1);
		var selection = d3.selectAll(".node").filter(function(d, i) {
			return neighborIds.indexOf(d.id) > -1;

		});
		selection.attr("opacity", 1);

		var selection2 = d3.selectAll(".link").filter(function(d, i) {
			if (neighborIds.indexOf( d.source.id )>-1|| neighborIds.indexOf( d.target.id )>-1)
				return true;
			return false;

		});
		selection2.attr("opacity", 1);
		selection2.attr("class", "link");
		
		var selection3 = selection2.filter(function(d, i) {
			if (node.id==d.source.id || node.id==d.target.id)
				return false;
			return true;

		});
		
		selection3.attr("class", "link2");
	}
	
	
	
	
	
}
