/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
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
var d3treemap = (function () {
    var self = {};

    var width = null;
    var height =null;
    var treeMap=null;
    var grandparent;
    var svg;
    var x;
    var y;
    var transitioning;
    var margin = {top: 20, right: 0, bottom: 0, left: 0};
    var formatNumber = d3.format(",d");

    self.draw = function (jsonTree) {
        self.setTreMapValues(jsonTree);
        var root=jsonTree

        self.drawTreeMpap(jsonTree);
        //  drawTreeMpap(flareTreemapJson);
    }


    self.setTreMapValues = function (jsonTree, valueField) {
        function recurse(node) {
            textOutputs.formatNode(node);
            if (node.children && node.children.length > 0) {
                if (valueField && node.neoAttrs && node.neoAttrs)
                    node.value = node.neoAttrs[valueField];
                else
                    node.value = node.children.length * 1;
                for (var i = 0; i < node.children.length; i++) {
                    recurse(node.children[i]);
                }
            }
            else {
                if (node.children && node.children.length == 0)
                    delete (node.children);
                if (valueField && node.neoAttrs && node.neoAttrs[valueField])
                    node.value = node.neoAttrs[valueField];
                else
                    node.value = 1;
            }

        }

        var valueField;
        if (jsonTree.valueField)
            valueField = jsonTree.valueField
        recurse(jsonTree, valueField);


    }


    self.drawTreeMpap = function (root) {
        $("#graphDiv").html("");
        $("canvas").remove()
         width = $("#graphDiv").width() - 50;
         height = $("#graphDiv").height() - 50;





         x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

       y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);

         treemap = d3.layout.treemap()
            .children(function (d, depth) {
                return depth ? null : d._children;
            })
            .sort(function (a, b) {
                return a.value - b.value;
            })
            .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
            .round(false);

        d3.select("#graphDiv").selectAll("svg").remove();
        svg = d3.select("#graphDiv").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

        grandparent = svg.append("g")
            .attr("class", "grandparent");

        grandparent.append("rect")
            .attr("y", -margin.top)
            .attr("width", width)
            .attr("height", margin.top);

        grandparent.append("text")
            .attr("x", 6)
            .attr("y", 6 - margin.top)
            .attr("dy", ".75em");

        self.initialize(root);
        self.accumulate(root);
        self.layout(root);
        self.display(root);

    }

        self.initialize = function (root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
            root.depth = 0;
        }

        // Aggregate the values for internal nodes. This is normally done by the
        // treemap layout, but not here because of our custom implementation.
        // We also take a snapshot of the original children (_children) to avoid
        // the children being overwritten when when layout is computed.
        self.accumulate = function (d) {
            return (d._children = d.children)
                ? d.value = d.children.reduce(function (p, v) {
                    self.accumulate(v);
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
        self.layout = function (d) {
            if (d._children) {
                treemap.nodes({_children: d._children});
                d._children.forEach(function (c) {
                    c.x = d.x + c.x * d.dx;
                    c.y = d.y + c.y * d.dy;
                    c.dx *= d.dx;
                    c.dy *= d.dy;
                    c.parent = d;
                    self.layout(c);
                });
            }
        }

        self.display = function (d) {
            grandparent
                .datum(d.parent)
                .on("click", self.transition)
                .select("text")
                .text(self.name(d));

            var g1 = svg.insert("g", ".grandparent")
                .datum(d)
                .attr("class", "depth")

            ;

            var g = g1.selectAll("g")
                .data(d._children)
                .enter().append("g")
                // .on("click", d3CommonMouseover)
                .on("mouseover", d3common.d3CommonMouseover)
            //  .on("out", d3CommonMouseout)

            g.filter(function (d) {
                return d._children;
            })
                .classed("children", true)
                .on("click", self.transition);

            g.selectAll(".child")
                .data(function (d) {
                    return d._children || [d];
                })

                .enter().append("rect")

                .attr("class", "child")
                .style("fill", function (d) {
                    return nodeColors[d.label]
                })

                .call(self.rect);


            g.append("rect")
                .style("fill", function (d) {
                    return nodeColors[d.label]
                })
                .attr("class", "parent")
                .call(self.rect)
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

            var g = g1.selectAll("g").each(function (d) {

                d3common.appendSplitText(this, d.name, 18);


            });

            self.transition = function (d) {
                if (transitioning || !d) return;
                transitioning = true;

                self.display(d),
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
                t1.selectAll("rect").call(self.rect);
                t2.selectAll("rect").call(self.rect);

                // Remove the old node when the transition is finished.
                t1.remove().each("end", function () {
                    svg.style("shape-rendering", "crispEdges");
                    transitioning = false;
                });
            }

            return g;
        }

        self.text = function (text) {
            text.attr("x", function (d) {
                return x(d.x) + 6;
            })
                .attr("y", function (d) {
                    return y(d.y) + 6;
                });
        }

        self.rect = function (rect) {
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

        self.name = function (d) {
            return d.parent
                ? self.name(d.parent) + "." + d.name
                : d.name;
        }






    return self;
})()