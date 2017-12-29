

var admin=(function(){

    var arrayExclude = [];
    var wordSelectMode = "include";
    var entities = {};

    var entityTypes={}

    var self={}

    self.elasticExec=function(operation) {
        $("#message").html("");
        var indexName = $("#indexName").val();
        if (!indexName || indexName == "") {
            return alert("enter index name")
        }
        var mappingsType = $("#mappingsType").val();
        var rootDir = $("#rootDir").val();
        //  var doClassifier=$("#doClassifier").val();
        var indexName = $("#indexName").val();


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
        else if (operation == "listAssociatedWords") {
            var size = $("#associatedWordsSize").val();
            var seedWord = $("#seedWord").val();
            size = parseInt(size);
            var minFreq = $("#minFreq").val();
            var stopWords = [];
            $("#wordsSelect option").each(function () {
               var word= $(this).val();
                $("#stopWordsSelect").append($('<option>', {
                    text : word,
                    value : word
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
                stopWords: stopWords
            };

        }



        else if (operation == "createIndexClassifier") {
            var nWords = $("#nWords").val();
            nWords = parseInt(nWords);
            var minFreq = $("#minFreq").val();
            var lang = $("#lang").val();
            minFreq = parseInt(minFreq);
            var ontologies = JSON.parse($("#ontologies").val());

            var includedWords = [];
            $("#entitiesSelect option").each(function () {
                includedWords.push($(this).val());
            });

            payload = {
                createIndexClassifier: 1,
                indexName: indexName,
                nWords: nWords,
                minFreq: minFreq,
                ontologies: ontologies,
                lang: lang,
                includedWords: includedWords


            };

        }


        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var minWordLength = $("#minWordLength").val();
                if (operation == "listAssociatedWords") {
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

                    self.getGoogleApiEntities(array)
                    // common.fillSelectOptions(wordsSelect, array, "label", "key");
                    common.fillSelectOptions(stopWordsSelect, arrayExclude, "label", "key")
                }

                console.log("done")
            }
            , error: function (xhr, err, msg) {
                console.log("ERROR :" + err)
            }

        });


    }

    self.getGoogleApiEntities=function(array) {
        entities={};
        entityTypes={};
        var text = "";
        for (var i = 0; i < array.length; i++) {
            text += array[i].key + ",";
        }
        payload = {
            getGoogleApiEntities: 1,
            text: text,


        };


        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                entities = {}
                var words = [];
                var entityNames=[]
                for (var i = 0; i < data.length; i++) {
                    var name = data[i].name;
                    var type = data[i].type

                    if (!entityTypes[type]) {
                        entityTypes[type] = [];
                    }
                    entityTypes[type].push(name)
                    data[i].synonyms=[];
                    entities[name]=(data[i]);
                    var label=name + "[" + data[i].type + "]";
                    var wikipediaUrl= data[i].metadata.wikipedia_url;
                    if(wikipediaUrl)
                        label+="_w"
                    words.push({name: name, label: label})
                    entityNames.push(name);
                }


                common.fillSelectOptions(wordsSelect, words, "label", "name");


            }
            , error: function (xhr, err, msg) {
                console.log("ERROR :" + err)
            }

        });


    }




    self.setWordNetSynonyms=function(){
var terms=[];
        $("#entitiesSelect option").each(function () {
            terms.push($(this).val());
        });
       var query= {

           "query": {
               "term": {"content.synonyms": "porche"}
           }
       }

        var payload= {
            findTerms: 1,
            indexName: "wordnet_fr",
            type: "wordnet",
            terms: terms



        }

        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                for (var i = 0; i < data.length; i++) {

                    for (var j = 0; j < data[i].synonyms.length; j++) {
                        var syn = data[i].synonyms[j];
                        var entity = entities[syn];
                        if (entity) {
                            for (var k = 0; k < data[i].synonyms.length; k++) {
                                var syn2 = data[i].synonyms[k];
                                if (entities[syn].synonyms.indexOf(syn2) < 0)
                                    entities[syn].synonyms.push(syn2);
                            }

                        }
                    }
                }
            }
            ,error:function (err){
                console.log(err);
            }
            })

    }

    self.enrichThesaurus=function() {
        var ontology = JSON.parse($("#ontologies").val())[0];

        var includedWords = [];
        $("#entitiesSelect option").each(function () {
            includedWords.push($(this).val());
        });
        var lang = $("#lang").val();

        payload = {
            findOntologySKOSterms: 1,
            words: includedWords,
            ontology: ontology,
            lang: lang,
        };
        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var ww = data;
                console.log(JSON.stringify(data, null, 2))
            }, error: function (xhr, err, msg) {
                console.log("ERROR :" + err)
            }
        });
    }


    self.generateThesaurus=function(){
        var selectedEntities=[];
        $("#entitiesSelect option").each(function () {
            selectedEntities.push($(this).val());
        });



        var tree=[]
        for( var keyType in entityTypes){

            var idParent="t_"+Math.round(Math.random()*10000000);
            var parent={parent:"#",id:idParent,text:keyType};
            tree.push(parent);
            for(var i=0;i<entityTypes[keyType].length;i++){
                var entity=entities[entityTypes[keyType][i]];
                if(selectedEntities.indexOf(entity.name)<0){
                    continue;
                }
                var id="c_"+Math.round(Math.random()*10000000);
                var concept={parent:idParent,id:id,text:entity.name};
                tree.push(concept);
              var synNodeId="S_"+id;
                var syns={parent:id,id:synNodeId,text:"synonyms"};
                tree.push(syns);
                if(entity.synonyms.length>0)
                    var xxx=1;
                for(var j=0;j<entity.synonyms.length;j++){
                     var synId="s_"+id;
                     if(entity.synonyms[j]!=entity.name) {
                         var syn = {parent: synNodeId, id: synId, text: entity.synonyms[j]};
                         tree.push(syn);
                     }
                 }


            }


        }

        console.log(JSON.stringify(tree,null,2))
        jsTreeController.load(tree, "treeDiv1")
        $("#treeDiv1").jstree('open_all');

    }




   self.onWordSelect=function(select) {
        var word = $(select).val();
        $('#wordsSelect option[value="' + word + '"]').remove();
        if (wordSelectMode == "include") {

            $('#entitiesSelect').append($('<option>', {
                value: word,
                text: word
            }));
        } else {
            $('#wordsSelect option[value="' + word + '"]').remove();
            $('#stopWordsSelect').append($('<option>', {
                value: word,
                text: word
            }));
        }
    }

    self.addAllWordsToEntitiesSelect=function(){
        var entities=[];
        $("#wordsSelect option").each(function () {
            entities.push($(this).val());
        });
        common.fillSelectOptionsWithStringArray(entitiesSelect,entities)
    }

    self.removeEntities=function(){
        var words=  $('#entitiesSelect').val();
        for(var i=0;i<words.length;i++) {
            var word=words[i];
            $('#entitiesSelect option[value="' +word+ '"]').remove();
            $('#wordsSelect').append($('<option>', {
                value: word,
                text: word
            }));
        }
    }

   self.includeWord= function(select) {
        var word = $(select).val();
        $('#stopWordsSelect option[value="' + word + '"]').remove();
        $('#wordsSelect').append($('<option>', {
            value: word,
            text: word
        }));
    }


    self.entitiesToTree=function(){


    }




   return self;
})()