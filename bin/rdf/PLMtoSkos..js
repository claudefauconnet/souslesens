var fs = require('fs');
var path = require('path');
var jsonxml = require('jsontoxml');

var file = path.resolve(__dirname + "/thesaurii/PLM.txt");
fs.readFile(file, function (err, data) {
    var thesaurusUri = "http://www.souslesens.org/PLM";
    var concepts = [];
    var words = ("" + data).split("\r\n");
    for (var i = 0; i < words.length; i++) {
        var word = words[i];

        var concept = {
            name: "skos:Concept",
            attrs: {"rdf:about": "http://" + thesaurusUri + "/" + i}
            , children: [
                {
                    name: "skos:prefLabel",
                    text: word
                },
            ]
        }
        concepts.push(concept)
    }
    var thesaurus = {};

    thesaurus["rdf:RDF"] = concepts;

    var xml = jsonxml(thesaurus, {indent: " ", prettyPrint: 1, xmlHeader: 1});
    var header =
        '<rdf:RDF' +
        ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
        ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"' +
        '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"' +
        '>'

    xml = xml.replace('<rdf:RDF>', header);
    var file = path.resolve(__dirname + "/thesaurii/PLM.rdf");
    fs.writeFile(file, xml, {}, function (err, xml) {
        if (err)
            return callback(err);
        return (null, "thesaurus PLM saved")

    });


})