//function toutlsensD3(){
var vis;
var visLeg;
var drag ;
var svgGroup;


function drawLegendOld() {
	
	
	if (visLeg) {
		$("#graphLegendDiv").html("");
		d3.select(".legendSVG").selectAll("*").remove();

	}
	var w= $("#graphLegendDiv").width() ;
	var h= $("#graphLegendDiv").height();
	
	
	visLeg = d3.select("#graphLegendDiv").append("svg:svg").attr("width", w).attr(
			"height", h).attr("class", "legendSVG");
	
	var labels = new Array;
	var x = 100;// 230;
	var y = 5;// 50;
	var circleLegR = 6;
	var legHeight = 40;
	var legWidth = 100;
	// $("#nodesLabelsSelect option").each(function() {

	var relations = []

	for (type in legendRelTypes) {

		var obj = {
			label : type.label,
			index : type.index,
			x : x,
			y : y
		}
		relations.push(type);

	}
	for (label in legendNodeLabels) {
		// legHeight += 20;
		legWidth += 100;
		var obj = {
			name : label,
			x : x,
			y : y
		}
		if (!excludeLabels[obj.name])
			excludeLabels[obj.name] = -1;
		if (obj.name != "") {
			labels.push(obj);
			x += 100;
		}
	}
// $("#graphLegendDiv").height(y);

	var legend = visLeg.data([ {
		x : 150,
		y : 100
	} ]).append("g").attr("class", "legend").attr("transform", function(d) {
		return "translate(" + 10 + "," + 15 + ")"
	}).attr("x",function (d){return d.x})
	.attr("y",function (d){return d.y})
	
	legend.append("rect").attr("class", "legendRect").attr("x", 20).attr("y", -10).attr("width", legWidth)
			.attr("height", legHeight).style("stroke", "black").style("stroke-widh", "1px").style("fill",
					"#eee");


	var legendElts = legend.selectAll("g").data(labels).enter().append("g")
			.attr("class", "legendElt").attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			}).on("click", clickLegend);

	legendElts.append("circle").attr('class', 'nodeCircle').attr("r",
			circleLegR).style("fill", function(d) {
		var color = nodeColors[d.name];
		if (!color)
			return Gparams.defaultNodeColor;
		return color;
	}).style("stroke", function(d) {
		var color = nodeColors[d.label];
		if (color)
			return color;
		return Gparams.defaultNodeColor;

	});

	legendElts.append("text").attr("x", function(d) {
		return circleLegR + 8;
	}).attr("dy", ".35em").attr('class', 'legendText')

	.style("fill", function(d) {
		return "#000";
	}).attr("text-anchor", function(d) {
		return "start";
	}).text(function(d) {
		return d.name;
	}).style("fill-opacity", 1).style("font-size", "12px");

 /*   visLeg.append("text").append("text").attr("x",30).attr("dy", "35em").attr('class', 'legendText')
        .style("fill", "#000").attr("text-anchor","start").attr("transform", "translate(100,50)")
        .text("AAAAAAAAdisplay params...").style("fill-opacity", 1).style("font-size", "18px");/*

	function clickLegend() {
		var e = d3.event;
		var selectedLegendNode = d3.select(this).datum();

		if (e.ctrlKey) {

		} else if (e.altKey) {
			;
		} else {
			var xx = excludeLabels[selectedLegendNode.name];
			xx = -xx;
			excludeLabels[selectedLegendNode.name] = xx;// *(excludeLabels[selectedLegendNode.name]);

			var json=toFlareJson(null ,null);
			
			displayGraph(json,null);
			
			var wwwww=d3.selectAll("legendText");
			 d3.selectAll(".legendText")
            .transition()
            .style( "text-decoration", function(d){
            	
            	
            	
            	
            	if(excludeLabels[d.name]>0)
            	return  "line-through";
            	else
            		return "none";
            		
            	
            	
            })
             .style( "fill", function(d){
            	if(excludeLabels[d.name]>0)
            	return  "red";
            	else
            		return "black";
            		
            	
            	
            });

		}
	}
	// legend.call(drag);
// drag.origin(vis);
	var xOldLeg, yOldLeg;
	
	
	
	/*
	 * drag.on("dragstart", function(d) { xOldLeg=d.x; yOldLeg=d.y; });
	 * 
	 * drag.on("drag", function(d) {
	 * 
	 * d.x += d3.event.dx; d.y +=d3.event.dy; console.log(d.x+" "+ d.y);
	 * d3.select(this).attr("transform", function(d) { return "translate(" +
	 * d3.event.dx+ "," + d3.evemoulinnt.dy+ ")"; }); //
	 * d3.event.sourceEvent.stopPropagation(); // silence other listeners });
	 * 
	 * drag.on("dragend", function(d) {
	 * 
	 * d3.select(this).attr("transform", function(d) { return "translate(" +
	 * d3.event.sourceEvent.offsetX+ "," + d3.event.sourceEvent.offsetY+ ")";
	 * });
	 * 
	 * });
	 */
}


