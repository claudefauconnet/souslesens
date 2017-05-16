
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
function searchInTitleBNF(word,target){
	var query2 = "&format=json&timeout=30000";
	var query = "PREFIX bnf-onto:   <http://data.bnf.fr/ontology/bnf-onto/> select * where { ?x dcterms:title ?title. ?title bif:contains '"+word+"' } limit 100";
	var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
		+ encodeURIComponent(query) + query2;
;
var payload = {get:url}


var queryStr= JSON.stringify(query);
console.log("QUERY----" +queryStr);




$.ajax({
	type : "POST",
	url : Gparams.httpProxyUrl,
	data : payload,
	dataType : "json",
	success : function(_data, textStatus, jqXHR) {

		// console.log(JSON.stringify(_data));
		var objs = _data.results.bindings;
		
		showExternalressourcesList(objs,target);
		
		
		
	

	},
	error : function(xhr, err, msg) {
		// dbPediaQueryOn=false;

		console.log(xhr);
		console.log(err);
		console.log(msg);
		console.log("!!!!!!!!!!dbPediaQueryOn turned to FALSE!!!!!!");

	}
});

}


function listBNFPerson(obj, target) {
	var word = "Freud"
	if(obj){
	 var word=obj.name;
	if(!word) word=obj.nom;
	if(!word) return "";
	}
	word=encode_utf8(word);
	var query2 = "&format=json&timeout=30000";
	var query = "PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>"
			+ "PREFIX dcterms: <http://purl.org/dc/terms/>"
			+ "PREFIX foaf: <http://xmlns.com/foaf/0.1/>" + "select * where{"
			+ " ?x foaf:familyName ?label." + " ?label bif:contains '" + word
			+ "'" + ".?x foaf:name ?nom" + ".?x foaf:depiction ?thumbnail"
			+ "}"

	var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
			+ encodeURIComponent(query) + query2;

    var payload = {get:url}

	console.log(query);


	$.ajax({
		type : "POST",
		url : Gparams.httpProxyUrl,
		data : payload,
		dataType : "json",
		success : function(_data, textStatus, jqXHR) {

			// console.log(JSON.stringify(_data));
			var objs = _data.results.bindings;
			
			showExternalressourcesList(objs,target);
			
			
			var dbPediaHtmlArray = "<table>";
		

		},
		error : function(xhr, err, msg) {
			// dbPediaQueryOn=false;

			console.log(xhr);
			console.log(err);
			console.log(msg);
			console.log("!!!!!!!!!!dbPediaQueryOn turned to FALSE!!!!!!");

		}
	});

}

