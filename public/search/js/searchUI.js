var searchUI = (function () {
    var self = {}
    self.authenticationUrl = "../../../authentication";
    self.userIndexes=[];
    self.doLogin = function (group) {
        var login=$("#loginInput").val();
        var password=$("#passwordInput").val();
       // var match=password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/);

        if(!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
            $("#loginMessage").html("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");
        }
        var payload = {
            authentify: 1,
            login: login,
            password: password

    }
        $.ajax({
            type: "POST",
            url: self.authenticationUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                if(group){
                    if(!$.isArray(data))
                        data=[data];
                    if(data.indexOf(group)<0){
                        $("#loginMessage").html("invalid  login or password");
                        return;
                    }

                }

                $("#loginDiv").css("visibility", "hidden");
                $("#panels").css("visibility", "visible");
                $("#searchInput").focus();


            }, error: function (err) {
                $("#loginMessage").html("invalid  login or password");

            }
        })

    }

    self.setUserIndexes = function () {
        var user = "Fauconnet";
        var payload = {
            getUserIndexes: 1,
            user: user
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                advancedSearch.userMappings = data;
                self.userIndexes = []
                for (var key in data) {
                    self.userIndexes.push(key);
                }
                self.userIndexes.sort();
                var indexesCxbs = "<ul>";

                for (var i = 0; i < self.userIndexes.length; i++) {

                    indexesCxbs += "<li><input type='checkbox' checked='checked' onchange='searchUI.search()' name='indexesCbxes' value='" + self.userIndexes[i] + "'> <button class='indexCbxButton' onclick='searchUI.filterIndex(\"" + self.userIndexes[i]+ "\")'>O</button>" + self.userIndexes[i] + "<span id='indexCbxSpan_" + self.userIndexes[i] + "'></span></li>"
                }
                indexesCxbs += "<ul>";
                $("#sourcesDiv").html(indexesCxbs);

            }, error: function (e) {
            }

        })
    }

    self.search = function (options, callback) {
if(!options){
    options={}
}

        var from;
        if (!options.start) {
            from = 0;
            currentPage = 1
        }
        else {
            from = options.start;
            if (options.pageOffset)
                currentPage = options.pageOffset;
            if (options.pageIncrement)
                currentPage += pageIncrement;
        }

        $("#dialog").css("visibility", "hidden")

        //  $("#subQuerySpan").css("visibility", "visible")
        //  $("#addWordInput").val("");


        $("#conceptDiv").html("");
        $("#countDiv").html("");
        $("#resultDiv").html("");
        $("#associatedWordsDiv").html("");

        var indexes = "";
        var i = 0;
        $('[name=indexesCbxes]:checked').each(function () {
            if (i++ > 0)
                indexes += ",";
            indexes += ($(this).val());
        });


        var index = $("#indexInput").val();
        var word = $("#searchInput").val().trim();
        word=word.toLowerCase();
        var booleanSearchMode = $("#booleanSearchSelect").val();

        var addWordInput = $("#addWordInput").val();
        addWordInput=addWordInput.toLowerCase();

        if (addWordInput && addWordInput.length > 0) {
            self.addAssociatedWord(addWordInput, true);
        }

        if (word != oldWord) {
            associatedWords = []
        }
        oldWord = word;
        var slop = $("#slopInput").val();

     /*   if (slop != "" && word.indexOf(" ") > 0 && word.indexOf("*") > 0) {

            $("#resultDiv").html("Impossible to have a query with this pattern : xxx* yyy and a distance between the two words. remove * or set distance to 0");
            return;
        }*/



        var classifierSourceStr = $("#classifierSource").val();

        var size = fetchSize;
        if (callback || self.isFieldQuery()) {
            size = maxCsvSize;
        }
        var payload = {
            findDocuments: 1,
            options: {
                from: from,
                size: size,
                indexName: indexes,
                word: word,
                booleanSearchMode: booleanSearchMode,
                getAssociatedWords: {
                    indexName: indexes,
                    word: associatedWords,
                    size: 100,
                    iterations: 5,
                    classifierSource: classifierSourceStr

                }
            }
        };

        if(advancedSearch.queryObject.query){
            payload.options.queryObject=advancedSearch.queryObject.query;
            payload.options.indexName=advancedSearch.queryObject.indexName;
            payload.options.getAssociatedWords.indexName=advancedSearch.queryObject.indexName;


        }
        if (currentType)
            payload.options.type = currentType
        if (slop != "")
            payload.options.slop = parseInt(slop);
        if (associatedWords.length > 0)
            payload.options.andWords = associatedWords;

        if(options.format)
            payload.options.format = options.format;
        var queryField = $("#queryFieldSelect").val();
        if (queryField != "") {
            payload.options.queryField = queryField;
        } else {
            $("#queryFieldSpan").css("visibility", "hidden");
        }

        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.processSearchResults(data, callback);

            }
            , error: function ( err) {
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });

    }

   self.processSearchResults=function(data, callback) {
        $("#infos").css("visibility", "visible");
        $(".rightPanelTd").css("visibility", "visible");
        $("#clearSearchInputsImg").css("visibility", "visible");

        if (callback) {
            return callback(null, data)
        }
        icons = {};//data.icons;

        if (self.isFieldQuery()) {
            var visData = connectors.elasticSkosToVisjs(data.docs);
            visjsGraph.draw("graphDiv", visData);
            //  self.showResults((data.docs);
        } else {
            self.showResults(data.docs);
            self.showPageControls(data.total);
            if (data.associatedWords) {
                self.showAssociatedWords(data.associatedWords.buckets);
                self.showIndexesStats(data.stats);
                self.showTypes(data.associatedWords.types);
                self.showClassifier(data.associatedWords.classifier);
            }
        }
    }


    self.showResults = function (data) {

        if (data.length == 0) {
            $("#resultDiv").html(" No result   Try to add an * (wildcard) at the end of the word")

            return;
        }
        var html = "<table>";


        for (var i = 0; i < data.length; i++) {
            html += "<tr>";
            html += "<td>";
            html += self.getListDisplayHtml(data[i]);

            html += "</tr>";
            html += "</td>";
        }
        html += "</table>";


        $("#resultDiv").html(html);
    }

    self.showPageControls = function (total) {
        var maxPagesLinks = 10;
        $("#countDiv").html(total + " documents found");
        if (total > fetchSize) {

            var str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pages ";
            var k = 1

            str += "<a href='javascript:searchUI.search({start:" + currentPage * fetchSize + ",pageIncrement:1})'> next  </a>&nbsp;&nbsp;";
            if (currentPage > 1)
                str += "<a href='javascript:searchUI.search({start:" + (currentPage - 1) * fetchSize + ",pageIncrement:-1})'> previous  </a>&nbsp;&nbsp;";


            for (var i = 1; i < total; i++) {
                var linkClass = "";
                if (k == currentPage)
                    linkClass = " class='currentPageLink' ";


                if (i % fetchSize == 0) {
                    str += "<a " + linkClass + "href='javascript:searchUI.search({start:" + (k - 1) * fetchSize + ",pageIncrement:0,pageOffset:" + k + "})'>" + k + "</a>&nbsp;&nbsp;"
                    k++;
                }



                if (i > maxPagesLinks * fetchSize) {
                    str += "...";
                    break;
                }
            }


            $("#pages").html(str)
        }
    }


    self.showAssociatedWords = function (data) {
        if (!data)
            return;
        var html = "<ul>"
        data.sort(function (a, b) {
            if (a.count > b.count)
                return -1;
            if (a.count < b.count)
                return 1;
            return 0
        })
        for (var i = 0; i < data.length; i++) {
            if (data[i].key.length > 3)
                html += "<li>" + "<a href='javascript:searchUI.addAssociatedWord(\"" + data[i].key + "\")'>" + data[i].key + " (" + data[i].count + ")</a></li>"
        }
        html += "</ul>";
        $("#leftPanel").css("visibility", "visible");
        $("#associatedWordsDiv").html(html);

    }

    self.getListDisplayHtml = function (obj) {


        if (self.isFieldQuery()) {
            return JSON.stringify(obj);
        }

        var str = "<div class='docListResult'>";
        if (icons["docTypes"] && icons["docTypes"][obj.type])
            str += "<img  src='./icons/" + icons["docTypes"][obj.type] + "'>";

        str += "<img style='border-style: solid;border-color: #0000cc;border-width: 1px;border-radius: 8px' title='pre-visualize' onclick='searchUI.showDocContent(\"" + obj._id + "\",\"" + obj._index + "\")' src='icons/details.png' width='20px'> </a>&nbsp;&nbsp;&nbsp;";
        str += "<i>" + obj._index + "</i>&nbsp;";
        if (obj.path) {
            var path = decodeURIComponent(obj.path)
            var p = path.lastIndexOf("/");
            if (p < 0)
                p = path.lastIndexOf("\\");
            if (p > -1)
                path = path.substring(p + 1)
            str += "<span class=title>" + path + "</span>"
        }
        else if (obj.title) {
            str += "<span class=title>" + obj.title + "</span>"
        }
        else
            str += "<span class=title>" + obj[0] + "</span>"

        if (obj.date) {
            if (obj.date.length > 10)
                obj.date = obj.date.substring(0, 10);
            str += "&nbsp;&nbsp;" + obj.date + "&nbsp;&nbsp;";
        }
        if (obj.path) {

            var path = decodeURIComponent(obj.path)
            //  str +=  "<a href='file://"+path+"' > doc</a>";
            //  str += "<img  title='load document' onclick='self.getOriginalDocument(\"" + obj.path + "\")' src='./icons/document.png' width='20px'> </a>";

        }

        //   str += "<img title='go to document' onclick='self.getOriginalDocument(\"" + obj.path + "\")' src='document.png' width='15px'> </a><br>";
        // str += "<span class=path>" + obj.path + "</span><br>";

        str += "<ul>";
        for (var i = 0; i < obj.highlights.length; i++) {
            if (i % 2 == 0)
                str += "<li><span class=highlight>" + obj.highlights[i] + "</span>";
            else {
                str += " .... <span class=highlight>" + obj.highlights[i] + "</span>";
                str += "</li>"
            }

        }
        str += "</ul>";
        str += "<div>"
        return str;
    }




    self.addAssociatedWord = function (word, dontSearch) {
        if(associatedWords.indexOf(word)<0)
        associatedWords.push(word);
        self.showAssociatedWordsBreadcrumb();
        if (!dontSearch)
            self.search();


    }


    self.showAssociatedWordsBreadcrumb = function () {
        var str = "";
        for (var i = 0; i < associatedWords.length; i++) {
            str += "<a href='javascript:searchUI.removeAssociatedWord(" + i + ")'>" + associatedWords[i] + "</a>&nbsp;";
        }
        $("#associatedWordsBreadcrumbDiv").html(str)

    }

    self.removeAssociatedWord = function (index) {
        if (associatedWords[index] == $("#addWordInput").val()) {
            $("#addWordInput").val("")
        }
        associatedWords.splice(index, 1);
        self.showAssociatedWordsBreadcrumb();
        self.search();
    }

    self.showClassifier = function (data) {

        /*   $('#rightPanel').html("<br><br><br><br><br><br><br><br>Concepts associes<br><br> <div id='conceptDiv'></div>")*/
        currentClassifierData = data


        jsTreeController.load(data, 'conceptDiv', function (node) {

            if (node.children.length > 0) {
                for (var i = 0; i < currentClassifierData.length; i++) {
                    if (currentClassifierData[i].text == node.text) {
                        for (var j = 0; j < currentClassifierData[i].children.length; j++) {
                            self.addAssociatedWord(currentClassifierData[i].children[j].word);
                        }
                    }
                }
            } else {
                var word = node.original.word;

                self.addAssociatedWord(word);
            }


        });


    }

    self.showTypes = function (types) {
        if (!types)
            return;
        //  var str="<select onclick='self.onTypeClick(this)' size='"+(types.length+1)+"'><option></option>";
        var str = "<ul><li onclick=searchUI.onTypeClick('')>all types</li>";
        for (var i = 0; i < types.length; i++) {
            str += "<li onclick=searchUI.onTypeClick('" + types[i] + "')>" + types[i] + "</li>";
        }
        str += "</ul>";
        $("#typesDiv").html(str);
    }

    self.onTypeClick = function (type) {
        //  var type=$(select).val();
        if (type && type.length > 0) {
            currentType = type;
        }
        else
            currentType = null;
        self.search();
    }


    self.showDocContent = function (id, index) {
        $("#dialogLeftDiv").html("");

        currentDocId = id;
        //   var index = $("#indexInput").val();
        var words = associatedWords;
        var word = $("#searchInput").val()
        if (words.indexOf(word) < 0)
            words.push(word);

        var payload = {
            findDocumentsById: 1,
            indexName: index,
            ids: [id],
           words: words
        };

        console.log(JSON.stringify(payload, null, 2))
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                currentDocHighlightIndex = 0;
                currentDocFindWordIndex = 100;
                dialogContentDivScroll = 0;
                $("#scrollToHighlightUpButton").css("visibility", "hidden");
                words.pop(word);
                if (data.docs && data.docs.length > 0) {
                    var doc = data.docs[0];

                    for (var i = 0; i < doc.highlights.length; i++) {
                        var highlight = doc.highlights[i];
                        var highlight2 = highlight.replace(/<em>/g, "");
                        highlight2 = highlight2.replace(/<\/em>/g, "");
                        highlight = highlight.replace(/<em>/g, "<b>");
                        highlight = highlight.replace(/<\/em>/g, "</b>");
                        var p = doc.content.indexOf(highlight2);
                        if (p > -1) {

                            //   doc.content=doc.content.substring(0,p)+"<em>"+doc.content.substring(p+1,p+1+highlight.length)+"</em>"+doc.content.substring(p+1)
                            doc.content = doc.content.substring(0, p) + "<em id='em_" + i + "'>" + highlight + "</em>" + doc.content.substring(p + 1 + highlight.length)
                        }

                    }


                    var html = "<b>source</b>: " + doc._index + "&nbsp;";
                    html += "<b>title</b>: " + doc.title + "<br>";
                    html += "<table  class='docContentFields'>";
                    var excludedKeys = ["highlights", "content", "title", "_id", "_index", "type"]

                    for (var key in doc) {
                        if (excludedKeys.indexOf(key) == -1) {

                            if (key == "path") {
                                doc[key] = decodeURIComponent(doc[key]);
                                doc[key] = "<a href='" + doc[key] + "'>" + doc[key] + "</a>";
                            }
                            html += "<tr><td style='background-color: #999999;font-weight: bold'>" + key + "</td><td>" + doc[key] + "</td></tr>"
                        }
                    }


                    html += "</table>";
                    html += doc._id;
                    html += doc.content.replace(/[\n\r]/g, "<br>");

                    /*    mode = data.mode[doc.type];
                        if (mode && mode.source == "MongoDB") {
                            var str = "<button onclick=searchUI.editMongoForm('" + doc.mongoId + "','" + doc._id + "')>Edit</button>"
                            $("#dialogLeftDiv").append(str);
                            $("#dialogLeftDiv").css("visibility", "visible");
                        }*/

                    $("#dialog").css("visibility", "visible");
                    $("#dialog").load("htmlSnippets/showDocContent.html", function () {
                        $('#advancedSearchDialog_fieldInput').attr('disabled', 'disabled');
                        $("#dialogContentDiv").html(html);
                        var title="";
                        if(doc.title)
                            title= doc.title;
                        $("#detailsTitle").html(title);



                    })
                }

            }
            , error: function (xhr, err, msg) {
                words.pop(word);
                return (err);
            }

        })


    }

    self.getOriginalDocument = function (path) {

        var path = decodeURIComponent(path)
        console.log(path)

        $("#originalDocIframe").attr("src", "file:///+" + path);
        return;
        /*   $("#dialogContentDiv").html("<iframe width='500' height='500' src='file:///+"+path+"'>")
           $("#dialog").css("visibility", "visible");*/
        //   window.location.href = "file:///" + path;

        var payload = {
            getOriginalDocument: 1,
            docRemotePath: path
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            // dataType: "json",
            success: function (data, textStatus, jqXHR) {
                console.log("self.getOriginalDocument ok");
                $("#dialogContentDiv").html(data);
                $("#dialog").css("visibility", "visible");
            }
            , error: function (xhr, err, msg) {
                console.log(xhr);
                return (err);
            }
        });


    }

    self.editMongoContent = function (id) {
        $("#dialogContentDiv").html(html);
        $("#dialog").css("visibility", "visible");
    }


    self.admin = function () {
        var html = "<button onclick='saveClassifier()'>save</button><br></button><div id='self.adminClassifierTree'></div>";
        $("#dialogContentDiv").html(html);
        $("#dialog").css("visibility", "visible");
        /*       self.adminClassifierTree.load(data, 'conceptDiv', function (functionName, data) {
         if (functionName == "self.addAssociatedWord")
         self.addAssociatedWord(data);

         });*/
    }

    self.findSimilarDocuments = function () {
        var index = $("#indexInput").val();
        var payload = {
            findSimilarDocuments: 1,
            indexName: index,
            docId: currentDocId,
            minScore: 3,
            size: 100
        };


        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var ids = [];
                var html = "<table border='1'><tr><td>score</td><td>title</td><td>content</td></tr>";
                for (var i = 0; i < data.length; i++) {
                    ids.push(data[i]._id);
                    var title = data[i].title;
                    var content = data[i].content;
                    var score = data[i]._score;
                    html += "<tr>";
                    html += "<td>" + score + "</td><td>" + title + "</td><td>" + content + "</td>";
                    html += "</tr>";
                }
                currentAssociatedDocIds = ids;
                html += "</table>";
                $("#dialogContentDiv").html(html);

                if (false) {

                    //associatedTerms
                    var payload = {
                        iterations: 5,
                        getAssociatedWords: 1,
                        indexName: index,
                        word: {ids: ids},
                        size: 20
                    };

                    $.ajax({
                        type: "POST",
                        url: elasticUrl,
                        data: payload,
                        dataType: "json",
                        success: function (data, textStatus, jqXHR) {
                            var dialogWordsSelect = "<select size='20' id='similarDocsAssociatedWords' multiple='multiple'>"
                            for (var i = 0; i < data.length; i++) {
                                dialogWordsSelect += "<option value='" + data[i].key + "'>" + data[i].key + " (" + data[i].count + ")" + "</option>"
                            }
                            dialogWordsSelect += "</select><br>";
                            dialogWordsSelect += "<button  onclick='self.filterAssocatedDocs(true)'>filter</button>"

                            $("#dialogLeftDiv").html(dialogWordsSelect);

                            var xx = data;
                        }
                    })

                }
            }

        })
    }

    self.filterAssocatedDocs = function (withWords) {
        var index = $("#indexInput").val();


        var payload = {
            findDocumentsById: 1,
            indexName: index,
            ids: currentAssociatedDocIds,

        }
        if (withWords) {
            var words = $("#similarDocsAssociatedWords").val();
            payload.words = words;
        }

        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var html = "<table border='1'><tr><td>title</td><td>content</td></tr>";
                var data = data.docs;
                for (var i = 0; i < data.length; i++) {
                    var content = "<ul>";

                    for (var j = 0; j < data[i].highlights.length; j++) {
                        content += "<li>" + data[i].highlights[j] + "</li>"
                    }
                    content += "</ul>";
                    var title = data[i].title;

                    var score = data[i]._score;
                    html += "<tr>";
                    html += "<td>" + title + "</td><td>" + content + "</td>";
                    html += "</tr>";
                }

                html += "</table>";
                $("#dialogContentDiv").html(html);
                var xx = data;
            }
        });

    }

    self.editMongoForm = function (mongoId, elasticId) {
        var url = "./form.html";
        $("#dialogLeftDiv").css("visibility", "hidden");

        $("#dialogContentDiv").load(url, function () {

            loadFormDataFromMongo(mode.dbName, mode.collectionName, mongoId, elasticId)

        })
    }

    self.closeDialog = function () {
        $("#dialogContentDiv").html("");
        $("#scrollToHighlightUpButton").css("visibility", "hidden");
        $("#dialog").css("visibility", "hidden")
    }

    self.showMongoForm = function () {
        var url = "./form.html";
        $("#dialogLeftDiv").css("visibility", "hidden");
        $("#dialogContentDiv").load(url, function () {
            displayNewForm();
            $("#dialog").css("visibility", "visible")

        })

    }

    self.toCsv = function () {
        self.search({format:"CSV"}, function (err, data) {
            var csvFields = data.csvFields;
            data = data.docs;
            var str = "";
            if (data.length == 0)
                return;
            var keys = ["_index"];
            if (csvFields && csvFields.length > 0) {
                keys = csvFields;
            }
            else {
                for (var i = 0; i < data.length; i++) {
                    for (var key in data[i]) {
                        if (keys.indexOf(key) < 0) {
                            if (key != "content") {
                                keys.push(key);
                            }
                        }

                    }

                }
            }
            str +="source;"
            for (var j = 1; j < keys.length; j++) {
                str += keys[j] + ";"

            }
            str += "\n";

            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    var value = data[i][keys[j]];
                    if (!value || value == "undefined")
                        value = "";
                    str += ("" + value).replace(/[\n\r\;]/g, ".") + ";"
                }
                str += "\n";
            }

            var name = $("#searchInput").val();
            fileName = "souslesensSearch_" + name + ".csv";

            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,'
                + encodeURIComponent(str));
            element.setAttribute('download', fileName);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);


        })
    }

    self.isFieldQuery = function () {
        var field = $("#queryFieldSelect").val();
        if (!field || field == "")
            return false;
        return true;
    }


    self.scrollToHighlight = function (amount) {
        currentDocHighlightIndex += amount;
        if (currentDocHighlightIndex > 0)
            $("#scrollToHighlightUpButton").css("visibility", "visible");
        else
            $("#scrollToHighlightUpButton").css("visibility", "hidden");
        var h = $("#dialogContentDiv").height() / 2
        var z = $("#em_" + (currentDocHighlightIndex - 1)).offset().top;
        z -= h;
        z = dialogContentDivScroll + (z);
        $("#dialogContentDiv").animate({scrollTop: (z)}, 500);
        dialogContentDivScroll = z

    }

    self.scrollToFindWord = function (word, amount) {

        if (currentDocFindWordIndex > 100)
            $("#scrollToWordUpButton").css("visibility", "visible");
        else
            $("#scrollToWordUpButton").css("visibility", "hidden");

        var text = $("#dialogContentDiv").html();


        // remove selected word em
        var text = $("#dialogContentDiv").html();
        //    text = text.replace(/wordEmSelected/gm, "wordEm");
        //  var p = text.indexOf("wordEmSelected");


        // remove all word em if change word
        var strEm = '<em class="wordEm">';
        if (word != currentFindWord.str) {


            text = text.replace(/<em.* class="wordEm">.*<\/em>/, currentFindWord.str);
            text = text.replace(/<\/em>/, "");
            currentFindWord.str = word;
            currentFindWord.p = 0;
            //set new word ems
            var regex = new RegExp(word, "gmi");
            var text = text.replace(regex, strEm + word + "</em>");

        }

        $("#dialogContentDiv").html(text);


        // set selected em
        var p = text.indexOf("wordEmSelected", currentFindWord.p);
        if (p < 0)
            p = 0;
        p = currentFindWord.p + p + strEm.length;
        currentFindWord.p = p;
        var strEmSelected = '<em class="wordEm wordEmSelected">' + word + "</em>";
        text = text.substring(0, p) + strEmSelected + text.substring(p + strEmSelected.length)
        $("#dialogContentDiv").html(text);


        var z = $(".wordEmSelected").offset().top;
        var h = $("#dialogContentDiv").height() / 2
        z -= h;
        z = dialogContentDivScroll + (z);
        $("#dialogContentDiv").animate({scrollTop: (z)}, 500);
        dialogContentDivScroll = z


    }

    self.clearSearchInputs = function () {
        associatedWords = [];
        $("#associatedWordsDiv").html("");
        $("#searchInput").val("");
        $("#associatedWordsBreadcrumbDiv").html("");
        $("#queryTextDiv").html("");


        $("#leftPanel").css("visibility", "hidden")
        $("#infos").css("visibility", "hidden")
        $("#resultDiv").html("");
        $("#typesDiv").html("");
        $("#classifiersDiv").html("");


    }

    self.showIndexesStats = function (data) {
for(var i=0;i<self.userIndexes.length;i++){
    $("#indexCbxSpan_" + self.userIndexes[i]).html(" (0)");
}
      //  $("#sourcesDiv").html(indexesCxbs)
        for (var i = 0; i < data.length; i++) {
           // var str = + data[i].key
            $("#indexCbxSpan_" + data[i].key).html(" (" + data[i].count + ")");
            $("[name=indexCbxSpan] [value="+data[i].key+"]").prop("checked",true);

          //  indexesCxbs += "<li><input type='checkbox' checked='checked' name='indexesCbxes' value='" + data[i].key + "'>" + data[i].key+" ("+ data[i].count+")</li>"
        }
         //  indexesCxbs += "<ul>";
       // $("#sourcesDiv").html(indexesCxbs);

    }

    self.filterIndex = function (index0) {
        $('[name=indexesCbxes]').each(function () {
            var index = $(this).val();
            if (index != index0)
                $(this).prop('checked', false);
            else
                $(this).prop('checked', "checked");
        });
        self.search();
    }

    return self;


})();