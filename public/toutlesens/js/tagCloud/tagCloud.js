var tagCloud = (function () {
    var self = {};

    self.drawCloud = function (err, data) {

        var word_count = {};
        for (var i = 0; i < data.length; i++) {
            var name = data[i].n.properties[Schema.getNameProperty()];
            var lemmes = name.split(" ");
            for (var j = 0; j < lemmes.length; j++) {
                var lemme = lemmes[j]
            }
            if (!word_count[lemme])
                word_count[lemme] = 1;
            else
                word_count[lemme] = word_count[lemme] + 1
        }

        tagCloud.drawD3("#graphDiv", word_count);


    }


    self.onTagClick = function (text) {
        var clauses = [{
            nodeLabel: "",
            where: "n.name=~'(?i).*" + text + ".*'"
        },
            {
                nodeLabel: "",
                where: "n.name=~'(?i).*" + $("#word").val() + ".*'"
            }
        ]
        $("#propertiesSelectionDialog_valueInput").val("")
        $("#propertiesSelectionDialog_valueInput").focus();
        $("#filterOptionsDiv").html("");

        advancedSearch.addClause(clauses[0]);
        $( "#searchAccordion" ).accordion( "option", "active", 1 );

        searchMenu.activatePanel("searchCriteriaDiv")


    }



self.drawD3 = function (cloudDiv, word_count) {

    $(cloudDiv).html("");
    var svg_location = cloudDiv
    var width = $(svg_location).width();
    var height = $(svg_location).height();

    var fill = d3.scale.category20();

    var word_entries = d3.entries(word_count);

    var xScale = d3.scale.linear()
        .domain([0, d3.max(word_entries, function (d) {
            return d.value * 2;
        })
        ])
        .range([10, 100]);

    d3.layout.cloud().size([width, height])
        .timeInterval(20)
        .words(word_entries)
        .fontSize(function (d) {
            return xScale(+d.value);
        })
        .text(function (d) {
            return d.key;
        })
        .rotate(function () {
            //  return 0;
            return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .on("end", draw)
        .start();

    function draw(words) {
        d3.select(svg_location).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")

            .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
            .selectAll("text")
            .data(words)
            .enter().append("g")
            .on("click", function (d, i) {
                tagCloud.onTagClick(d.text);
                // alert("click");
            }).append("text")
            .attr("class", "tag")
            .style("font-size", function (d) {
                return xScale(d.value) + "px";
            })

            .style("font-family", "Impact")
            .style("fill", function (d, i) {
                return fill(i);
            })
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) {
                return d.key;
            })

    }


}


return self;
})
()