//listBNFBook({name:"Freud"});
function listBNFBook(obj, target) {
	var word = "Freud"
	if(obj){
	 var word=obj.name;
	if(!word) word=obj.nom;
	if(!word) return "";
	}
	//word=encode_utf8(word);
	word=word.replace(/'/g,"\\'");
	
/*	var isbn=obj.ISBN_010a;
	var str=isbn;
	if(isbn){
		if(isbn.indexOf("-")<0 && isbn.length==10){
			isbn=str.substring(0,1)+"-"+str.substring(1,4)+"-"+str.substring(4,9)+"-"+str.substring(9,10);
			console.log(isbn);
		}
	
		
	}*/
	var query2 = "&format=json&timeout=30000";
	
	var query="";
	if(false){
		var query = "PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>"
		+"select * where {" 
				
		  if(obj.Titre_propre_200a)
			  query+="optional { ?x dcterms:title '"+obj.Titre_propre_200a.replace(/'/g,"\\'")+"' .?x bnf-onto:FRBNF ?id.?x  dcterms:title ?titre. ?x dcterms:publisher ?editeur}";
			  	if(obj.ISBN_010a )
			  		query+=" optional {?x bnf-onto:isbn '"+obj.ISBN_010a+ "' .?x bnf-onto:FRBNF ?id.?x  dcterms:title ?titre. ?x dcterms:publisher ?editeur}";
				if(obj.BiblioNat_numero_020)
					query+=" optional {?x bnf-onto:'"+obj.BiblioNat_numero_020+"' .?x bnf-onto:FRBNF ?id.?x  dcterms:title ?titre. ?x dcterms:publisher ?editeur}";
				
				query+="}"

	
	
	
	}
	else{
		var query = "PREFIX dcterms: <http://purl.org/dc/terms/>"+
		"PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>"+
		"select *  where {"+
		"?x dcterms:title  ?label. ?label bif:contains '"+word+"'."+
		"?x  bnf-onto:FRBNF ?FRFN."+
		  "?x  dcterms:title ?title."+
				"}"

	}


	var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
			+ encodeURIComponent(query) + query2;

    var payload = {get:url}

	console.log(query);



	$.ajax({
		type : "POST",
		url : Gparams.httpProxyUrl,
		data : payload,
		dataType : "json",
		success : function(_data, textStatus, jqXHR) {

			// console.log(JSON.stringify(_data));
			var objs = _data.results.bindings;
			
			for(var i=0;i<objs.length;i++){
				objs[i].x.value=objs[i].x.value.replace('data','catalogue');
			//	objs[i].id.value="http://data.bnf.fr/"+objs[i].id.value;
				//delete objs[i].x;
			
			}
		
			
			showExternalressourcesList(objs,target);
			
			
			var dbPediaHtmlArray = "<table>";
		

		},
		error : function(xhr, err, msg) {
			// dbPediaQueryOn=false;

			console.log(xhr);
			console.log(err);
			console.log(msg);
			console.log("!!!!!!!!!!dbPediaQueryOn turned to FALSE!!!!!!");

		}
	});

}





	

function getPersonInfos(uri) {
	var query2 = "&format=json&timeout=30000";
	uri = "<http://data.bnf.fr/ark:/12148/cb11907966z#foaf:Person> ";

	var query = "SELECT DISTINCT ?nom_complet ?nom ?prenom ?forme_retenue"
			+ "?formes_rejetees ?pays ?langue ?sexe ?anniversaire ?date_naissance"
			+ "?lieu_naissance ?date_mort ?lieu_mort ?periode_activite ?domaine_activite"
			+ "?bio WHERE {"
			+ uri
			+ " foaf:gender ?sexe;"
			+ "<http://rdvocab.info/ElementsGr2/countryAssociatedWithThePerson> ?pays;"
			+ "<http://rdvocab.info/ElementsGr2/languageOfThePerson> ?langue;"
			+ "<http://rdvocab.info/ElementsGr2/dateOfBirth> ?date_naissance;"
			+ "<http://rdvocab.info/ElementsGr2/placeOfBirth> ?lieu_naissance;"
			+ "foaf:birthday ?anniversaire;"
			+ "<http://rdvocab.info/ElementsGr2/dateOfDeath> ?date_mort;"
			+ "<http://rdvocab.info/ElementsGr2/placeOfDeath> ?lieu_mort;"
			+ "<http://rdvocab.info/ElementsGr2/fieldOfActivityOfThePerson> ?domaine_activite;"
			+ "<http://rdvocab.info/ElementsGr2/biographicalInformation> ?bio;"
			+ "foaf:name ?nom_complet;"
			+ "foaf:familyName ?nom;"
			+ "foaf:givenName ?prenom."
			+ "<http://data.bnf.fr/ark:/12148/cb11907966z> skos:altLabel ?formes_rejetees;"
			+ "skos:prefLabel ?forme_retenue "
			+ "OPTIONAL {"
			+ uri
			+ "<http://rdvocab.info/ElementsGr2/periodOfActivityOfThePerson> ?periode_activite}}";

	var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
			+ encodeURIComponent(query) + query2;
	

	// var payload=query;
    var payload = {get:url}


	$.ajax({
		type : "POST",
		url : Gparams.httpProxyUrl,
		data : payload,
		dataType : "json",
		success : function(_data, textStatus, jqXHR) {

			console.log(JSON.stringify(_data));
			var objs = _data.results.bindings;

		},
		error : function(xhr, err, msg) {
			// dbPediaQueryOn=false;

			console.log(xhr);
			console.log(err);
			console.log(msg);
			console.log("!!!!!!!!!!dbPediaQueryOn turned to FALSE!!!!!!");

		}
	});

}
