var d3graphCreation = (function () {
        var self = {};

        var self = {};
        self.graphDiv = "#graphDiv";
        var svgGraph = null;
        var nodes = {};
        var relations = {};
        var svgInited=false;


        var getNewId = function () {
            return Math.round(Math.random() * 10000000);
        }

        var lineFunction = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("linear");


        self.initGraph = function (graphDiv, force) {
            if (graphDiv)
                self.graphDiv = graphDiv;

            if (svgInited  && !force)
                return;

            svgInited=true;

            $(self.graphDiv).html("");
            var w = $(self.graphDiv).width();
            var h = $(self.graphDiv).height();
            var svgX = $(self.graphDiv).position().x;
            var svgY = $(self.graphDiv).position().y;
            d3.select("svg").selectAll("*").remove();
            svgGraph = d3.select(self.graphDiv).append("svg").attr("width", w).attr(
                "height", h);


        }


        self.addRelation = function (sourceNode, targetNode, type) {
            self.initGraph()
            var id = getNewId();
            relations[id] = {source: sourceNode, target: targetNode, type: type, attrs: {}};
            var link = svgGraph.selectAll(".link").append("svg:g", "link").attr("id", function (d) {
                return "L_" + id;
            }).on("click", function (d) {
                // overPath(d);
            })

            var path = [
                {x: sourceNode.x + (sourceNode.w / 2), y: sourceNode.y + (sourceNode.h / 2)},
                {x: targetNode.x + (targetNode.w / 2), y: targetNode.y + (targetNode.h / 2)}
            ]
            var aLine = d3.select(link).append("svg:path")
                .attr("id", "path_" + id)
                .attr("d", lineFunction(path))
                .style("stroke", function (d) {
                    return "brown";
                }).style("fill", "brown")
                .style("stroke-width", 3)
                .on("mouseover", function (d) {
                    // overPath(d);
                }).on("mouseout", function (d) {
                    // outPath(d);
                });

            var relLabels = d3.select(link).append("text").attr("dy", -5)
                .append("textPath")
                .text(function (d) {
                    return type;
                })
                .attr("xlink:href", "#path_" + d.id)
                .attr("marker-end", "url(#arrowhead)")
                .style("text-anchor", "middle") // place the text halfway on the arc
                .attr("startOffset", "50%")
                .style("font-size", "14px")
                .style("fill", "brown");


        }
        ;

        self.addNode = function (label, properties) {
            self.initGraph();
            var id = getNewId();
            var pos = {x: 100, y: 200}
            relations[id] = {labelNeo: label, properties: properties};


            var point = svgGraph.selectAll(".node").append("svg:g")
                .on("dblclick", function (d) {

                }).on("click", function (d) {

                })
                .attr("class", "node").attr("id", function (d) {
                    return "P_" + id;
                });



            var shape = point.append("circle").attr("cx", 0).attr("cy", 0).attr("r", size);

            shape.style(
                "stroke",
                function (d) {
                    return "000";

                })

                .style(
                    "fill",
                    function (d) {

                        return d.color;
                    })
                .attr("class", "shape")


            ;

            point.append("text").attr("x", function (d) {
                return -10;
            }).attr("dy", function (d) {
                return 20;

            })
                .text(function (d) {
                    return properties.name;
                })
                .attr("text-anchor", function (d) {

                    return "middle";

                })

                .style("fill", function (d) {
                    return "black"
                })
                .style("font-weight", function (d) {
                    return "normal"
                })
                // .style("font-size", "10px")
                .attr("class", "nodeLabel");

            point.attr("transform", function (d) {
                // d.x=-d.x/2;d.y=-d.y/2;
                return "translate(" + pos.x, +"," + pos.y + ")";
            });
        }


        return self;

    }
)
()