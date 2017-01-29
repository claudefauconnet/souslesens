var myFlower;
var flowerHiddenNodes = {};
function drawFlower(json) {
    w = $("#graphDiv").width();
    h = $("#graphDiv").height() - 10;
    myFlower = new CodeFlower("#graphDiv", w, h);

    myFlower.update(json);
}


d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

var CodeFlower = function (selector, w, h) {


    this.w = w;
    this.h = h;
    this.isDragging = false;

   CodeFlower.imgOpacityWeak = 0.7
    CodeFlower.imgOpacityStrong = 1.0

    var graphParams=  Gparams.d3ForceParams;
    this.distance =  Gparams.d3ForceParams.distance*distCoef;
    var charge = {
        min: Gparams.d3ForceParams.charge,
        max: Gparams.d3ForceParams.charge
    };

    var distCoef = 1;
    if ($("#groupByLabelsCbx").prop("checked"))
        distCoef = 1;
    var linkDistance = {
        min:  Gparams.d3ForceParams.distance*distCoef,
        max:  Gparams.d3ForceParams.distance*distCoef

    }
    // this.gravity=   Math.atan(total / 50) / Math.PI * 0.4;  //Gparams.d3ForceParams.gravity;


    //Gparams.circleR=20;
    d3.select(selector).html("");
    d3.select(selector).selectAll("svg").remove();

    this.svg = d3.select(selector).append("svg:svg")
        .attr('width', w)
        .attr('height', h);

    this.svg.append("svg:rect")
        .style("stroke", "#999")
        .style("fill", "#fff")
        .attr('width', w)
        .attr('height', h);

    this.force = d3.layout.force()
        .on("tick", this.tick.bind(this))

        .linkDistance(function (d) {
            if (d.source && d.source.isRoot == true)
                return linkDistance.max/1.5;
            return linkDistance.min;

        })

        .charge(function (d) {
            if (d.source && d.source.isRoot == true)
                return charge.max;

            return charge.min;
        })


        .size([h, w]);
};