function drawForceCollapse(json, _w, _h, _charge, _distance) {

	var linkType = "bezier";
	// linkType="line"
	var rootx = w / 2 / coef;
	var w = 1280, h = 800;
	w= $("#graphDiv").width() ;
	h= $("#graphDiv").height();
	
	 
	 distance = 120, charge = -300;
	var node, link, root;

	if (_w)
		w = _w
	if (_h)
		h = _h
	if (_distance)
		distance = _distance;
	if (_charge)
		charge = _charge

		/*
		 * charge = parseInt($("#charge").val()); distance =
		 * parseInt($("#distance").val()); coef = parseFloat($("#coef").val());
		 */

	var force = d3.layout.force().size([ w, h - 160 ]).linkDistance(distance)
			.charge(charge).on("tick", tick);
	force.start();

	/*
	 * .on("tick", tick) .charge(function(d) { return d._children ? -d.size /
	 * 100 : -30; }).linkDistance(function(d) { //return 150; return
	 * d.target._children ? 80 : 30; }).size([ w, h - 160 ]);
	 */

	if (vis) {
		$("#graphDiv").html("");
		d3.select(".graphSVG").selectAll("*").remove();

	}
	vis = d3.select("#graphDiv").append("svg:svg").attr("width", w).attr(
			"height", h).attr("class", "graphSVG");
	svgGroup = vis.append("g");
	root = json;
	root.fixed = true;
	root.x = w / 2 // - 200;
	root.y = h / 2// - 80;
	var coef = 1
/*
 * vis.append("defs").selectAll("marker") .data(["XXX", "licensing",
 * "resolved"]) .enter().append("marker") .attr("id", function(d) { return d; })
 * .attr("viewBox", "0 -5 10 10") .attr("refX", 15) .attr("refY", -1.5)
 * .attr("markerWidth", 6) .attr("markerHeight", 6) .attr("orient", "auto")
 * .append("path") .attr("d", "M0,-5L10,0L0,5");
 */
	
	 drag = d3.behavior.drag();
	update();

	
	hoverRect = vis.append("rect").attr("x", 100).attr("y", 100).attr("width",
			100).attr("height", 20).attr("rx", 10).attr("ry", 10).style("fill",
			"#FFF78C").attr("visibility", "hidden");
	hoverText = vis.append("text").attr("x", 100).attr("y", 100).attr("dy",
			".35em").text("ABBBBBA").attr("class", "textHover").style("fill",
			"black").attr("visibility", "hidden");

	function update() {
		
		setTimeout(function(){ force.stop(); }, Gparams.forceAnimationDuration);
		
		
		var nodes = flatten(root);
		var links = d3.layout.tree().links(nodes);

		

		// Restart the force layout.

		force.size([ w, h ]).charge(charge).linkDistance(function(d) {
			if (d.target.level)
				return distance / (d.target.level)
			return distance;
		}).nodes(nodes).links(links)
		// .size([2,2])
		/*
		 * .linkStrength(0.1) .friction(0.9) .linkDistance(20) .charge(-30)
		 * .gravity(1) .theta(0.8) .alpha(0.1)
		 */
		.start();

		var v = d3.scale.linear().range([ 0, 100 ]);
		v.domain([ 0, d3.max(links, function(d) {
			return d.value;
		}) ]);
		
	

		// new links ****************beziers
		if (linkType == "bezier") {
			link = svgGroup.append("svg:g").selectAll("path").data(
					force.links()).enter().append("svg:path").attr("class",
					function(d) {
						return "link";
					}).attr("id", function(d) {
				return "link_" + d.target.id;
			}).attr("marker-end", function(d) {
				return "url(#XXX)";
				
		    })
			
			.style("stroke", function(d) {
				return "brown";
			}).style("stroke-dasharray", ("2, 2"))

			.attr("pointer-events", "mouseover").on("mouseover",
					function(link) {
						// ;overPath(link);
					}).on("mouseout", function(link) {
				// ;outPath(link);

			}).style("fill", "none");

			var relText = svgGroup.append("svg:g").selectAll("path").data(
					force.links()).enter().append("text").append("textPath") 
			.attr("xlink:href", function(d) {
				return "#link_" + d.target.id;
			}) // place the ID of the path here
			.style("text-anchor", "middle") // place the text halfway on the arc
			.attr("startOffset", "50%").text(function(d) {
				if(d.target.relDir=="normal")
					return "-"+d.target.relType+"->";
				else
					return "<-"+d.target.relType+"-";
			
			}).style("font-size", "9px").style("fill", "brown")
		
			.attr(
					"pointer-events", "mouseover").on("mouseover",
					function(link) {
						// ;overPath(link);
					}).on("mouseout", function(link) {
				// ;outPath(link);
			}).on("click",clickLink)

		} else {// old links ****************lines
			link = svgGroup.append("svg:g").selectAll("line.link").data(links,
					function(d) {
						return d.target.id;
					});
			

		

			link.enter().insert("svg:line", ".line").attr("class", "link")
					.attr("x1", function(d) {
						return d.source.x;
					}).attr("y1", function(d) {
						return d.source.y;
					}).attr("x2", function(d) {
						return d.target.x;
						link.exit().remove();
					}).style("stroke", function(d) {
						return "brown";
					}).style("stroke-dasharray", function(d) {
						var p = legendRelTypes[d.target.relType].index + 1;
						return "" + p + "," + p;
					}).on("mouseover", function(d) {
						overPath(d);
					}).on("mouseout", function(d) {
						outPath(d);
					});
			// var
			// path=[["M",d.source.x,d.source.y],["L",d.target.x,d.target.y]];
			var relText = svgGroup.append("svg:g").selectAll("path").data(
					force.links()).enter().append("text").append("textPath") 
			.attr("xlink:href", function(d) {
				return "#link_" + d.target.id;
			}) // place the ID of the path here
				 .attr("marker-end", "url(#arrowhead)")
			.style("text-anchor", "middle") // place the text halfway on the arc
			.attr("startOffset", "50%").text(function(d) {
				return d.target.type;
			}).style("font-size", "10px").style("fill", "brown").attr(
					"pointer-events", "mouseover").on("mouseover",
					function(link) {
						// ;overPath(link);
					}).on("mouseout", function(link) {
				// ;outPath(link);
			})

		}

		// 
		// * end old linls
		// Update the nodes…
		// Update the nodes…
		nodeEnter = svgGroup.selectAll("g.node").data(nodes, function(d) {
			return d.id;// || (d.id = ++i);
		});

		nodeEnter.transition().attr("r", function(d) {
			return d.children ? 4.5 : Math.sqrt(d.size) / 5;
		});

		nodeEnter = nodeEnter.enter().append("g").attr("class", "node").attr(
				"transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				}).on("click", clickThis).on('dblclick', dblclick)
				.attr("pointer-events", "mouseover")
				.on("mouseover", function(node) {
					overCircle(node);
				}).on("mouseout", function(node) {
					outCircle(node);
				})

		;

		nodeEnter.append("circle").attr('class', 'nodeCircle').attr("r",
				function(d) {

					if (d.isRoot === true)
						return Gparams.circleR;
					return Gparams.circleR/ ((Math.sqrt(d.level+1)));
					//return Gparams.circleR / Math.pow(2, d.level + 1) * 3;

				}).style("fill", function(d) {
			var color = nodeColors[d.label];
			if (!color)
				return Gparams.defaultNodeColor;
			return color;
		}).style("stroke", function(d) {
			if (d.isRoot === true)
				return "red";
			return Gparams.defaultNodeColor;
			var color = nodeColors[d.label];
			if (!color)
				return Gparams.defaultNodeColor;

		})
		.style("stroke-width", function(d) {
			if (d.isRoot === true)
				return "3px";
			else
				return "1px";
		})

		;

		nodeEnter.append("text").attr("x", function(d) {
			// return d.x < rootx ? -8 : Gparams.circleR + 8;
			var xx;
			if (d.isRoot === true)
				xx = Gparams.circleR;
			else
				xx = (Gparams.circleR / Math.pow(2, d.level + 1) * 3);

			return d.x < rootx ? -(8 + xx) : (xx + 8);

		}).attr("dy", ".35em").attr('class', 'nodeText')

		.style("fill", function(d) {
			return "#444";
		}).attr("text-anchor", function(d) {
			// return "start";
			d.x < rootx ? "end" : "start";
		}).text(function(d) {
			if (d.name.length > Gparams.nodeMaxTextLength)
				return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
			return d.name;
		}).style("fill-opacity", 1).style("font-size", "14px").style("fill",
				Gparams.defaultNodeColor);

	}
	var dx = 0;
	var dy = 0;
	// svgGroup.attr("transform", "translate(" +dx+","+dy+")");

	/*
	 * svgGroup.attr("transform", "translate(" +(-w/2/coef)+","+(-h/2/coef) +
	 * ")scale(" + coef + ")");
	 */

	// Define the zoom function for the zoomable tree
	function zoom() {
		svgGroup.attr("transform", "translate(" + d3.event.translate
				+ ")scale(" + d3.event.scale + ")");
	}
	function overCircle(node) {
		hoverShow(node.x, node.y, "[" + node.label + "] " + node.name);

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
		hoverShow(p.x, p.y, "" + link.target.relType);

	}

	function outPath(link) {
		hoverHide();
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

	// define the zoomListener which calls the zoom function on the "zoom"
	// event constrained within the scaleExtents
	// var zoomListener = d3.behavior.zoom().scaleExtent([ 0.1, 3 ]).on("zoom",
	// zoom);

	function tick() {
		var rootx2;
		if (linkType == "bezier") {
			// new CF links**********************
			link
					.attr(
							"d",
							function(d) {

								if (isNaN(d.target.x) || isNaN(d.target.y)
										|| isNaN(d.source.x)
										|| isNaN(d.source.y)) {
									// console.log("---" + d);
									return "";
								}
								var dx = d.target.x - d.source.x, dy = d.target.y
										- d.source.y, dr = Math.sqrt(dx * dx
										+ dy * dy);
								if (dx === 0 && dy === 0)
									return "";
								var zzzz = "M" + d.source.x + "," + d.source.y
										+ "A" + dr + "," + dr + " 0 0,1 "
										+ d.target.x + "," + d.target.y;
								return zzzz;
							});

		} else {
			link.attr("x1", function(d) {
				return d.source.x;
			}).attr("y1", function(d) {
				return d.source.y;
			}).attr("x2", function(d) {
				return d.target.x;
			}).attr("y2", function(d) {
				return d.target.y;
			});
		}

		if (!nodeEnter)
			return;
		nodeEnter.attr("transform", function(d) {
			if (d.isRoot === true)
				rootx2 = d.x;
			return "translate(" + d.x + "," + d.y + ")";
		});

		nodeEnter.selectAll("text").attr("x", function(d) {
			var xx;
			if (d.isRoot === true)
				xx = Gparams.circleR;
			else
				xx = (Gparams.circleR / Math.pow(2, d.level + 1) * 3);
			return d.x < rootx2 ? -(8 + xx) : (xx + 8);

		}).attr("text-anchor", function(d) {
			// return "start";
			// d.x < rootx2 ? "end" : "start";
			if (d.x < rootx2)
				return "end";
			return "start";
		});

	}

	function handleMouseOver() {

		alert("aaa");
	}
	// Color leaf nodes orange, and packages white or blue.
	function color(d) {
		return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
	}

	// Toggle children on click.
	function click(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update();
	}

	function flatten(root) {
		var nodes = {};

		function recurse(node, level) {
			if (!nodes[node.id]) {
				node.level = level;
				nodes[node.id] = node;
				if (node.children) {
					level++;
					for (var i = 0; i < node.children.length; i++) {
						recurse(node.children[i], level);
					}

				}

			}

		}
		recurse(root, 0);
		var nodes2 = []
		for ( var key in nodes) {
			nodes2.push(nodes[key]);
		}
		return nodes2;
	}

	// Returns a list of all nodes under the root.
	var childrenUniques = [];
	function flattenOld(root) {
		var nodes = [], i = 0;

		function recurse(node) {
			if (node.children)
				node.size = node.children.reduce(function(p, v) {
					return p + recurse(v);
				}, 0);
			if (!node.id)
				node.id = ++i;
			nodes.push(node);
			return node.size;
		}

		root.size = recurse(root);
		return nodes;
	}

	function clickThis() {
		// action to take on mouse click

		var e = d3.event;
		// hidePopup();
		selectedNode = d3.select(this).datum();
		currentObject=selectedNode;
		if (e.ctrlKey) {
		// getNodeAllRelations(selectedNode.id);
		/*
		 * var leg=d3.selectAll(".legend").datum()
		 * 
		 * xxx=d3.event.x//-leg.x; yyy=d3.event.y//-leg.y; var
		 * xxxx=d3.select(".legendRect"); d3.selectAll(".legend").each(
		 * function(d, i){ var xxx=this; d3.select(this).attr("x", 500)
		 * .attr("y",500); });
		 */
			

		} else if (e.altKey) {
			;
		} else {
			//OK Chrome pas OK le sautres
			var x = e.offsetX + 10;
			var y = e.offsetY + 100;
			if(e.offsetX<50){//IE
				var xy0=$("#graphDiv").offset();
					var x = e.clientX-xy0.left + 10;
					var y = e.clientY-xy0.top + 100;
			
			}
			if(Gparams.readOnly==true){
				dispatchAction('nodeInfos');
			}
			
			else{
				showPopupMenu(x,y);
				
		
			}

			// getNodeAllRelations(selectedNode.id,null,true,false);
			
			/*
			 * query2("MATCH (n:" + selectedNode.label + "{id:" +
			 * selectedNode.myId + "}) return n,ID(n)", function(d) { var obj =
			 * d.results[0].data[0].row[0] showInfosCallback(d.results); var
			 * neoId = d.results[0].data[0].row[1]; getNodeAllRelations(neoId);
			 * if(isZoomed) zoomIn(); })
			 */
        
		}
		if (isZoomed)
			zoomIn();
		   return false;
	}
	
	function dblclick(d){
		selectedNode = d3.select(this).datum();
		var id=selectedNode.id;
		if(true || Gparams.navigationStyle=="jpt"){
			dispatchAction('setAsRootNode');
			return true;
		}
		getGraphDataAroundNode(id);
	}

	function mouseup() {
		var eeee = d3.event;
	}

}

function query2(statement, callback) {

	console.log(statement);
	var payload = {
		"statements" : [ {
			"statement" : statement
		} ]
	};
	paramsObj = {
		mode : "POST",
		urlSuffix : "db/data/transaction/commit",
		payload : JSON.stringify(payload)
	}

	$.ajax({
		type : "POST",
		url : Gparams.neo4jProxyUrl,
		data : paramsObj,
		dataType : "json",
		success : function(data, textStatus, jqXHR) {

			callback(data);

		},
		error : function(xhr, err, msg) {
			console.log(xhr);
			console.log(err);
			console.log(msg);
		}

	});

}

function toogleZoom() {
	if (isZoomed)
		zoomOut()
	else
		zoomIn();
}

function zoomIn() {

	if (!cachedResultArray)
		return;

	var el = $('#graphContainerDiv').detach();
	$("#anchorDiv").append(el);
	$("#graphContainerDiv").css("width", "1200px");
	$("#graphContainerDiv").css("width", "1200px");
	var scrollLeft = ($("#graphDiv").parent().width() / 2) + 100;
	var scrollTop = ($("#graphDiv").parent().height() / 2);
// $("#graphDiv").parent().scrollLeft(scrollLeft);
// $("#graphDiv").parent().scrollTop(scrollTop);
	var json = toFlareJson(cachedResultArray)
	var w = 1500, h = 1200, charge = -200, distance = 150;
	drawForceCollapse(json, w, h, charge, distance);
	drawLegend();
	isZoomed = true;
}
function zoomOut() {
	if (!cachedResultArray)
		return;

	var el = $('#graphContainerDiv').detach();
	$("#anchorZoomOutSpan").append(el);
	$("#graphContainerDiv").css("width", "550px");
	$("#graphContainerDiv").css("width", "550px");
	var scrollLeft = ($("#graphDiv").parent().width() / 2) + 100;
	var scrollTop = ($("#graphDiv").parent().height() / 2) - 100;
	$("#graphDiv").parent().scrollLeft(scrollLeft);
	$("#graphDiv").parent().scrollTop(scrollTop);
	var json = toFlareJson(cachedResultArray)
	// var w=3000, h=1600, charge=-200,distance=150;
	drawForceCollapse(json);
	isZoomed = false;
}

function stack() {

	// http://stackoverflow.com/questions/9828250/how-to-increase-the-maximum-call-stack-in-javascript
	var trace = printStackTrace();
	console.log(trace.length());
}








/*******************************************************************************
 * Tree********************************************
 * *******************************************************************************************************************************************************************
 ******************************************************************************/



















/*******************************************************************************
 * Tree********************************************
 * *******************************************************************************************************************************************************************
 ******************************************************************************/







/*******************************************************************************
 * spare code********************************************************
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * function drawRotatingTree(json) { var w = 1280, h = 800, rx = w / 2, ry = h /
 * 2, m0, rotate = 0;
 * 
 * var cluster = d3.layout.cluster().size([ 360, ry - 120 ]).sort(null);
 * 
 * var diagonal = d3.svg.diagonal.radial().projection(function(d) { return [
 * d.y, d.x / 180 * Math.PI ]; });
 * 
 * if (true) { $("#graphDiv").html("");
 * d3.select("svg").selectAll("*").remove(); }
 * 
 * var svg = d3.select("#graphDiv").append("div").style("width", w + "px")
 * .style("height", w + "px");
 * 
 * var vis = svg.append("svg:svg").attr("width", w).attr("height", w).append(
 * "svg:g").attr("transform", "translate(" + rx + "," + ry + ")");
 * 
 * vis.append("svg:path").attr("class", "arc").attr( "d",
 * d3.svg.arc().innerRadius(ry - 120).outerRadius(ry).startAngle(0) .endAngle(2 *
 * Math.PI))// .on("mousedown", mousedown); // d3.json("flare.json",
 * function(json) { var nodes = cluster.nodes(json);
 * 
 * var link = svgGroup.selectAll("path.link").data(cluster.links(nodes))
 * .enter().append("svg:path").attr("class", "link").attr("d", diagonal);
 * 
 * var node = svgGroup.selectAll("g.node").data(nodes).enter().append("svg:g")
 * .attr("class", "node").attr("transform", function(d) { return "rotate(" +
 * (d.x - 90) + ")translate(" + d.y + ")"; })
 * 
 * node.append("svg:circle").attr("r", 6).on("click", function(d) { www = 10;
 * 
 * }).style("fill", function(d) { var color = nodeColors[d.label]; return color; }) ;
 * 
 * node.append("svg:text").attr("dx", function(d) { return d.x < 180 ? 8 : -8;
 * }).attr("dy", ".31em").attr("text-anchor", function(d) { return d.x < 180 ?
 * "start" : "end"; }).attr("transform", function(d) { return d.x < 180 ? null :
 * "rotate(180)"; }).text(function(d) { return d.name; });
 * 
 * d3.select(".svg:circle").on("click", function(d) { alert("aaa"); }) // }); //
 * d3.select(window).on("mousemove", mousemove).on("mouseup", mouseup); /*
 * function mouse(e) { return [ e.pageX - rx, e.pageY - ry ]; }
 * 
 * function mousedown() { m0 = mouse(d3.event); // d3.event.preventDefault(); }
 * 
 * function mousemove() { if (m0) { var m1 = mouse(d3.event), dm =
 * Math.atan2(cross(m0, m1), dot(m0, m1)) 180 / Math.PI, tx = "translate3d(0," +
 * (ry - rx) + "px,0)rotate3d(0,0,0," + dm + "deg)translate3d(0," + (rx - ry) +
 * "px,0)"; svg.style("-moz-transform", tx).style("-ms-transform", tx).style(
 * "-webkit-transform", tx); } }
 * 
 * function mouseup() { if (m0) { var m1 = mouse(d3.event), dm =
 * Math.atan2(cross(m0, m1), dot(m0, m1)) 180 / Math.PI, tx =
 * "rotate3d(0,0,0,0deg)";
 * 
 * rotate += dm; if (rotate > 360) rotate -= 360; else if (rotate < 0) rotate +=
 * 360; m0 = null;
 * 
 * svg.style("-moz-transform", tx).style("-ms-transform", tx).style(
 * "-webkit-transform", tx);
 * 
 * vis.attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate +
 * ")") .selectAll("g.node text").attr("dx", function(d) { return (d.x + rotate) %
 * 360 < 180 ? 8 : -8; }).attr("text-anchor", function(d) { return (d.x +
 * rotate) % 360 < 180 ? "start" : "end"; }).attr( "transform", function(d) {
 * return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; }); } }
 * 
 * function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
 * 
 * function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
 */

function clickX() {

	var e = d3.event;
	// hidePopup();
	selectedNode = d3.select(this).datum();

	if (e.ctrlKey) {
		/*
		 * hidePopup(); zoomGraphToSelectedNode(selectedNode);
		 * selectedNode.color=nodeColors[selectedNode.label];
		 * addToBreadcrumb(selectedNode);
		 */
	} else if (e.altKey) {
		;
		scrollToCenter();
	} else {

		showInfos(selectedNode);

	}

}

function clickLink(event){
	var data=this.__data__;
	onLinkClick(data);
}

function drawTree(root){
	if (!d3tree)
		d3tree = new D3Tree2($("#graphDiv"));
	d3tree.drawTree(root);
}
// }
