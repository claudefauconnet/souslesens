var admin = (function () {

    var arrayExclude = [];
    var wordSelectMode = "include";
    var entities = {};

    var entityTypes = {}

    var self = {}

    self.elasticExec = function (operation) {
        $("#message").html("");
        var indexName = $("#indexName").val();
        if (!indexName || indexName == "") {
            return alert("enter index name")
        }
        var mappingsType = $("#mappingsType").val();
        var rootDir = $("#rootDir").val();
        //  var doClassifier=$("#doClassifier").val();
        var indexName = $("#indexName").val();
        if(indexName.match(/[A-Z]/))
            return alert ("index name cannot contain uppercase characters");

        var url = "/elastic";
        var payload;
        if (operation == "indexDocDirInNewIndex") {
            payload = {
                indexDocDirInNewIndex: 1,
                indexName: indexName,
                rootDir: rootDir,
                doClassifier: "false",
                type: mappingsType


            };


        }
        else if (operation == "indexDirInExistingIndex") {
            payload = {
                indexDirInExistingIndex: 1,
                indexName: indexName,
                rootDir: rootDir,
                doClassifier: "false",
                type: mappingsType

            };

        }

        else if (operation == "indexMongo") {
            var mongoDB = $("#mongoDB").val();

            var mongoCollection = $("#mongoCollection").val();
            var mongoQuery = $("#mongoQuery").val();
            //  mongoQuery=JSON.parse(mongoQuery)
            var lang = $("#lang").val();
            minFreq = parseInt(minFreq);
            payload = {
                indexMongoCollection: 1,
                elasticIndex: indexName,
                elasticType: mappingsType,
                mongoDB: mongoDB,
                mongoCollection: mongoCollection,
                mongoQuery: mongoQuery,


            };

        }
        else if (operation == "listEntities") {
            var size = $("#associatedWordsSize").val();
            var seedWord = $("#seedWord").val();
            size = parseInt(size);
            var minFreq = $("#minFreq").val();
            var stopWords = [];
            $("#entitiesSelect option").each(function () {
                var word = $(this).val();
                $("#stopWordsSelect").append($('<option>', {
                    text: word,
                    value: word
                }));
            });
            $("#stopWordsSelect option").each(function () {
                stopWords.push($(this).val());
            });

            var lang = $("#lang").val();
            minFreq = parseInt(minFreq);
            payload = {
                getAssociatedWords: 1,
                indexName: indexName,
                size: size,
                word: seedWord,
                options: {
                    stopWords: stopWords
                }
            };
            if($("#lemmeFilterCBX").prop("checked")){
                payload.options.lemmeFilter=true;
            }
            if($("#WordNetEntitiesFilterCBX").prop("checked")){
                payload.options.wordNetEntitiesFilter=true;
            }

        }


        else if (operation == "thesaurusToClassifier") {
            url = "/rdf";
            var thesaurus = $("#skosInput1").val();
            payload = {
                thesaurusToClassifier: 1,
                indexName: indexName,
                thesaurus: thesaurus,

            };

        }

        self.waitIcon(true);
        $("#message").html("");
        $.ajax({
            type: "POST",
            url: url,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.waitIcon(false);
                var minWordLength = $("#minWordLength").val();
                if (operation == "listEntities") {
                    var array = []

                    for (var i = 0; i < data.buckets.length; i++) {
                        var word = data.buckets[i].key;
                        data.buckets[i].label = word + " (" + data.buckets[i].count + ")";
                        if (word.match(/[a-zA-Z]+/) && word.length > minWordLength && word.indexOf("," < 0))
                            array.push(data.buckets[i])
                        else
                            arrayExclude.push(data.buckets[i])

                    }
                    array.sort(function (a, b) {
                        if (a.count > b.count)
                            return -1;
                        if (a.count < b.count)
                            return 1;
                        return 0;
                    });
                    if ($("#GoogleEntitiesFilterCBX").prop("checked")) {
                        self.getGoogleApiEntities(array)
                        $("#countExtractedEntities").html(array.length);
                        // common.fillSelectOptions(entitiesSelect, array, "label", "key");
                    //    common.fillSelectOptions(stopWordsSelect, arrayExclude, "label", "key")
                    }
                    else{
                        $("#countExtractedEntities").html(array.length);
                        common.fillSelectOptions(entitiesSelect, array, "label", "key")
                    }
                }


                console.log("done")
            }
            , error: function (xhr, err, msg) {
                self.waitIcon(false);
                console.log("ERROR :" + err)
            }

        });


    }

    self.getGoogleApiEntities = function (array) {
        entities = {};
        entityTypes = {};
        var text = "";
        for (var i = 0; i < array.length; i++) {
            text += array[i].key + ",";
        }
        payload = {
            getGoogleApiEntities: 1,
            text: text,


        };

        self.waitIcon(true);
        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.waitIcon(false);
                entities = {}
                var words = [];
                var entityNames = []
                for (var i = 0; i < data.length; i++) {
                    var name = data[i].name;
                    var type = data[i].type

                    if (!entityTypes[type]) {
                        entityTypes[type] = [];
                    }
                    entityTypes[type].push(name)
                    data[i].synonyms = [];
                    entities[name] = (data[i]);
                    var label = name + "[" + data[i].type + "]";
                    var wikipediaUrl = data[i].metadata.wikipedia_url;
                    if (wikipediaUrl)
                        label += "_w"
                    words.push({name: name, label: label})
                    entityNames.push(name);
                }

                $("#countExtractedEntities").html(words.length);
                common.fillSelectOptions(entitiesSelect, words, "label", "name");


            }
            , error: function (xhr, err, msg) {
                self.waitIcon(false);
                console.log("ERROR :" + err)
            }

        });


    }


    self.setWordNetSynonyms = function () {
        var terms = [];
        $("#selectedEntitiesSelect option").each(function () {
            terms.push($(this).val());
        });


        var payload = {
            findTerms: 1,
            indexName: "wordnet_fr",
            type: "wordnet",
            field: "content.synonyms",
            terms: terms


        }
        self.waitIcon(true);
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.waitIcon(false);
                var count = 0;
                var str = "";
                var allsyns = []  // on met à plat tous les synonymes
                for (var i = 0; i < data.length; i++) {
                    allsyns.push(data[i].synonyms);

                }

                for (var i = 0; i < terms.length; i++) {
                    var synArray = [];
                    var term = terms[i];
                    for (var j = 0; j < allsyns.length; j++) {
                        if (allsyns[j].indexOf(term) > -1) {// on cherche chaque terme dans tous le synonymes
                            for (var k = 0; k < allsyns[j].length; k++) {
                                var asyn = allsyns[j][k];

                                if (asyn.indexOf(" ") < 0) {// we remove syns with " "

                                    if (asyn != term && synArray.indexOf(asyn) < 0) {// on affecte
                                        synArray.push(asyn);
                                        count += 1;
                                    }

                                }

                            }
                        }


                    }
                   // entities[term].synonyms = synArray;
                    str += term + ",";
                    for (var j = 0; j < synArray.length; j++) {
                        if(synArray[j]!="_EMPTY_")
                        str += synArray[j] + ",";
                    }
                    str += "\n";

                }


                $("#synonymsTA").text(str);
                //   $( "#vocabularyAccordion" ).accordion( "option", "active", 3);//synonyms

                $("#message").html(" Synonyms done : " + count)
            }
            , error: function (err) {
                self.waitIcon(false);
                console.log(err);
            }
        })

    }


    self.generateOntologyThesaurus = function () {


        var lang = $("#lang").val();
        var ontology = $("#ontology").val();
        var words = []
        $("#selectedEntitiesSelect option").each(function () {
            words.push($(this).val());
        });
        var thesaurusName = $("#indexName").val();


        var payload = {
            generateSkosThesaurusFromWordsListAndOntology: 1,
            words: words,
            ontologies: [ontology],
            lang: lang,
            thesaurusName: thesaurusName

        };
        self.waitIcon(true);
        $("#message").html("");
        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                //  $( "#vocabularyAccordion" ).accordion( "option", "active", 2);
                self.waitIcon(false);
                var name = thesaurusName + "_" + ontology;
                $("#skosInput1").val(name);
                $("#treeDiv1").jstree("destroy");
                skosTree.loadTree({"treeDiv1": "skosInput1"})
                $("#treeDiv1").jstree('open_all');

                skosTree.createTree(name, 'treeDiv2')

                //   var ww = data;
                //  console.log(JSON.stringify(data, null, 2))

            }, error: function (xhr, err, msg) {
                console.log("ERROR :" + err)
                self.waitIcon(false);
            }
        });
    }


    self.generateGoogleNLPthesaurus = function () {
        var thesaurusName = $("#indexName").val();
        var selectedEntities = [];
        $("#selectedEntitiesSelect option").each(function () {
            selectedEntities.push($(this).val());

        });


        var tree = []
        $("#message").html("");
        for (var keyType in entityTypes) {

            var idParent = "t_" + Math.round(Math.random() * 10000000);
            var parent = {parent: "#", id: idParent, text: keyType};
            tree.push(parent);
            for (var i = 0; i < entityTypes[keyType].length; i++) {
                var entity = entities[entityTypes[keyType][i]];
                if (selectedEntities.indexOf(entity.name) < 0) {
                    continue;
                }
                var id = "c_" + Math.round(Math.random() * 10000000);
                var concept = {parent: idParent, id: id, text: entity.name};
                tree.push(concept);
                /*    var synNodeId = "S_" + id;
                    var syns = {parent: id, id: synNodeId, text: "synonyms"};
                    tree.push(syns);
                    if (entity.synonyms.length > 0)
                        var xxx = 1;
                    for (var j = 0; j < entity.synonyms.length; j++) {
                        //  console.log(JSON.stringify(entity.synonyms))
                        var synId = "s_" + id + "_" + j;
                        if (entity.synonyms[j] != entity.name) {
                            var syn = {parent: synNodeId, id: synId, text: entity.synonyms[j]};
                            tree.push(syn);
                        }
                    }*/


            }


        }

        // console.log(JSON.stringify(tree,null,2))
        jsTreeController.load(tree, "treeDiv1")
        $("#treeDiv1").jstree('open_all');
        $("#skosInput1").val(thesaurusName + "_" + "GoogleNLP");
        skosTree.createTree(thesaurusName + "_" + "GoogleNLP", 'treeDiv2')
        //  $( "#vocabularyAccordion" ).accordion( "option", "active", 2);

    }


    self.onWordSelect = function (select) {
        var word = $(select).val();
        $('#entitiesSelect option[value="' + word + '"]').remove();
        if (wordSelectMode == "include") {

            $('#selectedEntitiesSelect').append($('<option>', {
                value: word,
                text: word
            }));
        } else {
            $('#entitiesSelect option[value="' + word + '"]').remove();
            $('#stopWordsSelect').append($('<option>', {
                value: word,
                text: word
            }));
        }
    }

    self.addAllWordsToselectedEntitiesSelect = function () {
        var entities = [];
        $("#entitiesSelect option").each(function () {
            entities.push($(this).val());
        });
        common.fillSelectOptionsWithStringArray(selectedEntitiesSelect, entities)
        //   $( "#vocabularyAccordion" ).accordion( "option", "active", 1);
    }

    self.removeEntities = function () {
        var words = $('#selectedEntitiesSelect').val();
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            $('#selectedEntitiesSelect option[value="' + word + '"]').remove();
            $('#entitiesSelect').append($('<option>', {
                value: word,
                text: word
            }));
        }
    }

    self.includeWord = function (select) {
        var word = $(select).val();
        $('#stopWordsSelect option[value="' + word + '"]').remove();
        $('#entitiesSelect').append($('<option>', {
            value: word,
            text: word
        }));
    }


    self.duplicateThesaurus = function () {

    }


    self.entitiesToTree = function () {


    }
    self.loadSynonyms = function () {
        var ontology = $("#ontology").val();
        var thesaurusName = $("#indexName").val();
        var path="./config/thesaurii/"+thesaurusName + "_" + ontology + ".syn";
        var payload = {
            getFileContent: 1,
            path: path
        }
        $.ajax({
            type: "POST",
            url: "/fs",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                $("#synonymsTA").val(data.result);

            }, error: function (err) {
                admin.setMessage(err, "red")
            }
        })

    }

    self.saveSynonyms = function () {
       var data= $("#synonymsTA").val();
        var ontology = $("#ontology").val();
        var thesaurusName = $("#indexName").val();
        var path="./config/thesaurii/"+thesaurusName + "_" + ontology + ".syn";
        var payload = {
            saveFileContent: 1,
            data:data,
            path: path
        }
        $.ajax({
            type: "POST",
            url: "/fs",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                admin.setMessage("synonyms saved", "blue")

            }, error: function (err) {
                admin.setMessage(err, "red")
            }
        })

    }

    self.waitIcon = function (on) {
        var status = "hidden";
        if (on)
            status = "visible"

        $("#waitImg").css("visibility", status);
    }
    self.setMessage = function (message, color) {
        $("#message").css("color", color);
        $("#message").append(message + "<br>");
    }


    return self;
})()