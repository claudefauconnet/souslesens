var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');
var path = require('path');
var rdfProxy = require('./rdfProxy');
var async = require('async');
var dom = require('xmldom').DOMParser

var parser = new xml2js.Parser();


var skos = {

    /* storeTreeData: function (tree, fileName) {
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

     },*/


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


    },


    skosToClassifier: function (thesaurus) {
        var classifier = {
            "broaderNodes": {},
            "words": {}
        }
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
                    if (!classifier.broaderNodes[prefLabel])
                        classifier.broaderNodes[prefLabel] = [];
                    // classifier.broaderNodes[prefLabel]=[];


                }
            })
        })


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
                        node.parent = "_" + thesaurus;

                    }
                    if (node.parent != "_" + thesaurus) {
                        if (!conceptsMap[node.parent])

                            var yy = "";
                    }
                    treeData.push(node);

                }
                treeData.push({text: thesaurus, id: "_" + thesaurus, parent: "#"});//root
                if (callback)
                    callback(null, treeData);


            });
        });
    }
    , findOntologySKOSterms: function (ontology, lang, words, callback) {


        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }


        var skos = {
            broaderNodes: {},
            words: {}
        }

        async.eachSeries(words, function (word, callback) {


                word = capitalizeFirstLetter(word);
                console.log(word);

                var payload =
                    [
                        {name: "broader", optional: false},
                        {name: "related", optional: true},
                        {name: "narrower", optional: true}
                    ]


                rdfProxy.getOntologyTriples(ontology, word, payload, lang, false, 100, function (err, json) {
                    if (err) {
                        return console.log(err)
                        return callback(err);
                    }
                    if (!skos.words[word])
                        skos.words[word] = {broaders: [], narrowers: [], relateds: [], count: 0};


                    if (json.length == 0) {
                        if (skos.words[word].broaders.indexOf("orphans") < 0)
                            skos.words[word].broaders.push("orphans");
                        if (!skos.broaderNodes["orphans"])
                            skos.broaderNodes["orphans"] = []
                        skos.broaderNodes["orphans"].push(word);
                    }

                    var relId = 1;
                    var relTypes = ["narrower", "broader", "related"];
                    for (var i = 0; i < json.length; i++) {
                        var obj = json[i];
                        for (var j = 0; j < relTypes.length; j++) {
                            var relDoc = relTypes[j] + "Doc";
                            var relLabel = relTypes[j] + "Label";
                            if (obj[relDoc]) {
                                var docId = obj.doc.value;
                                docId = docId.substring(docId.lastIndexOf("/") + 1);
                                var relDocId = obj[relDoc].value;
                                relDocId = relDocId.substring(relDocId.lastIndexOf("/") + 1);
                                var label = obj.label.value;
                                var relLabelValue = obj[relLabel].value;
                                //   console.log("___________________" + word + "  : " + relLabelValue);


                                if (relTypes[j] == "broader") {
                                    if (!skos.broaderNodes[relLabelValue])
                                        skos.broaderNodes[relLabelValue] = []
                                    if (skos.broaderNodes[relLabelValue].indexOf(word) < 0)
                                        skos.broaderNodes[relLabelValue].push(word);

                                    if (skos.words[word].broaders.indexOf(relLabelValue) < 0)
                                        skos.words[word].broaders.push(relLabelValue);

                                }
                                if (relTypes[j] == "narrower") {
                                    if (skos.words[word].narrowers.indexOf(relLabelValue) < 0)
                                        skos.words[word].narrowers.push(relLabelValue);

                                }
                                if (relTypes[j] == "related") {
                                    if (skos.words[word].relateds.indexOf(relLabelValue) < 0)
                                        skos.words[word].relateds.push(relLabelValue);

                                }
                            }
                        }
                    }
                    callback(null);


                })


            }

            , function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, skos);
                /* console.log("___________________" + JSON.stringify(broader, null, 2));
                 console.log("___________________" + JSON.stringify(narrower, null, 2));
                 console.log("___________________" + JSON.stringify(related, null, 2));*/

            }
        )
    }
    ,
    saveTreeToSkos: function (treeData, ontology, callback) {
        var thesaurusUri = "http://www.souslesens.org/" + ontology;

        var synonyms = {}
        var concepts = {}

        for (var key in treeData) {

            var node = treeData[key];

            if (key.indexOf("s_") == 0) {//synonym
                var conceptId = key.split("_")[2];
                if (!synonyms[conceptId])
                    synonyms[conceptId] = []
                synonyms[conceptId].push(node);
                continue;
            }

            if (key.indexOf("S_") == 0) {//synonym Group
                continue;
            }

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
                if (node.parent != "#") {
                    concept.children.push({
                        name: "skos:broader",
                        attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.parent}
                    });
                }
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        concept.children.push({
                            name: "skos:narrower",
                            attrs: {"rdf:resource": "http://" + thesaurusUri + "/" + node.children[i]}
                        })

                    }
                }
                concepts[node.id] = concept;
            }

        }

        for (var conceptId in synonyms) {
            for (var i = 0; i < synonyms[conceptId].length; i++) {
                var synText = synonyms[conceptId][i].text;

                var concept = concepts["c_"+conceptId];
                concepts["c_"+conceptId].children.push(
                    {
                        name: "skos:altLabel",
                        text: synText
                    });

                if (concept) {// the synonym is already a concept
                    ;
                } else {// we create a concept for the synonym
                    ;
                }


            }
        }

     var conceptArray=[];
     for(var key in concepts){
         conceptArray.push(concepts[key])}


        var thesaurus = {};

        thesaurus["rdf:RDF"] = conceptArray;

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
        skos.generateSkosThesaurus.prefLabelomWords("BNF", words, function (err, result) {
            if (err)
                return console.log(err);
            var file = path.resolve(__dirname + "/thesaurii/PLM.rdf");
            fs.writeFileSync(file, result);
        });

    }


    ,
    skosToElasticSynonyms: function (thesaurus) {


        var pathStr = path.resolve(__dirname + "/thesaurii/" + thesaurus + ".rdf")
        var str = "" + fs.readFileSync(pathStr);

        var doc = new dom().parseFromString(str);


        var conceptElts = doc.documentElement.getElementsByTagName("skos:Concept");
        var str="";
        for( var i=0;i<conceptElts.length;i++){
            var conceptName=conceptElts[i].getElementsByTagName("skos:prefLabel")[0].childNodes[0].nodeValue
            var synonymElts=conceptElts[i].getElementsByTagName("skos:altLabel");
            if(synonymElts.length>0) {
                 str+=conceptName;
                for (var j = 0; j < synonymElts.length; j++) {
                    var synName = synonymElts[j].childNodes[0].nodeValue;
                    str+=","+synName
                }
                str+="\n";
            }
        }
        console.log(str);

    }

}
/*skos.generateSkosThesauru.prefLabelomWords("BNF", ["Bouddhisme"], function (err, result) {
 if (err)
 return console.log(err);
 var file = path.resolve(__dirname + "/thesaurii/boudisme.rdf");
 fs.writeFileSync(file, result);
 })*/

//skos.generatePLMskos();

skos.skosToElasticSynonyms("histoireantiquite")
module.exports = skos;