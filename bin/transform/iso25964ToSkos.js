/*********************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Claude Fauconnet claude.fauconnet@neuf.fr
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



var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');

var parser = new xml2js.Parser();


var iso25964ToSkos = {


    parseIso25964File: function (filePath, callback) {


        fs.readFile(xmlFile, function (err, data) {
            if (err) {
                if (callback)
                    return callback(err);
            }
            iso25964ToSkos.parseIso25964(data, callback)
        });
    },


    parseIso25964: function (data, callback) {
        parser.parseString(data, function (err, result) {
            if (err) {
                if (callback)
                    callback(err);
                return
            }

            var thesaurus = {concepts: {}}
            var Thesaurus = result["iso25964:ISO25964Interchange"]["iso25964:Thesaurus"][0];
            thesaurus.identifier = Thesaurus["iso25964:identifier"][0];
            thesaurus.date = Thesaurus["iso25964:date"][0];
            thesaurus.description = Thesaurus["dc:description"][0]["_"];
            thesaurus.creator = Thesaurus["dc:creator"][0];


            /*----------------concepts**************************************************************/
            var ThesaurusConcepts = Thesaurus["iso25964:ThesaurusConcept"];
            for (var i = 0; i < ThesaurusConcepts.length; i++) {
                var ThesaurusConcept = ThesaurusConcepts[i];
                var identifier0 = ThesaurusConcept["iso25964:identifier"][0]
                var concept = {identifier: identifier0, PreferredTerms: [], relations: []};
                var PreferredTerms = ThesaurusConcept["iso25964:PreferredTerm"];
                for (var j = 0; j < PreferredTerms.length; j++) {

                    try {
                        var lexicalValue = PreferredTerms[j]["iso25964:lexicalValue"][0]["_"];
                        var identifier = PreferredTerms[j]["iso25964:identifier"][0];
                    }
                    catch (e) {
                        console.log(i);
                        console.log(identifier0);
                    }
                    var PreferredTerm = {lexicalValue: lexicalValue, identifier: identifier};
                    concept["PreferredTerms"].push(PreferredTerm)
                }


                thesaurus.concepts[identifier0] = concept;

            }

            /*----------------AssociativeRelationship**************************************************************/
            var AssociativeRelationships = result["iso25964:ISO25964Interchange"]["iso25964:AssociativeRelationship"];
            for (var i = 0; i < AssociativeRelationships.length; i++) {
                var AssociativeRelationship = AssociativeRelationships[i];
                var role = AssociativeRelationship["iso25964:role"][0];

                var hasRelatedConcept = AssociativeRelationship["iso25964:hasRelatedConcept"][0]
                var isRelatedConcept = AssociativeRelationship["iso25964:isRelatedConcept"][0];
                var xxx = thesaurus.concepts[hasRelatedConcept];
                thesaurus.concepts[hasRelatedConcept].relations.push({
                    role: role,
                    relatedConcept: thesaurus.concepts[isRelatedConcept]
                })


            }


            /*----------------AssociativeRelationship**************************************************************/
            var HierarchicalRelationships = result["iso25964:ISO25964Interchange"]["iso25964:HierarchicalRelationship"];
            for (var i = 0; i < HierarchicalRelationships.length; i++) {
                var HierarchicalRelationship = HierarchicalRelationships[i];
                var role = HierarchicalRelationship["iso25964:role"][0]

                var hasHierRelConcept = HierarchicalRelationship["iso25964:hasHierRelConcept"][0]
                var isHierRelConcept = HierarchicalRelationship["iso25964:isHierRelConcept"][0];
                var xxx = thesaurus.concepts[hasHierRelConcept];
                thesaurus.concepts[hasHierRelConcept].relations.push({
                    role: role,
                    relatedConcept: thesaurus.concepts[isHierRelConcept]
                })


            }


            var xml = iso25964ToSkos.convertToSkosXml(thesaurus)
            if (callback) {
                var result = {
                    data: xml,
                    contentType: "text/xml"
                }


            }
            callback(null, result);
            return xml;
        });


    }


    ,

    /*
     <rdf:RDF
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
     xmlns:skos="http://www.w3.org/2004/02/skos/core#">

     <skos:Concept rdf:about="http://www.ukat.org.uk/thesaurus/concept/1750">
     <skos:prefLabel>Economic cooperation</skos:prefLabel>
     <skos:altLabel>Economic co-operation</skos:altLabel>
     <skos:scopeNote>Includes cooperative measures in banking, trade, 		industry etc., between and among countries. </skos:scopeNote>
     <skos:inScheme rdf:resource="http://www.ukat.org.uk/thesaurus"/>
     <skos:broader rdf:resource="http://www.ukat.org.uk/thesaurus/concept/4382"/>
     <skos:narrower rdf:resource="http://www.ukat.org.uk/thesaurus/concept/2108"/>
     <skos:narrower rdf:resource="http://www.ukat.org.uk/thesaurus/concept/9505"/>
     <skos:narrower rdf:resource="http://www.ukat.org.uk/thesaurus/concept/15053"/>
     <skos:narrower rdf:resource="http://www.ukat.org.uk/thesaurus/concept/18987"/>
     <skos:related rdf:resource="http://www.ukat.org.uk/thesaurus/concept/3250"/>
     </skos:Concept>
     </rdf:RDF>
     */
    convertToSkosXml: function (thesaurus) {
        var rolesDictionary = {
            "SA": "skos:related",
            "NT": "skos:narrower",
            "BT": "skos:broader",
            "USE": "skos:altLabel",// non implementé car pas d'example
        }

        var concepts = thesaurus.concepts;
        var conceptsSkos = [];
        for (var key in concepts) {
            var concept = concepts[key];

            var obj = {
                name: "skos:Concept",
                attrs: {"rdf:about": "http://" + thesaurus.identifier + "/" + concept.identifier}
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


        var xml = jsonxml(targetJson, {indent: " ", prettyPrint: 1,xmlHeader :1});
        var header =
            '<rdf:RDF' +
       ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'+
       ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"'+
      '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"'+
        '>'

        xml = xml.replace('<rdf:RDF>', header);
        console.log(xml);
        return xml;



    }

}

module.exports = iso25964ToSkos;


//var xmlFile = "./geochemistry_50.xml";
//var thesaurus = iso25964ToSkos.parseIso25964File(xmlFile);


