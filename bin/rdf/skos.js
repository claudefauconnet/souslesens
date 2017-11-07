var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');
var path = require('path');
var rdfProxy = require('./rdfProxy');
var async = require('async');

var parser = new xml2js.Parser();


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


    ,

    loadSkosToTree: function (thesaurus, callback) {


        var file = path.resolve(__dirname + "/thesaurii/" + thesaurus + ".rdf");
        fs.readFile(file, function (err, data) {
            if (err) {
                if (callback)
                    return callback(err);
            }
            var parser = new xml2js.Parser();
            parser.parseString("" + data, function (err, result) {
                if (err) {
                    if (callback)
                        return callback(err);

                }

                var concepts = result["rdf:RDF"]["skos:Concept"];
                var conceptsMap = {}
                for (var i = 0; i < concepts.length; i++) {
                    var about = concepts[i]["$"]["rdf:about"];
                    var id = about.substring(about.lastIndexOf("/") + 1)


                    var prefLabel = concepts[i]["skos:prefLabel"][0]
                    if (concepts[i]["skos:prefLabel"].length > 1)  // english for Unesco
                        prefLabel = concepts[i]["skos:prefLabel"][2]._
                    /*   if (concepts[i]["skos:prefLabel"].length > 0)  //
                     prefLabel = concepts[i]["skos:prefLabel"][0]._*/


                    /*    conceptsMap[id] = {


                     .prefLabel: concepts[i]["skos:prefLabel"][0]._,
                     //    en: concepts[i]["skos:prefLabel"][1]._,
                     //   sp: concepts[i]["skos:prefLabel"][0]._,
                     //  .prefLabel: concepts[i]["skos:prefLabel"][2]._,
                     narrower: concepts[i]["skos:narrower"],
                     broader: concepts[i]["skos:broader"],
                     about:about


                     }*/
                    var node = {prefLabel: prefLabel}


                    if (concepts[i]["skos:narrower"])
                        node.narrower = concepts[i]["skos:narrower"]
                    if (concepts[i]["skos:NT"])
                        node.narrower = concepts[i]["skos:NT"]
                    if (concepts[i]["skos:broader"])
                        node.broader = concepts[i]["skos:broader"]
                    if (concepts[i]["skos:BT"])
                        node.broader = concepts[i]["skos:BT"]

                    conceptsMap[id] = node;

                }


                var treeData = []

                for (var key in conceptsMap) {
                    var concept = conceptsMap[key];
                    var node = {text: concept.prefLabel, id: key, data: {about: concept.about}};

                    var parents = concept.broader;


                    if (parents && parents.length > 0) {
                        var parent = parents[0]["$"]["rdf:resource"]
                        var parent = parent.substring(parent.lastIndexOf("/") + 1)
                        //    var parent = conceptsMap[parent];
                        node.data.parentText = conceptsMap[parent].prefLabel;
                        node.parent = parent;


                    }
                    else {
                        node.parent ="_"+thesaurus;

                    }
                    if (node.parent != "_" + thesaurus) {
                        if (!conceptsMap[node.parent])

                            var yy = "";
                    }
                    treeData.push(node);

                }
                treeData.push({text: thesaurus, id: "_"+thesaurus,parent:"#"});//root
                if (callback)
                    callback(null, treeData);


            });
        });
    }

    ,
    saveTreeToSkos: function (treeData, ontology, callback) {
        var thesaurusUri = "http://www.souslesens.org/" + ontology;



            var concepts = [];
            for (var key in treeData) {

                var node = treeData[key];
                if (node.parent) {
                    var concept = {
                        name: "skos:Concept",
                        attrs: {"rdf:about": "http://" + thesaurusUri + "/" + node.id}
                        , children: [
                            {
                                name: "skos:prefLabel",
                                text: node.text
                            },



                        ]


                    }
                    if(node.parent!="#"){
                        concept.children.push( {
                            name: "skos:broader",
                                attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.parent}
                        });
                    }
                    if(node.children) {
                        for (var i = 0; i < node.children.length; i++) {
                            concept.children.push({
                                name: "skos:narrower",
                                attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.children[i]}
                            })

                        }
                    }
                    concepts.push(concept);
                }

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
        var file = path.resolve(__dirname + "/thesaurii/" + ontology + ".rdf");
        fs.writeFile(file, xml, {}, function (err, xml) {
            if (err)
                return callback(err);
            return (null, "thesaurus " + ontology + " saved")

        });
    },

    saveTreeToSkosOld: function (treeData, ontology, callback) {
        var thesaurusMap = {}
        var thesaurusUri = "http://www.souslesens.org/" + ontology;

        for (var key in treeData) {
            var node = treeData[key];
            if (!thesaurusMap[node.id]) {
                var obj = {
                    name: "skos:Concept",
                    attrs: {"rdf:about": "http://" + thesaurusUri + "/" + node.id}
                    , children: [
                        {
                            name: "skos:prefLabel",
                            text: node.text
                        }

                    ]


                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    var narrowerNode = treeData[node.children[i]];
                    var obj = thesaurusMap[node.children[i]];
                    if (!obj) {
                        var obj = {
                            name: "skos:Concept",
                            attrs: {"rdf:about": "http://" + thesaurusUri + "/" + narrowerNode.id}
                            , children: [
                                {
                                    name: "skos:prefLabel",
                                    text: narrowerNode.text
                                },
                                {
                                    name: "skos:broader",
                                    attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.id}
                                }

                            ]
                        }
                    }


                    var narrowerObj = {
                        name: "skos:narrower",
                        attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.children[i]}
                    }
                    obj.children.push(narrowerObj);
                }


            }

            thesaurusMap[node.id] = obj;
        }
        var thesaurus = {}
        thesaurus["rdf:RDF"] = [];
        for (var key in thesaurusMap) {
            if (key != "#")
                thesaurus["rdf:RDF"].push(thesaurusMap[key]);
        }
        var xml = jsonxml(thesaurus, {indent: " ", prettyPrint: 1, xmlHeader: 1});
        var header =
            '<rdf:RDF' +
            ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
            ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"' +
            '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"' +
            '>'

        xml = xml.replace('<rdf:RDF>', header);
        var file = path.resolve(__dirname + "/thesaurii/" + ontology + ".rdf");
        fs.writeFile(file, xml, {}, function (err, xml) {
            if (err)
                return callback(err);
            return (null, "thesaurus " + ontology + " saved")

        });
    }


    ,
    generateSkosThesaurusFromWords: function (ontology, words, callback) {


        function createConcept(doc, label) {
            return {
                name: "skos:Concept",
                attrs: {"rdf:about": doc.value},
                children: [{name: "skos:prefLabel", attrs: {"xml:lang": "fr"}, text: label.value}]

            }
        }

        var concepts = {};
        var relTypes = ["narrower", "broader", "related"];
        var symetricReltypes = {
            "narrower": "broader",
            "broader": "narrower",
            "related": "related"
        }
        async.eachSeries(words, function (_word, callback) {
                var word = _word.substring(0, 1).toUpperCase() + _word.substring(1).toLowerCase();
                console.log(word);
                rdfProxy.getBnfTriples(ontology, word, ["broader", "narrower"], "fr", false, 5000, function (err, json) {
                    if (err) {
                        console.log(err)
                        return callback();
                    }
                    if (!json)
                        return callback();
                    for (var i = 0; i < json.length; i++) {


                        var obj = json[i];
                        var concept = concepts[obj.doc.value];
                        if (!concept) {
                            var concept = createConcept(obj.doc, obj.label);
                            concepts[obj.doc.value] = concept;
                        }


                        //var children = [];
                        //  children.push({name: "skos:prefLabel", attrs: {"xml:lang": .prefLabel"}, text: obj.label.value})
                        for (var j = 0; j < relTypes.length; j++) {
                            var relDoc = relTypes[j] + "Doc";
                            var relLabel = relTypes[j] + "Label";

                            if (obj[relDoc]) {
                                if (!concepts[obj[relDoc].value]) {
                                    concepts[obj[relDoc].value] = createConcept(obj[relDoc], obj[relLabel]);
                                    concepts[obj[relDoc].value].children.push({
                                        name: "skos:" + symetricReltypes[relTypes[j]],
                                        attrs: {"rdf:resource": obj.doc.value},
                                    })

                                    concepts[obj.doc.value].children.push({
                                        name: "skos:" + relTypes[j],
                                        attrs: {"rdf:resource": obj[relDoc].value},
                                    })
                                }

                            }


                        }


                    }
                    return callback();


                })

            },
            function (err) {
                var conceptsArray = [];
                for (var key in concepts) {
                    conceptsArray.push(concepts[key]);
                }
                var targetJson = {
                    "rdf:RDF": conceptsArray,


                };

                var xml = jsonxml(targetJson, {indent: " ", prettyPrint: 1, xmlHeader: 1});
                var header =
                    '<rdf:RDF' +
                    ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                    ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"' +
                    '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"' +
                    '>' +
                    ' <skos:ConceptScheme rdf:about="http://www.souslesens.org/PLM">' +
                    '<skos:prefLabel xml:lang="fr">Projet de nomenclature pour la bibliothèque PLM </skos:prefLabel>' +
                    ' </skos:ConceptScheme>'

                xml = xml.replace('<rdf:RDF>', header);
                //  xml=header+"\n"+xml;
                //   console.log(xml);
                callback(null, xml);

            })

    }
    ,
    generatePLMskos: function () {
        var data = "" + fs.readFileSync(path.resolve(__dirname + "/thesaurii/PLM.txt"));
        data = data.replace(/et/g, "/")
        var words = data.split(/[\n\/]/);
        for (var i = 0; i < words.length; i++) {
            words[i] = words[i].replace("\r", "");
            words[i] = words[i].replace(/\(.*\)/g, "");


        }
        skos.generateSkosThesauru.prefLabelomWords("BNF", words, function (err, result) {
            if (err)
                return console.log(err);
            var file = path.resolve(__dirname + "/thesaurii/PLM.rdf");
            fs.writeFileSync(file, result);
        });

    }
}
/*skos.generateSkosThesauru.prefLabelomWords("BNF", ["Bouddhisme"], function (err, result) {
 if (err)
 return console.log(err);
 var file = path.resolve(__dirname + "/thesaurii/boudisme.rdf");
 fs.writeFileSync(file, result);
 })*/

//skos.generatePLMskos();


module.exports = skos;