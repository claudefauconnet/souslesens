/**
 * Created by claud on 14/11/2017.
 */
var souslesensForcelayout=(function(){
  var self={}

  self.getlayout=function(resultArray) {
      for (var i = 0; i < resultArray.length; i++) {
          var rels = resultArray[i].rels;
          var nodes = resultArray[i].nodes;
          if (!nodes)
              continue;

          var ids = resultArray[i].ids;
          var legendRelIndex = 1;
          var nodesMap = {}


          for (var j = 0; j < nodes.length; j++) {

              var nodeNeo = nodes[j].properties;
              var labels = nodes[j].labels;
              var nodeObj = {
                  name: nodeNeo[Gparams.defaultNodeNameProperty],

                  myId: nodeNeo.id,
                  label: nodes[j].labels[0],
                  id: nodes[j]._id,
                  children: [],
                  //  neoAttrs: nodeNeo,
                  rels: [],
                  nLinks: 0
              }
              nodesMap.push(nodeObj);
          }
      }

  }











  return self;
})();
