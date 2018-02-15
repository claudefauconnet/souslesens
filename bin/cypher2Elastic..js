

var match="MATCH (n:personne)-[r]-(m) RETURN n LIMIT 25";
var q= {
    "query": {
        "bool": {
            "must": {
                "term": {"label": "personne"}
            }
        }
    }
}


var regex=/(\(



var q= {
    "query": {
        "bool": {
            "must": {
                "term": {"type": "knows"}
            }
        }
    }
}