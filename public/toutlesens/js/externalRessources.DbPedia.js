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
function searchInTitleDbPedia(word,target){
listDbPediaPerson({name:word },target) 
}


function listDbPediaPerson(obj,target) {

	
	if (!obj){
		console.error ("no currentObject");
		return;
	}
		
	if (obj.urlDbpedia) {
		word = obj.urlDbpedia;
		var p = word.lastIndexOf("/");
		if (p > 0) {
			word = word.substrng(p + 1);
		}
	}
	else
		word=obj.name;
	if(!word)
		word=obj.nom;
	if(!word)
		return "";

	
	word=encode_utf8(word);
	var label = obj.label;

	var props = {}

	props["Personne"] = [ "birthDate", "deathDate" ];
	var propsStr = [];
	if (type && props[type]) {
		for (var i = 0; i < props[label].length; i++) {
			var prop = props[label][i];
			propsStr += "prop:" + prop + " ?" + prop + ";"
		}
	}

	// reg ex ?x rdfs:label ?label FILTER regex(?label,'^péric','i')

	var optionalProps = "";
	optionalProps += " OPTIONAL { ?x prop:birthDate ?birthDate }\n";

	optionalProps += " OPTIONAL { ?x prop:deathDate ?deathDate }\n";
	optionalProps += "OPTIONAL { ?x prop:disciple ?disciple }\n";
	optionalProps += "OPTIONAL { ?x prop:startDate ?startDate}\n";
	optionalProps += "OPTIONAL { ?x prop:endDate ?endDate}\n";
	optionalProps += "OPTIONAL { ?x prop:author ?author}\n";

	optionalProps += "OPTIONAL { ?x prop:originalTitle ?originalTitle}\n";
	optionalProps += "OPTIONAL { ?x prop:museum ?museum}\n";
	optionalProps += "OPTIONAL { ?x prop:subjectTerm ?subjectTerm}\n";

	var query = "PREFIX : <http://dbpedia.org/resource/>PREFIX dbpedia-owl:<http://dbpedia.org/ontology/> PREFIX prop: <http://dbpedia.org/property/>"
			+ "SELECT * WHERE {"
			+ "?x rdfs:label "
			+ "?label. "
			+ "?label bif:contains '"
			+ word
			+ "'."
			// + optionalProps
			+ "?x <http://dbpedia.org/ontology/wikiPageID> ?id."
			+ "?x dbpedia-owl:abstract ?abstract."
			+ "?x dbpedia-owl:thumbnail ?thumbnail."

			+ "FILTER (LANG(?label )='fr'  && LANG(?abstract)='fr')" + "}"



	var query2 = "&format=json&timeout=30000";// &debug=on"
	$("#urlPanel").html(htmlEncode(query));
	console.log(query);

	var url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="
			+ encodeURIComponent(query) + query2;

	
	var queryStr= JSON.stringify(query);
	console.log("QUERY----" +queryStr);


    var payload = {get:url};


	$.ajax({
				type : "POST",
				url : Gparams.httpProxyUrl,
				data : payload,
				dataType : "json",
				success : function(_data, textStatus, jqXHR) {
					var objs = _data.results.bindings;
					showExternalressourcesList(objs,target);
					

				},
				error : function(xhr, err, msg) {
				//	dbPediaQueryOn=false;
					
					console.log(xhr);
					console.log(err);
					console.log(msg);
					console.log ("!!!!!!!!!!dbPediaQueryOn turned to FALSE!!!!!!");
					
			

				}
			});

}


