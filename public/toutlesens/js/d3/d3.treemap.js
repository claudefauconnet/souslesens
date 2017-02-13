function testTreemap(jsonTree) {
    setTreMapValues(jsonTree);
    drawTreeMpap(jsonTree);
    //  drawTreeMpap(flareTreemapJson);
}


function setTreMapValues(jsonTree, valueField) {
    function recurse(node) {
        node = formatNode(node);
        if (node.children && node.children.length > 0) {
            if (valueField && node.neoAttrs  && node.neoAttrs)
                node.value = node.neoAttrs[valueField];
            else
                node.value = node.children.length * 1;
            for (var i = 0; i < node.children.length; i++) {
                recurse(node.children[i]);
            }
        }
        else {
            if ( node.children  && node.children.length == 0)
                delete (node.children);
            if (valueField && node.neoAttrs && node.neoAttrs[valueField])
                node.value = node.neoAttrs[valueField];
            else
                node.value = 1;
        }

    }
    var valueField;
if(jsonTree.valueField)
    valueField=jsonTree.valueField
    recurse(jsonTree,valueField);


}


function drawTreeMpap(root) {
    var margin = {top: 20, right: 0, bottom: 0, left: 0},
        width = 960,
        height = 500 - margin.top - margin.bottom,
        formatNumber = d3.format(",d"),
        transitioning;

    var width = $("#graphDiv").width() - 50;
    var height = $("#graphDiv").height() - 50;

    var x = d3.scale.linear()
        .domain([0, width])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, height])
        .range([0, height]);

    var treemap = d3.layout.treemap()
        .children(function (d, depth) {
            return depth ? null : d._children;
        })
        .sort(function (a, b) {
            return a.value - b.value;
        })
        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
        .round(false);

    d3.select("#graphDiv").selectAll("svg").remove();
    var svg = d3.select("#graphDiv").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .style("margin-left", -margin.left + "px")
        .style("margin.right", -margin.right + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");

    var grandparent = svg.append("g")
        .attr("class", "grandparent");

    grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top);

    grandparent.append("text")
        .attr("x", 6)
        .attr("y", 6 - margin.top)
        .attr("dy", ".75em");


    initialize(root);
    accumulate(root);
    layout(root);
    display(root);

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
        return (d._children = d.children)
            ? d.value = d.children.reduce(function (p, v) {
                return p + accumulate(v);
            }, 0)
            : d.value;
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
            treemap.nodes({_children: d._children});
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
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        var g1 = svg.insert("g", ".grandparent")
                .datum(d)
                .attr("class", "depth")

            ;

        var g = g1.selectAll("g")
            .data(d._children)
            .enter().append("g")
           // .on("click", d3CommonMouseover)
             .on("mouseover", d3CommonMouseover)
          //  .on("out", d3CommonMouseout)

        g.filter(function (d) {
            return d._children;
        })
            .classed("children", true)
            .on("click", transition);

        g.selectAll(".child")
            .data(function (d) {
                return d._children || [d];
            })

            .enter().append("rect")

            .attr("class", "child")
            .style("fill", function (d) {
                return nodeColors[d.label]
            })

            .call(rect);


        g.append("rect")
            .style("fill", function (d) {
                return nodeColors[d.label]
            })
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d) {
                return "";//formatNumber(d.value);
            });

      /*  g.append("text")
            .attr("dy", ".75em")
            .text(function (d) {
                return  d.name;
            })
            .call(text);*/

       var g = g1.selectAll("g").each(function(d){

           appendSplitText(this,d.name,18);


        });

        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;

            var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

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
            g2.selectAll("text").style("fill-opacity", 0.5);

            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0.5);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function () {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
            });
        }

        return g;
    }

    function text(text) {
        text.attr("x", function (d) {
            return x(d.x) + 6;
        })
            .attr("y", function (d) {
                return y(d.y) + 6;
            });
    }

    function rect(rect) {
        rect.attr("x", function (d) {
            return x(d.x);
        })
            .attr("y", function (d) {
                return y(d.y);
            })
            .attr("width", function (d) {
                return x(d.x + d.dx) - x(d.x);
            })
            .attr("height", function (d) {
                return y(d.y + d.dy) - y(d.y);
            });
    }

    function name(d) {
        return d.parent
            ? name(d.parent) + "." + d.name
            : d.name;
    }

}


