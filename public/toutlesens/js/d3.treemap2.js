var treeMap = (function () {
    var self = {};
    var treeJson;
    var maxTextLength=20;


    function formatNodeInfoForTspan(node) {
        /*  var str = "";
          var excludedKeys = ["color"];
          for (var key in node) {
              if (!($.isPlainObject(node[key]) || $.isArray(node[key])))
                  if (excludedKeys.indexOf(key) < 0)
                      str += key + "->" + node[key] + " "
          }
          var maxLength = 20;
          if (str.length > maxLength)
              str = str.substring(0, maxLength);*/
        var node2 = {};
        if (node.neoAttrs)
            node2 = node.neoAttrs;
        node2.label = node.label;
        node2.name = node[Schema.getNameProperty()];
        node2.id = node.id;
        //  return {label: node.label, name: node[Schema.getNameProperty()], id: node.id};
        return node2;
    }

    function formatTreemapData(treeJson) {

        function recurse(node, treeMapNode) {
            var nodeData = formatNodeInfoForTspan(node);
            var name=node.name;
            if(!name)
                name="";
            var treemapChild = {
                key: name,
                neoAttrs: nodeData
            }

            if (node.children && node.children.length > 0) {
                treemapChild.values = [];
                for (var i = 0; i < node.children.length; i++) {

                    recurse(node.children[i], treemapChild);
                }

            } else {
                treemapChild.value = 1;

            }
            treeMapNode.values.push(treemapChild);

        }

        var treemapJson = {
            key: "",
            values: [],
            parent:""
        };
        recurse(treeJson, treemapJson);
//	console.log(JSON.stringify(treemapJson.values));
        return treemapJson.values;

    }

    var treeMapTestData = [{
        "key": "Asia",
        "values": [{
            "key": "India",
            "value": 1236670000
        }, {
            "key": "China",
            "value": 1361170000
        }],
    }, {
        "key": "Africa",
        "values": [{
            "key": "Nigeria",
            "value": 173615000
        }, {
            "key": "Egypt",
            "value": 83661000
        },]
    },]

    var treeMapTestData2 = [{
        "key": "[Dieu] Apollon",
        "values": [{
            "key": "Groupe_10",
            "values": [{
                "key": "Mythologie grecque_2",
                "value": 1
            }, {
                "key": "Mythologie romaine_2",
                "value": 1
            }]
        }, {
            "key": "Oeuvre_20",
            "values": [{
                "key": "Temple de Zeus à Olympie_2",
                "value": 1
            }, {
                "key": "Parthénon_2",
                "value": 1
            }, {
                "key": "Premier temple d Apollon à Rome_2",
                "value": 1
            }]
        }]
    }];
    self.draw = function (err, query) {


        var divId = "graphDiv"
        $("#" + divId).html("<br><br><br>");


        toutlesensData.cachedResultArray = null;

        toutlesensData.getNodeAllRelations(null, {}, function (err, json) {
            filters.init(json);
            paint.initHighlight(json);
            treeJson = toutlesensData.flatResultToTree(json);
            treeJson = formatTreemapData(treeJson);
            //   console.log(JSON.stringify(treeJson,null,2))
            //  treeJson = treeMapTestData2;
            var o = {
                title: "treeMap"
            };

            var width = $("#graphDiv").width();
            var height = $("#graphDiv").height();
            var defaults = {
                margin: {
                    top: 24,
                    right: 0,
                    bottom: 0,
                    left: 0
                },
                rootname: "TOP",
                format: ",d",
                title: "",
                width: width,
                height: height,
            };
            var opts = {
                format: defaults.format,
                rname: defaults.rname,
                margin: defaults.margin,

            }
            var data = d3.nest().key(function (d) {
                return d.key;
            }).key(function (d) {
                return d.key;
            }).entries(treeJson);
            var data = treeJson;
            var root, opts = $.extend(true, {}, defaults, o), formatNumber = d3
                .format(opts.format), rname = opts.rootname, margin = opts.margin, theight = 36 + 16;
//	root.label.treeJson.label;
            d3.selectAll("svg").remove();
            $('#graphDiv').width(opts.width).height(opts.height);
            var width = opts.width - margin.left - margin.right, height = opts.height
                - margin.top - margin.bottom - theight, transitioning;

            var color = d3.scale.category20c();

            var x = d3.scale.linear().domain([0, width]).range([0, width]);

            var y = d3.scale.linear().domain([0, height]).range([0, height]);

            var treemap = d3.layout.treemap().children(function (d, depth) {
                return depth ? null : d._children;
            }).sort(function (a, b) {
                return a.value - b.value;
            }).ratio(height / width * 0.5 * (1 + Math.sqrt(5))).round(false);

            var svg = d3.select("#" + divId).append("svg").attr("width",
                width + margin.left + margin.right).attr("height",
                height + margin.bottom + margin.top).style("margin-left",
                -margin.left + "px").style("margin.right", -margin.right + "px")
                .append("g").attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")").style(
                    "shape-rendering", "crispEdges");

            var grandparent = svg.append("g").attr("class", "grandparent");

            grandparent.append("rect").attr("y", -margin.top).attr("width", width)
                .attr("height", margin.top);

            grandparent.append("text").attr("x", 6).attr("y", 6 - margin.top).attr(
                "dy", ".75em");

            if (opts.title) {
                $("#chart").prepend("<p class='title'>" + opts.title + "</p>");
            }
            if (data instanceof Array) {
                root = {
                    key: treeJson.key,
                    values: data,
                    neoAttrs: ""
                };
            } else {
                root = data;
            }

            initialize(root);
            accumulate(root);
            layout(root);
            console.log(root);
            display(root);

            if (window.parent !== window) {
                var myheight = document.documentElement.scrollHeight
                    || document.body.scrollHeight;
                window.parent.postMessage({
                    height: myheight
                }, '*');
            }

            function initialize(root) {
                root.x = root.y = 0;
                root.dx = width;
                root.dy = height;
                root.depth = 0;
            }

            // Aggregate the values for internal nodes. This is normally done by the
            // treemap layout, but not here because of our custom implementation.
            // We also take a snapshot of the original children (_children) to avoid
            // the children being overwritten when when layout is computed.
            function accumulate(d) {
                return (d._children = d.values) ? d.value = d.values.reduce(function (p,
                                                                                      v) {
                    return p + accumulate(v);
                }, 0) : d.value;
            }

            // Compute the treemap layout recursively such that each group of siblings
            // uses the same size (1×1) rather than the dimensions of the parent cell.
            // This optimizes the layout for the current zoom state. Note that a wrapper
            // object is created for the parent node for each group of siblings so that
            // the parent’s dimensions are not discarded as we recurse. Since each group
            // of sibling was laid out in 1×1, we must rescale to fit using absolute
            // coordinates. This lets us use a viewport to zoom.
            function layout(d) {
                if (d._children) {
                    treemap.nodes({
                        _children: d._children
                    });
                    d._children.forEach(function (c) {
                        c.x = d.x + c.x * d.dx;
                        c.y = d.y + c.y * d.dy;
                        c.dx *= d.dx;
                        c.dy *= d.dy;
                        c.parent = d;
                        layout(c);
                    });
                }
            }

            function display(d) {
                grandparent.datum(d.parent).on("click", transition).select("text")
                    .text(name(d));

                var g1 = svg.insert("g", ".grandparent").datum(d)
                    .attr("class", "depth");

                var g = g1.selectAll("g").data(d._children).enter().append("g").attr("id", function (d) {
                    return "G1_" + d.neoAttrs.id;
                }).attr("class", "leafGroup1");;

                g.filter(function (d) {
                    return d._children;
                }).classed("children", true).on("click", transition);

                var children = g.selectAll(".child").data(function (d) {
                    return d._children || [d];
                }).enter().append("g").attr("id", function (d) {
                    return "G_" + d.neoAttrs.id;
                }).attr("class", "leafGroup");

                children.append("rect").attr("class", "child").call(rect).append(
                    "title").text(function (d) {
                    return d.key + " (" + formatNumber(d.value) + ")";
                });
                children.append("text").attr("class", "ctext").text(function (d) {
                    return d.key;
                }).call(text2);

                g.append("rect").attr("id", function (d) {
                    return "R_" + d.neoAttrs.id;
                }).attr("class", "leafRect").style("opacity",0.3).style("stroke-width",5)
                    .attr("class", "parent").call(rect).on("click", function (d) {
                    if (!d._children || d._children.length == 0) {
                        currentObject = {id: d.neoAttrs.id};
                        var px = d3.event.clientX;
                        var py = d3.event.clientY;

                        currentLabel = null;
                        toutlesensData.cachedResultArray = [];
                        toutlesensController.dispatchAction("nodeInfos", currentObject.id);
                        toutlesensController.showPopupMenu(px, py, "nodeInfo");

                    }

                });

                var t = g.append("text").attr("class", "ptext").attr("dy", ".75em").style("fill","blue").text(function (d) {

                    var str=d.key;
                    if(d.key.length>maxTextLength)
                        str=d.key.substring(0,maxTextLength)+"...";
                    return str;
                });


               // t.call(text);

                g.selectAll("rect").style("fill", function (d) {
                    if (d.neoAttrs && d.neoAttrs.label) {
                        var color = nodeColors[d.neoAttrs.label];
                        if (color)
                            return color;
                    }
                    return "grey";
                    //return color(d.key);
                }).style("stroke", "black")
                    .style("font-size", "8px");

                function transition(d) {
                    if (transitioning || !d)
                        return;
                    transitioning = true;

                    var g2 = display(d), t1 = g1.transition().duration(750), t2 = g2
                        .transition().duration(750);

                    // Update the domain only after entering new elements.
                    x.domain([d.x, d.x + d.dx]);
                    y.domain([d.y, d.y + d.dy]);

                    // Enable anti-aliasing during the transition.
                    svg.style("shape-rendering", null);

                    // Draw child nodes on top of parent nodes.
                    svg.selectAll(".depth").sort(function (a, b) {
                        return a.depth - b.depth;
                    });

                    // Fade-in entering text.
                    g2.selectAll("text").style("fill-opacity", 0);

                    // Transition to the new view.
                    t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
                    t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
                    t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
                    t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
                    t1.selectAll("rect").call(rect);
                    t2.selectAll("rect").call(rect);

                    // Remove the old node when the transition is finished.
                    if (false && t1 && t1.remove) {
                        t1.remove().each("end", function () {
                            svg.style("shape-rendering", "crispEdges");
                            transitioning = false;
                        });
                    } else
                        transitioning = false;
                }

                return g;
            }

            function text(text) {
                text.selectAll("tspan").attr("x", function (d) {
                    return x(d.x) + 6;
                })
                text.attr("x", function (d) {
                    return x(d.x) + 6;
                }).attr("y", function (d) {
                    return y(d.y) + 6;
                }).style(
                    "opacity",
                    function (d) {
                        return this.getComputedTextLength() < x(d.x + d.dx)
                        - x(d.x) ? 1 : 0;
                    });
            }

            function text2(text) {
                text.attr("x", function (d) {
                    return x(d.x + d.dx) - this.getComputedTextLength() - 6;
                }).attr("y", function (d) {
                    return y(d.y + d.dy) - 6;
                }).style(
                    "opacity",
                    function (d) {
                        return this.getComputedTextLength() < x(d.x + d.dx)
                        - x(d.x) ? 1 : 0;
                    });
            }

            function rect(rect) {
                rect.attr("x", function (d) {
                    return x(d.x);
                }).attr("y", function (d) {
                    return y(d.y);
                }).attr("width", function (d) {
                    return x(d.x + d.dx) - x(d.x);
                }).attr("height", function (d) {
                    return y(d.y + d.dy) - y(d.y);
                });
            }

            function name(d) {
                if( !d.key)
                    d.key=""
                return d.parent ? name(d.parent) + " / " + d.key + " ("
                    + formatNumber(d.value) + ")" : d.key + " ("
                    + formatNumber(d.value) + ")";
            }


        })
    }
    return self;
})()
