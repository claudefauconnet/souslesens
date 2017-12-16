/**
 * Created by claud on 15/12/2017.
 */
var starwars=(function(){

    var self={};



    self.sparqls=function(){
      topItems: 'select * where {?item <http://dbpedia.org/ontology/series> <http://dbpedia.org/resource/Star_Wars>.  ?item rdfs:label ?label. FILTER(LANG(?label) = "" || LANGMATCHES(LANG(?label), "en"))'
        }



        self.execSparql=function(sparqlKey){
        var query=self.sparqls[sparqlKey]

            var url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="
                + encodeURIComponent(query);

            var payload = {get: url}

            console.log(query);


            $.ajax({
                type: "POST",
                url: "../http",
                data: payload,
                dataType: "json",
                success: function (_data, textStatus, jqXHR) {

                    //  console.log(JSON.stringify(_data));
                    var xx = _data.result;
                    xx = JSON.parse(xx);
                    xx = xx.results;
                    var objs = xx.bindings;
                    callback(null, objs);


                },
                error: function (xhr, err, msg) {
                    callback(err);

                }
            });




        }



})()