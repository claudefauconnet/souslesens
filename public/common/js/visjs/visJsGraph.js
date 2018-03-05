/**
 * Created by claud on 03/08/2017.
 */
var visjsGraph = (function () {
    var self = {};
    self.nodesMap = {};
    var formatData = function (resultArray) {
        var visjsData = {nodes: [], edges: []};

        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            var nodes = resultArray[i].nodes;


            if (!nodes)
                continue;

            var ids = resultArray[i].ids;
            var legendRelIndex = 1;

            for (var j = 0; j < nodes.length; j++) {
                var neoId = nodes[j]._id;
                if (!self.nodesMap[neoId]) {
                    var nodeNeo = nodes[j].properties;

                    var labels = nodes[j].labels;
                    var nodeObj = {
                        label: nodeNeo[Gparams.defaultNodeNameProperty],

                        myId: nodeNeo.id,
                        labelNeo: nodes[j].labels[0],
                        id: neoId,
                        children: [],
                        neoAttrs: nodeNeo,


                    }
                    visjsData.nodes.push(nodeObj);
                    self.nodesMap[neoId] = nodeObj;
                }


            }

            for (var j = 0; j < rels.length; j++) {
                var rel = rels[i];
                var relObj = {
                    from: ids[j],
                    to: ids[j + 1]
                }
                visjsData.edges.push(relObj);
            }
        }

        return visjsData;//testData;
    }


    self.draw = function (divId, resultArray) {
        var data = formatData(resultArray);
        var container = document.getElementById(divId);
        data = {
            nodes: data.nodes,
            edges: data.edges
        };
        var options = {};
        if (data.edges.length > 20) {
            options.layout = {
                improvedLayout: false,
            }
            options.physics = {
                stabilization: true
            }
        }

        var network = new vis.Network(container, data, options);

    }
    var testData = {
        nodes: [
            {id: 1, label: 'Node 1'},
            {id: 2, label: 'Node 2'},
            {id: 3, label: 'Node 3'},
            {id: 4, label: 'Node 4'},
            {id: 5, label: 'Node 5'}
        ], edges: [
            {from: 1, to: 3},
            {from: 1, to: 2},
            {from: 2, to: 4},
            {from: 2, to: 5},
            {from: 3, to: 3}
        ]
    };





    return self;


})()
