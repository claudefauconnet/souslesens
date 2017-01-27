/**
 * Created by claud on 13/01/2017.
 */
var r=require("request");
var txUrl = "http://neo4j:souslesens@localhost:7474/db/data/transaction/commit";
function cypher(query,params,cb) {
    r.post({uri:txUrl,
        json:query},
        function(err,res) {
        cb(err,res.body)
        })
}

var query={"statements":[{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"},{"statement":"CREATE (n:thematique)  RETURN n.id,ID(n), labels(n)"}]};
//var query="MATCH (n) RETURN n, labels(n) as l LIMIT {limit}"
var params={limit: 10}
var cb=function(err,data) {
    console.log(JSON.stringify(data)) }

cypher(query,params,cb)