var flareTreemapJson = {
    "name": "flare",
    "children": [
        {
            "name": "analytics",
            "children": [
                {
                    "name": "cluster",
                    "children": [
                        {"name": "AgglomerativeCluster", "value": 3938},
                        {"name": "CommunityStructure", "value": 3812},
                        {"name": "HierarchicalCluster", "value": 6714},
                        {"name": "MergeEdge", "value": 743}
                    ]
                },
                {
                    "name": "graph",
                    "children": [
                        {"name": "BetweennessCentrality", "value": 3534},
                        {"name": "LinkDistance", "value": 5731},
                        {"name": "MaxFlowMinCut", "value": 7840},
                        {"name": "ShortestPaths", "value": 5914},
                        {"name": "SpanningTree", "value": 3416}
                    ]
                },
                {
                    "name": "optimization",
                    "children": [
                        {"name": "AspectRatioBanker", "value": 7074}
                    ]
                }
            ]
        },
        {
            "name": "animate",
            "children": [
                {"name": "Easing", "value": 17010},
                {"name": "FunctionSequence", "value": 5842},
                {
                    "name": "interpolate",
                    "children": [
                        {"name": "ArrayInterpolator", "value": 1983},
                        {"name": "ColorInterpolator", "value": 2047},
                        {"name": "DateInterpolator", "value": 1375},
                        {"name": "Interpolator", "value": 8746},
                        {"name": "MatrixInterpolator", "value": 2202},
                        {"name": "NumberInterpolator", "value": 1382},
                        {"name": "ObjectInterpolator", "value": 1629},
                        {"name": "PointInterpolator", "value": 1675},
                        {"name": "RectangleInterpolator", "value": 2042}
                    ]
                },
                {"name": "ISchedulable", "value": 1041},
                {"name": "Parallel", "value": 5176},
                {"name": "Pause", "value": 449},
                {"name": "Scheduler", "value": 5593},
                {"name": "Sequence", "value": 5534},
                {"name": "Transition", "value": 9201},
                {"name": "Transitioner", "value": 19975},
                {"name": "TransitionEvent", "value": 1116},
                {"name": "Tween", "value": 6006}
            ]
        },
        {
            "name": "data",
            "children": [
                {
                    "name": "converters",
                    "children": [
                        {"name": "Converters", "value": 721},
                        {"name": "DelimitedTextConverter", "value": 4294},
                        {"name": "GraphMLConverter", "value": 9800},
                        {"name": "IDataConverter", "value": 1314},
                        {"name": "JSONConverter", "value": 2220}
                    ]
                },
                {"name": "DataField", "value": 1759},
                {"name": "DataSchema", "value": 2165},
                {"name": "DataSet", "value": 586},
                {"name": "DataSource", "value": 3331},
                {"name": "DataTable", "value": 772},
                {"name": "DataUtil", "value": 3322}
            ]
        },
        {
            "name": "display",
            "children": [
                {"name": "DirtySprite", "value": 8833},
                {"name": "LineSprite", "value": 1732},
                {"name": "RectSprite", "value": 3623},
                {"name": "TextSprite", "value": 10066}
            ]
        },
        {
            "name": "flex",
            "children": [
                {"name": "FlareVis", "value": 4116}
            ]
        },
        {
            "name": "physics",
            "children": [
                {"name": "DragForce", "value": 1082},
                {"name": "GravityForce", "value": 1336},
                {"name": "IForce", "value": 319},
                {"name": "NBodyForce", "value": 10498},
                {"name": "Particle", "value": 2822},
                {"name": "Simulation", "value": 9983},
                {"name": "Spring", "value": 2213},
                {"name": "SpringForce", "value": 1681}
            ]
        },
        {
            "name": "query",
            "children": [
                {"name": "AggregateExpression", "value": 1616},
                {"name": "And", "value": 1027},
                {"name": "Arithmetic", "value": 3891},
                {"name": "Average", "value": 891},
                {"name": "BinaryExpression", "value": 2893},
                {"name": "Comparison", "value": 5103},
                {"name": "CompositeExpression", "value": 3677},
                {"name": "Count", "value": 781},
                {"name": "DateUtil", "value": 4141},
                {"name": "Distinct", "value": 933},
                {"name": "Expression", "value": 5130},
                {"name": "ExpressionIterator", "value": 3617},
                {"name": "Fn", "value": 3240},
                {"name": "If", "value": 2732},
                {"name": "IsA", "value": 2039},
                {"name": "Literal", "value": 1214},
                {"name": "Match", "value": 3748},
                {"name": "Maximum", "value": 843},
                {
                    "name": "methods",
                    "children": [
                        {"name": "add", "value": 593},
                        {"name": "and", "value": 330},
                        {"name": "average", "value": 287},
                        {"name": "count", "value": 277},
                        {"name": "distinct", "value": 292},
                        {"name": "div", "value": 595},
                        {"name": "eq", "value": 594},
                        {"name": "fn", "value": 460},
                        {"name": "gt", "value": 603},
                        {"name": "gte", "value": 625},
                        {"name": "iff", "value": 748},
                        {"name": "isa", "value": 461},
                        {"name": "lt", "value": 597},
                        {"name": "lte", "value": 619},
                        {"name": "max", "value": 283},
                        {"name": "min", "value": 283},
                        {"name": "mod", "value": 591},
                        {"name": "mul", "value": 603},
                        {"name": "neq", "value": 599},
                        {"name": "not", "value": 386},
                        {"name": "or", "value": 323},
                        {"name": "orderby", "value": 307},
                        {"name": "range", "value": 772},
                        {"name": "select", "value": 296},
                        {"name": "stddev", "value": 363},
                        {"name": "sub", "value": 600},
                        {"name": "sum", "value": 280},
                        {"name": "update", "value": 307},
                        {"name": "variance", "value": 335},
                        {"name": "where", "value": 299},
                        {"name": "xor", "value": 354},
                        {"name": "_", "value": 264}
                    ]
                },
                {"name": "Minimum", "value": 843},
                {"name": "Not", "value": 1554},
                {"name": "Or", "value": 970},
                {"name": "Query", "value": 13896},
                {"name": "Range", "value": 1594},
                {"name": "StringUtil", "value": 4130},
                {"name": "Sum", "value": 791},
                {"name": "Variable", "value": 1124},
                {"name": "Variance", "value": 1876},
                {"name": "Xor", "value": 1101}
            ]
        },
        {
            "name": "scale",
            "children": [
                {"name": "IScaleMap", "value": 2105},
                {"name": "LinearScale", "value": 1316},
                {"name": "LogScale", "value": 3151},
                {"name": "OrdinalScale", "value": 3770},
                {"name": "QuantileScale", "value": 2435},
                {"name": "QuantitativeScale", "value": 4839},
                {"name": "RootScale", "value": 1756},
                {"name": "Scale", "value": 4268},
                {"name": "ScaleType", "value": 1821},
                {"name": "TimeScale", "value": 5833}
            ]
        },
        {
            "name": "util",
            "children": [
                {"name": "Arrays", "value": 8258},
                {"name": "Colors", "value": 10001},
                {"name": "Dates", "value": 8217},
                {"name": "Displays", "value": 12555},
                {"name": "Filter", "value": 2324},
                {"name": "Geometry", "value": 10993},
                {
                    "name": "heap",
                    "children": [
                        {"name": "FibonacciHeap", "value": 9354},
                        {"name": "HeapNode", "value": 1233}
                    ]
                },
                {"name": "IEvaluable", "value": 335},
                {"name": "IPredicate", "value": 383},
                {"name": "IValueProxy", "value": 874},
                {
                    "name": "math",
                    "children": [
                        {"name": "DenseMatrix", "value": 3165},
                        {"name": "IMatrix", "value": 2815},
                        {"name": "SparseMatrix", "value": 3366}
                    ]
                },
                {"name": "Maths", "value": 17705},
                {"name": "Orientation", "value": 1486},
                {
                    "name": "palette",
                    "children": [
                        {"name": "ColorPalette", "value": 6367},
                        {"name": "Palette", "value": 1229},
                        {"name": "ShapePalette", "value": 2059},
                        {"name": "SizePalette", "value": 2291}
                    ]
                },
                {"name": "Property", "value": 5559},
                {"name": "Shapes", "value": 19118},
                {"name": "Sort", "value": 6887},
                {"name": "Stats", "value": 6557},
                {"name": "Strings", "value": 22026}
            ]
        },
        {
            "name": "vis",
            "children": [
                {
                    "name": "axis",
                    "children": [
                        {"name": "Axes", "value": 1302},
                        {"name": "Axis", "value": 24593},
                        {"name": "AxisGridLine", "value": 652},
                        {"name": "AxisLabel", "value": 636},
                        {"name": "CartesianAxes", "value": 6703}
                    ]
                },
                {
                    "name": "controls",
                    "children": [
                        {"name": "AnchorControl", "value": 2138},
                        {"name": "ClickControl", "value": 3824},
                        {"name": "Control", "value": 1353},
                        {"name": "ControlList", "value": 4665},
                        {"name": "DragControl", "value": 2649},
                        {"name": "ExpandControl", "value": 2832},
                        {"name": "HoverControl", "value": 4896},
                        {"name": "IControl", "value": 763},
                        {"name": "PanZoomControl", "value": 5222},
                        {"name": "SelectionControl", "value": 7862},
                        {"name": "TooltipControl", "value": 8435}
                    ]
                },
                {
                    "name": "data",
                    "children": [
                        {"name": "Data", "value": 20544},
                        {"name": "DataList", "value": 19788},
                        {"name": "DataSprite", "value": 10349},
                        {"name": "EdgeSprite", "value": 3301},
                        {"name": "NodeSprite", "value": 19382},
                        {
                            "name": "render",
                            "children": [
                                {"name": "ArrowType", "value": 698},
                                {"name": "EdgeRenderer", "value": 5569},
                                {"name": "IRenderer", "value": 353},
                                {"name": "ShapeRenderer", "value": 2247}
                            ]
                        },
                        {"name": "ScaleBinding", "value": 11275},
                        {"name": "Tree", "value": 7147},
                        {"name": "TreeBuilder", "value": 9930}
                    ]
                },
                {
                    "name": "events",
                    "children": [
                        {"name": "DataEvent", "value": 2313},
                        {"name": "SelectionEvent", "value": 1880},
                        {"name": "TooltipEvent", "value": 1701},
                        {"name": "VisualizationEvent", "value": 1117}
                    ]
                },
                {
                    "name": "legend",
                    "children": [
                        {"name": "Legend", "value": 20859},
                        {"name": "LegendItem", "value": 4614},
                        {"name": "LegendRange", "value": 10530}
                    ]
                },
                {
                    "name": "operator",
                    "children": [
                        {
                            "name": "distortion",
                            "children": [
                                {"name": "BifocalDistortion", "value": 4461},
                                {"name": "Distortion", "value": 6314},
                                {"name": "FisheyeDistortion", "value": 3444}
                            ]
                        },
                        {
                            "name": "encoder",
                            "children": [
                                {"name": "ColorEncoder", "value": 3179},
                                {"name": "Encoder", "value": 4060},
                                {"name": "PropertyEncoder", "value": 4138},
                                {"name": "ShapeEncoder", "value": 1690},
                                {"name": "SizeEncoder", "value": 1830}
                            ]
                        },
                        {
                            "name": "filter",
                            "children": [
                                {"name": "FisheyeTreeFilter", "value": 5219},
                                {"name": "GraphDistanceFilter", "value": 3165},
                                {"name": "VisibilityFilter", "value": 3509}
                            ]
                        },
                        {"name": "IOperator", "value": 1286},
                        {
                            "name": "label",
                            "children": [
                                {"name": "Labeler", "value": 9956},
                                {"name": "RadialLabeler", "value": 3899},
                                {"name": "StackedAreaLabeler", "value": 3202}
                            ]
                        },
                        {
                            "name": "layout",
                            "children": [
                                {"name": "AxisLayout", "value": 6725},
                                {"name": "BundledEdgeRouter", "value": 3727},
                                {"name": "CircleLayout", "value": 9317},
                                {"name": "CirclePackingLayout", "value": 12003},
                                {"name": "DendrogramLayout", "value": 4853},
                                {"name": "ForceDirectedLayout", "value": 8411},
                                {"name": "IcicleTreeLayout", "value": 4864},
                                {"name": "IndentedTreeLayout", "value": 3174},
                                {"name": "Layout", "value": 7881},
                                {"name": "NodeLinkTreeLayout", "value": 12870},
                                {"name": "PieLayout", "value": 2728},
                                {"name": "RadialTreeLayout", "value": 12348},
                                {"name": "RandomLayout", "value": 870},
                                {"name": "StackedAreaLayout", "value": 9121},
                                {"name": "TreeMapLayout", "value": 9191}
                            ]
                        },
                        {"name": "Operator", "value": 2490},
                        {"name": "OperatorList", "value": 5248},
                        {"name": "OperatorSequence", "value": 4190},
                        {"name": "OperatorSwitch", "value": 2581},
                        {"name": "SortOperator", "value": 2023}
                    ]
                },
                {"name": "Visualization", "value": 16540}
            ]
        }
    ]
}