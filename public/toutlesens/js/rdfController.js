var rdfController=(function(){
    var self={};


    self.searchRDF = function (word) {
        if (!word)
            word = $("#rdfWordInput").val();
        var store = $("#rdfStoreSelect").val();
        var lang = $("#rdfLangageSelect").val();
        var contains = $("#rdfContainsSelect").val();
        //    var relation =$("#rdfRelationSelect").val();
        //   var relations=$("#relationCBX").val();
        var relations = [];
        var relationsCBXs = $("[name=relationCBX]");
        for (var i = 0; i < relationsCBXs.length; i++) {
            if (relationsCBXs[i].checked) {
                relations.push({name: relationsCBXs[i].value, optional: true});
            }
        }
        if (relations.length == 0) {
            alert("select at least one relation type)");
            return;

        }

        var displayType = $("#rdfDisplaySelect").val();

        if (word && word.length > 0)
            self.generateRdfGraph(store, word, relations, lang, contains, displayType);
    }

    self.generateRdfGraph = function (store, word, relations, lang, contains, displayType, callback) {
        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");
        self.currentSource = "RDF"
        //  if (currentDisplayType == "SIMPLE_FORCE_BULK")
        currentDisplayType = displayType;
        self.hidePopupMenu();
        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");

        var payload = {
            queryOntologyDataToNeoResult: 1,
            store: store,
            lang: lang,
            word: word,
            contains: contains,
            relations: relations,
            limit: Gparams.neoQueryLimit
        }
        $.ajax({
            type: "POST",
            url: self.rdfProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                totalNodesToDraw = data.length;
                /*    toutlesensData.prepareRawData(data, false, currentDisplayType, function (err, data, labels, relations) {
                        if (callback)
                            return callback(null, data);
                        nodeColors["BNF"] = "green";
                        linkColors["narrower"] = "blue";
                        linkColors["broader"] = "orange";
                        linkColors["related"] = "red";*/

                //  if (!applyFilters)
                //  filters.initGraphFilters(labels, relations);

                visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                //  toutlesensController.displayGraph(data, "VISJS-NETWORK", self.currentLabels);
                // })
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
                return (err);
            }
        });


    }





    return self;
})()