CodeFlower.prototype.update = function (json) {
    if (json) this.json = json;

    this.json.fixed = true;
    this.json.x = this.w / 2;
    this.json.y = this.h / 2;
    this.isDragging = false;
    var nodes = this.flatten(this.json);
    var links = d3.layout.tree().links(nodes);
    var total = nodes.length || 1;


    // remove existing text (will readd it afterwards to be sure it's on top)
    this.svg.selectAll("text").remove();

    // Restart the force layout
    this.force
        .gravity(Math.atan(total / 50) / Math.PI * 0.4)
        .nodes(nodes)
        .links(links)
        .start();


// sticky drag
    var drag = this.force.drag()
        .on("dragstart", dragstart)
        .on("dragend", function (d) {
            this.isDragging = true;
        });

    function dragstart(d) {
        hidePopupMenu()
        this.isDragging = false;
        d3.select(this).classed("fixed", d.fixed = true);
    }

    // Update the links
    this.link = this.svg.selectAll("line.link")
        .data(links, function (d) {
            return d.target.name;
        });


    this.link.enter().insert("svg:g", ".node")  .on("mouseover", function(d){
        hidePopupMenu();
    }).attr("class", "link");
    // Exit any old links.
    this.link.exit().remove();


    this.link.each(function (d) {
        var aLine = d3.select(this)

            .append("path").attr("id", "path_" + d.target.id).attr("d", function (d) {
                var ctlPoint = {
                    x: ((d.source.x + d.target.x) / 2 + Gparams.curveOffset),
                    y: ((d.source.y + d.target.y    ) / 2) + Gparams.curveOffset
                }
                var str = "M" + d.source.x + "," + d.source.y + " " + "C" + d.source.x + "," + d.source.y + " " + ctlPoint.x + "," + ctlPoint.y + " " + d.target.x + "," + d.target.y
                return str;
            })
            .on("click", function (d) {
                 currentRelation=d;
               dispatchAction('relationInfos');
            })
            .attr("stroke-width", Gparams.relStrokeWidth)
            .attr("stroke", "#65dbf1").attr("fill", "none")
            .attr("stroke", function (d) {
                if (d.target.decoration) {
                    if (d.target.decoration.color)
                        return d.target.decoration.color;
                    return "purple";
                }
                if (d.target.color)
                    return d.target.color;
                else
                    return nodeColors[d.target.label];

            })
            .style("opacity", function (d) {
                if (d.target.decoration)
                    return .6;
                return .6
            });

    });

    this.link.each(function (d) {
        if (Gparams.showRelationNames == false)
            return;
        if (d.source.shape == "textBox" || d.target.level > 2)
            return;
        var aLine = d3.select(this).append("text").attr("dy", -5)
            .append("textPath")
            .text(function (d) {
                if (d.target.relDir == "normal")
                    return d.target.relType + " ->";
                else
                    return "<- " + d.target.relType;
            })
            .attr("xlink:href", "#path_" + d.target.id)
            .attr("marker-end", "url(#arrowhead)")
            .style("text-anchor", "middle") // place the text halfway on the arc
            .attr("startOffset", "50%")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", function (d) {
                if (d.target.color)
                    return d.target.color;
                else
                    return nodeColors[d.target.label];

            })
            .style("opacity", function (d) {
                if (d.target.decoration)
                    return .4;
                return .6
            });

        ;

    });


    // Update the nodes
    this.node = this.svg.selectAll("circle.node")
        .data(nodes, function (d) {
            return d.name;
        })
        .classed("collapsed", function (d) {
            return d._children ? 1 : 0;
        });

    this.node.transition()
        .attr("r", function (d) {
            return d.children ? 3.5 : Math.pow(d.size, 2 / 5) || 1;
        });

    this.node.enter().append(
        "svg:g")// .on("dblclick", this.dblclickPoint).on("click", this.clickPoint)
        .call(drag)
        .attr("class", "node")
        .classed('directory', function (d) {
            return (d._children || d.children) ? 1 : 0;
        })
        .on("click", d3CommonClick)
        .on("dblclick", d3CommonDblclick)

        .on("mouseover", d3CommonMouseover)
        .on("mouseout",d3CommonMouseout)
      /*  .on("click", this.click.bind(this))
        .on("dblclick", this.dblclick.bind(this))

        .on("mouseover", this.mouseover.bind(this))
        .on("mouseout", this.mouseout.bind(this))*/
        .attr("class", "pointsRadar").attr("id", function (d) {
        return "P_" + d.id;
    });

    var imgData = [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].neoAttrs && nodes[i].neoAttrs.path) {
            imgData.push(nodes[i])
        }
    }


    this.node.each(function (d) {

        var anode = d3.select(this);
        var ashape;
        if (d.neoAttrs && d.neoAttrs.path && !/.*([0-9]{4})([0-9]{2})([0-9]{2})[A-Z]..*/.test(d.neoAttrs.path)) {

            anode.append("svg:image")
                .on("mouseover", function (d) {

                    d3.select(this).attr("width", 200).style('opacity', CodeFlower.imgOpacityStrong)
                        .attr("x", function (d) {
                            return -100
                        })
                        .attr("y", function (d) {
                            return -70
                        });
                    d3.select(this).moveToFront();
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("width", 60).style('opacity', CodeFlower.imgOpacityWeak)
                        .attr("x", function (d) {
                            return -30
                        })
                        .attr("y", function (d) {
                            return -25
                        });
                    d3.select(this).moveToBack();
                })
                .attr("xlink:href", function (d) {
                    //   console.log(d.neoAttrs.path);

                    //return "http://127.0.0.1:3002/JAVATHEQUE"+encodeURIComponent(d.neoAttrs.path);
                    return encodeURI(Gparams.imagesRootPath + d.neoAttrs.path);
                    //   return encodeURI(d.neoAttrs.path);

                })
                .attr("x", function (d) {
                    return -30
                })
                .attr("y", function (d) {
                    return -25
                })
                .attr("class", "d3NodeImage")
                .attr("width", "60")
        }

        if (d.shape && d.shape == "textBox") {
            shape = anode.append('rect')
                .attr("width", 10).attr("height", 10).attr("rx", 10).attr("ry", 10)
        }

        else {// if( d.shape=="circle" ){
            shape = anode.append('svg:circle')
                .attr("r", function (d) {
                    if (d.decoration && d.decoration.size)
                        return d.decoration.size;

                    if (d.hiddenChildren && d.hiddenChildren.length > 0)
                        return Gparams.circleR * 1.2;
                    if (d.isRoot == true)
                        return Gparams.circleR * 1.2;
                    if (d.level == null)
                        return Gparams.circleR / 1.5;

                    return Gparams.circleR / 1.5;
                })


        }
        shape.style("stroke", function (d) {
            if (d.level == 0 || d.isRoot == true)
                return "purple";
            return "000";
        })
        shape.style("stroke-width", function (d) {
            if (d.level == 0 || d.isRoot == true)
                return 4;
            return 1;
        })
            .style('fill-opacity', function (d) {
                if (d.isRoot == true)
                    return 1;
                if (d.shape == "textBox")
                    return 1;

                return 0.7;

            })
            .style("fill", function (d) {
                if (d.value == 2)
                    var xxx = "";
                if (d.decoration && d.decoration.color)
                    return d.decoration.color;
                if (d.color)
                    return d.color;
                return nodeColors[d.label];
                return "purple";
            })
            .style("opacity", function (d) {
                if (d.neoAttrs && d.neoAttrs.path)
                    return CodeFlower.imgOpacityWeak;
                return 1;
            })
            .attr("class", "shape");

        if (d.hiddenChildren && d.hiddenChildren.length > 0) {
            anode.append("text").attr("x", 0).attr("y", 5).text(function (d) {
                return d.hiddenChildren.length;
            }).attr("text-anchor", "middle").style("fill", "purple")
        }


        anode.append("text").attr("x", function (d) {
            if (d.level == null)
                return Gparams.circleR + 3;
            if (d.isRoot == true)
                return (Gparams.circleR * 2) + 3;
            if (d.shape == "textBox")
                return 0;// on recentre le rect ensuite;

            return (Gparams.circleR / (d.level * 2 / 3)) + 3;
        }).attr("dy", ".35em").attr('class', 'nodeText')
            .style("fill", function (d) {
                if (d.isRoot == true)
                    return "purple";
                return "#444";
            }).attr("text-anchor", function (d) {
            if (d.shape == "textBox")
                return "start";
            return "start";
        }).text(function (d) {
            var match = /_[0-9]*/.exec(d.name);
            if (match) {
                var p = match.index;
                if (p > -1)
                    return d.name.substring(0, p);
            }
            if (d.name && d.name.length > Gparams.nodeMaxTextLength)
                return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
            return d.name;
        }).style("fill-opacity", function (d) {
            if (d.decoration)
                return .8
            return .8
        })
            .style("font-weight", function (d) {
                if (d.shape == "textBox" || d.isRoot == true)
                    return "bold";
                return "normal";
            })

            .style("font-size", function (d) {
                if (d.shape == "textBox" || d.isRoot == true)
                    return "14px";
                return "12px";

            })

    });


    this.node.each(function (d) {
        if (d.shape == "textBox") {

            var bBox = d3.select(this).select("text").node().getBBox();
            d.width = bBox.width;
            d3.select(this).select("rect").attr("x", bBox.x - 5).attr("width", bBox.width + 10).attr("height", bBox.height + 10).attr("y", (-bBox.height + 2));
        }

    })


    this.text = this.svg.append('svg:text')
        .attr('class', 'nodetext')
        .attr('dy', 0)
        .attr('dx', 0)
        .attr('text-anchor', 'middle')
        .style("fill", "purple")

    return this;
}
;

