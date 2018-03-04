
var graphLayoutSelect=null;
var adminVisjs=(function(){
    self={};

    self.initNodeImportGraph=function(){

        nodes = [

            {id: 1, label: 'statNode',shape: 'text', widthConstraint: { minimum: 200}, heightConstraint: { minimum: 100, valign: 'middle' },color:"blue" ,x: -50, y: -300 },
            {id: 12, label: 'endNode',shape: 'text', widthConstraint: { minimum: 200}, heightConstraint: { minimum: 100, valign: 'middle' }, x: -50, y: 0 },
        ];

        edges = [
        ];

        // create a network

        var data = {
            nodes: nodes,
            edges: edges
        };
      //  visjsGraph.draw("graphDiv0",data);
        var container = document.getElementById('graphDiv0');
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            edges: {
                font: {
                    size: 12
                },
                widthConstraint: {
                    maximum: 90
                }
            },
            nodes: {
                shape: 'box',
                margin: 10,
                widthConstraint: {
                    maximum: 200
                }
            },
            physics: {
                enabled: false
            }
        };
        var network = new vis.Network(container, data, options);







    }



    return self;



})()