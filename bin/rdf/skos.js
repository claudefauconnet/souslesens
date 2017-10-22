var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');
var path = require('path');


var skos = {

    storeTreeData: function (tree, fileName) {
        var identifier, date, description, creator = "";
        if (tree.identifier)
            identifier = tree.identifier;
        else
            identifier = fileName;

        if (tree.date)
            date = tree.date;
        else
            date = new Date();

        if (tree.description)
            description = tree.description;
        else
            description = "";

        if (tree.creator)
            creator = tree.creator;
        else
            creator = "";

        skos.treeDataToSkos(tree, identifier, date, description, creator, function (skosObj) {
            var xml = skos.toXml(skosObj)
            var file = path.resolve(__dirname, "./thesaurii/" + fileName + ".json");

        })

    }
    ,

    treeDataToSkos: function (tree, identifier, date, description, creator, callback) {


        var thesaurus = {concepts: {}}
        thesaurus.identifier = identifier;
        thesaurus.date = date;
        thesaurus.description = description;
        thesaurus.creator = creator;


        callback(thesaurus);

    },


    toXml: function (skosObj) {
        var rolesDictionary = {
            "SA": "skos:related",
            "NT": "skos:narrower",
            "BT": "skos:broader",
            "USE": "skos:altLabel",// non implementé car pas d'example
        }

        var concepts = skosObj.concepts;
        var conceptsSkos = [];
        for (var key in concepts) {
            var concept = concepts[key];

            var obj = {
                name: "skos:Concept",
                attrs: {"rdf:about": "http://" + skosObj.identifier + "/" + concept.identifier}
                , children: [
                    {
                        name: "skos:prefLabel",
                        text: concept.PreferredTerms[0].lexicalValue
                    }

                ]


            }
            for (var i = 0; i < concept.relations.length; i++) {
                var relation = concept.relations[i];
                var tagName = [relation.role];
                var text = relation.relatedConcept.PreferredTerms[0].lexicalValue;
                var relationObj = {name: tagName, text: text}
                obj.children.push(relationObj);
            }


            conceptsSkos.push(obj);

        }


        var targetJson = {
            "rdf:RDF": conceptsSkos,


        };


        var xml = jsonxml(targetJson, {indent: " ", prettyPrint: 1, xmlHeader: 1});
        var header =
            '<rdf:RDF' +
            ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
            ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"' +
            '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"' +
            '>'

        xml = xml.replace('<rdf:RDF>', header);
        console.log(xml);
        return xml;


    }


}

module.exports(skos)