CodeFlower.prototype.flatten = function (root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) {
            node.size = node.children.reduce(function (p, v) {
                return p + recurse(v);
            }, 0);
        }
        if (!node.id) node.id = ++i;
        nodes.push(node);
        return node.size;
    }

    root.size = recurse(root);
    return nodes;
};



CodeFlower.prototype.tick = function () {
    var h = this.h;
    var w = this.w;
// this.link.select("path").attr("d", function(d) { return
// "M"+d.source.x+","+d.source.y+ "L"+d.target.x+","+d.target.y});

    this.link.select("path").attr("d", function (d) {
        /* if(d.source.isRoot){
         d.source.x=200;
         d.source.y=200;
         }*/
        var ctlPoint = {
            x: ((d.source.x + d.target.x) / 2 + Gparams.curveOffset),
            y: ((d.source.y + d.target.y) / 2) + Gparams.curveOffset
        }
        var str = "M" + d.source.x + "," + d.source.y + " " + "C" + d.source.x + "," + d.source.y + " " + ctlPoint.x + "," + ctlPoint.y + " " + d.target.x + "," + d.target.y

        // console.log(str);
        return str;
    });

    /*
     * this.link.attr("x1", function(d) { return d.source.x; }) .attr("y1",
     * function(d) { return d.source.y; }) .attr("x2", function(d) { return
     * d.target.x; }) .attr("y2", function(d) { return d.target.y; });
     */


    this.node.attr("transform", function (d) {
        /*  if(d.isRoot){
         d.x=200;
         d.y=200;
         }*/
        return "translate(" + Math.max(5, Math.min(w - 5, d.x - (d.width ? d.width / 2 : 0))) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
    });
};

CodeFlower.prototype.cleanup = function () {
    this.update([]);
    this.force.stop();
};


CodeFlower.prototype.hideNodesWithLabel = function (label) {

    var labels = this.json.children;
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].name == label) {
            flowerHiddenNodes[label] = labels[i].children;
            this.json.children[i].children = [];
        }
    }
    drawFlower(this.json);

}

CodeFlower.prototype.showNodesWithLabel = function (label) {
    var labels = this.json.children;
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].name == label) {

            this.json.children[i].children = flowerHiddenNodes[label];
            delete flowerHiddenNodes[label];
        }
    }
    drawFlower(this.json);


}


