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
var textOutputs = (function () {
    var self = {};
//moved  var jsonHtml = "";
//moved  var outputFormat = "";

    self.listTreeResultToHtml = function (jsonTree, withAttrs) {
        outputFormat = "HTML";
        jsonHtml = jsonTree;
        var str = "";
        str += "<ul>";


        function recurse(node) {

            str += self.printNode(node, withAttrs);

            if (!node.children || node.children.length == 0)
                return;
            str += "<ul>"
            for (var i = 0; i < node.children.length; i++) {
                recurse(node.children[i])
            }
            str += "</ul>"
        }

        recurse(jsonTree);
        str += "</ul>"
        var html = "<button onclick='downloadHtml()'>Telecharger</button>&nbsp;<button onclick='	listResultToHtml(jsonHtml,false);'>Exclure les proprietes</button><br>";
        html += '<div id="htmlListDiv" style="overflow: scroll;width:' + (totalWidth / 3 * 2) + 'px;height:' + (totalHeight - 100) + 'px;background-color:\'white\' ">' + str + '</div>'

        $("#textDiv").html(str);



    }


    self.printNode = function (node, withAttrs) {
        var str = "";
        var label = "";
        var color = "black";
        if (true) {//node.nodeType && node.nodeType == "node" && node.parentNodeType && node.parentNodeType != "label") {
            label = "" + node.label + ".";
            color = nodeColors[node.label];
            if (!color)
                color = "brown";
            label = "<span style='color:" + color + "'>" + label + "</span>";
        }


        var rel = "";
        if (node.relType) {

            if (node.relDir && node.relDir == "normal")
                rel = " ----" + node.relType + " ---->";
            else if (node.relDir && node.relDir == "inverse")
                rel = " <----" + node.relType + " ----";
            else
                rel = node.relType
        }
        rel = "<span style='font-size:10px'>" + rel + "</span>";

        var name = node.name
        var match = /__[0-9]*/.exec(name);
        if (match) {
            var p = match.index;
            if (p > -1)
                name = name.substring(0, p);
        }
        if (node.nodeType && node.nodeType == "label") {
            color = nodeColors[name];
            name = "<span style='font-size:18px;color:" + color + ";font-weight:bold'>" + name + "</span>";
        }

        var deco = "";
        if (node.decoration && node.decoration.value) {
            var color = "red";
            if (node.decoration.color)
                color = node.decoration.color
            deco = "<span style='font-size:18px;color:" + color + ";font-weight:bold'>" + node.decoration.property + "=" + node.decoration.value + "</span>";
        }
        var attrs = "";
        if (withAttrs)
            self.getNodeAttrsInfo(node);
        var anchor = "<a href='javascript:toutlesensController.dispatchAction(\"onLinkClick\"," + node.id + ")'>";
        str += "<li>" + rel + label + anchor + name + "</a>" + deco + attrs + "</li>";


        return str;
    }


    self.getRelationAttrsInfo = function (node) {

        var infoObj = currentRelation.target.relProperties;
        var relDir = currentRelation.target.relDir;
        str = "Relation <BR>";
        if (relDir = "normal")
            str += "<B>" + currentRelation.source.name + "<br>   --" + currentRelation.target.relType + "--> <br> " + currentRelation.target.name + "</B><BR>"

        str += "<ul>";

        for (var key in infoObj) {
            str += "<li>" + key + " : " + infoObj[key] + "</li> ";
        }
        str += "<ul>"
        return str;

    }

    self.getNodeAttrsInfo = function (node) {


        // if (node.nodeType != "node" && node != "root") return "";
        var str = "";
        var keysToExclude = ["id", "type", "nom", "name", "imageBlog", "subGraph", "myId", "label"];
        var orderedKeys = [];// [ "nom", "datedebut", "datefin", "fonction" ];

        for (var i = 0; i < orderedKeys.length; i++) {
            var key = orderedKeys[i];
            if (node[key])
                str += "<i>" + key + "</i> : " + node[key] + "<br>";
        }
        var i = 0;

        node = node.neoAttrs
        for (var key in node) {

            if (node[key] && ("" + node[key]).toLowerCase().indexOf("http") == 0)
                node[key] = "<a href='" + node[key] + "' target =='_blank'>cliquez ici</a>"

            if (keysToExclude.indexOf(key) < 0 && orderedKeys.indexOf(key) < 0) {

                if (i++ > 0)
                    str += " ; "
                str += "<i>" + key + "</i> : " + node[key];
            }

        }
        return "<div style='font-size:10px;color:purple;font-weight:normal;'>" + str + "</div>"
// "<div style='font-size:10px;background-color:#eef;font-weight:normal;
// border-width:1px;border-style :solid'>"+str+"</div>"
    }

    self.downloadHtml = function () {
        var str = $("#textDiv").html();
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,'
            + encodeURIComponent(str));
        element.setAttribute('download', "exportToutLesens.html");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }


    self.downloadTextOutput = function () {

        //   var output = $("#representationSelect").val();
        var extension = "csv";
        var fileName = "";
        var str = "";

        if (outputFormat == "HTML") {
            extension = "html";
            str = $("#textDiv").html();


        } else if (outputFormat == "CSV") {
            str=self.getCSV();
        }

        if (currentObject)
            fileName = "souslesens_" + currentObject.label + "_" + currentObject.name + "." + extension;
        else
            fileName = "souslesens_" + new Date() + "." + extension;
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,'
            + encodeURIComponent(str));
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

    }

    self.getCSV = function () {
        var str = "";
        for (var i = 0; i < currentFlattenedData.length; i++) {
            var line = currentFlattenedData[i];
            for (var j = 0; j < line.length; j++) {
                str += line[j] + ";";
            }
            str += "\n";

        }
        return str;


    }

    self.drawCSV = function (json) {
        outputFormat = "CSV";
       var spreadSheetData= toutlesensData.formatTreeToCsv(json);

        var maxCols = 0;
        for (var i = 0; i < spreadSheetData.length; i++) {
            maxCols = Math.max(maxCols, spreadSheetData[i].length);
        }

        var header = [];
        var j = 1
        for (var i = 0; i < maxCols; i++) {
            var title = "relation"
            if (i % 2 == 0)
                title = "noeud " + j++
            header.push({
                title: title
            });
        }
        for (var i = 0; i < spreadSheetData.length; i++) {
            while (spreadSheetData[i].length <= maxCols) {
                spreadSheetData[i].push("");
            }
        }
        currentFlattenedData = spreadSheetData;

        var str = "<table class='spreadsheet' border='0'>";
        str += "<tr>";
        for (var i = 0; i < header.length; i++) {
            str += "<td>" + header[i].title + "</td>";
        }
        str += "</tr>";

        for (var i = 0; i < spreadSheetData.length; i++) {
            str += "<tr>";
            for (var j = 0; j < header.length; j++) {
                var str2=self.formatNodeName(spreadSheetData[i][j]);
                str += "<td>" + str2 + "</td>";
            }
            str += "</tr>";
        }

// var html="<button
// onclick='downloadHtml()'>Telecharger</button>";//&nbsp;<button onclick='
// listResultToHtml(jsonHtml,false);'>Exclure les proprietes</button><br>";
// html+='<div id="htmlListDiv" style="overflow:
// scroll;width:'+(totalWidth/3*2)+'px;height:'+(totalHeight-100)+'px;background-color:\'white\'
// ">' +str+'</div>'
        $("#textDiv").html(str);

    }


    self.drawNodesOnlyTable = function (neoResult) {

        var data = neoResult;
        /*	if (neoResult.results && neoResult.results[0]) {
         data = neoResult.results[0].data;
         variables = neoResult.results[0].columns;
         }

         else {
         data = neoResult[0].data;
         variables = neoResult[0].columns;
         }*/

        var outData = [];
        var keysToExclude = ["name", "imageBlog", "subGraph", "myId"];
        var orderedKeys = ["label", "nom", "datedebut", "datefin", "fonction"];
        var str = "";
        var header = "";
        var keys = ["label", "nom"];
        for (var i = 0; i < data.length; i++) {

            var obj = data[i].n.properties;
            obj.label = data[i].n.labels[0];
            for (var key in obj) {
                if (keys.indexOf(key) < 0 && keysToExclude.indexOf(key) < 0) {
                    keys.push(key);
                }
            }

        }
        for (var i = 0; i < keys.length; i++) {

            header += "<td>" + keys[i] + "</td> ";
        }

        for (var i = 0; i < data.length; i++) {
            str += "<tr>"
            var obj = data[i].n.properties;
            obj.label = data[i].n.labels[0];
            for (var j = 0; j < keys.length; j++) {
                var str2 = obj[keys[j]] ? obj[keys[j]] : "";
                str += "<td>" + str2 + "</td> ";
            }

            str += "</tr>";
        }


        currentObject = {
            label: "export",
            name: "_sousLeSens"
        }
        str = "<table class='spreadsheet'><tr>" + header + "<tr>" + str + "</table>";
        $("#textDiv").css("visibility", "visible");
        $("#textDiv").html(str);



    }

    self.drawCSV_DataTable = function (json) {

        toutlesensData.formatTreeToCsv(json);

        var maxCols = 0;
        for (var i = 0; i < spreadSheetData.length; i++) {
            maxCols = Math.max(maxCols, spreadSheetData[i].length);
        }

        var header = [];
        var j = 1
        for (var i = 0; i < maxCols; i++) {
            var title = "relation"
            if (i % 2 == 0)
                title = "noeud " + j++
            header.push({
                title: title
            });
        }
        for (var i = 0; i < spreadSheetData.length; i++) {
            while (spreadSheetData[i].length <= maxCols) {
                spreadSheetData[i].push("");
            }
        }
        currentFlattenedData = spreadSheetData;
        // spreadSheetData.splice(0,0,header)
        /*
         * $('#spreadsheetDiv').handsontable({ data : spreadSheetData, colWidths:
         * 150, rowHeaders : true, contextMenu : [ "remove_row" ], columnSorting :
         * true, colHeaders : header,
         *
         * });
         */

        if ($.fn.dataTable.isDataTable('#table_Graph')) {

            $('#table_Graph').DataTable().destroy();
            $('#table_Graph').html("");

        }

        var frenchDT = {
            "sProcessing": "Traitement en cours...",
            "sSearch": "Rechercher&nbsp;:",
            "sLengthMenu": "Afficher _MENU_ &eacute;l&eacute;ments",
            "sInfo": "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
            "sInfoEmpty": "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
            "sInfoFiltered": "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
            "sInfoPostFix": "",
            "sLoadingRecords": "Chargement en cours...",
            "sZeroRecords": "Aucun &eacute;l&eacute;ment &agrave; afficher",
            "sEmptyTable": "Aucune donn&eacute;e disponible dans le tableau",
            "oPaginate": {
                "sFirst": "Premier",
                "sPrevious": "Pr&eacute;c&eacute;dent",
                "sNext": "Suivant",
                "sLast": "Dernier"
            },
            "oAria": {
                "sSortAscending": ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
            }
        }
        $('#table').dataTable().fnClearTable();
        // initialisation des liens
        $('#table_Graph').DataTable({
            data: spreadSheetData,
            columns: header,
            "scrollX": true,
            "scrollY": true,
            language: frenchDT,
            click: clickDatatable

        });

    }
    self.decodePath = function (path) {
        if (!path)
            return "";
        return path.replace(/%2F/g, "/");
    }

    self.formatNodeInfo = function (obj) {
        var str = "";
        var imageBlog;
        var dbPediaInited = false;
        // var keysToExclude = [ "id", "name", "imageBlog", "subGraph" ];
        var keysToExclude = ["name", "imageBlog", "subGraph", "myId"];
        var orderedKeys = ["label", "nom", "datedebut", "datefin", "fonction"];

        for (var i = 0; i < orderedKeys.length; i++) {
            var key = orderedKeys[i];
            if (obj[key])
                str += "<i>" + key + "</i> : " + obj[key] + "<br>";
        }

        for (var key in obj) {
            if (key == "path") {
                self.decodePath(obj[key]);
                toutlesensController.showThumbnail(str);


                obj[key] = "<a href='javascript:showImage(\"" + encodeURI(Gparams.imagesRootPath + str) + "\")'>voir <a/>";
            }
            if (obj[key] && ("" + obj[key]).toLowerCase().indexOf("http") == 0)
                obj[key] = "<a href='" + decodeURIComponent(obj[key])
                    + "' target =='_blank'>cliquez ici</a>"

            if (obj["imageBlog"]) {
                imageBlog = obj["imageBlog"];

                externalRessourcesCommon.generateExternalImg(imageBlog);

            } else {
                if (!dbPediaInited) {
                    // getDbPediaNotice(obj);
                    dbPediaInited = true;
                }

            }
            if (keysToExclude.indexOf(key) < 0 && orderedKeys.indexOf(key) < 0)
                str += "<i>" + key + "</i> : " + obj[key] + "<br>";
        }

        var labelsWithImages = ["MotCle", "Dieu", "Heros", "Dirigeant", "Monstre",
            "SiteArcheologique"];
        if (labelsWithImages.indexOf(obj.label) > -1) {
            str += "<hr>";
            var tag = obj[Gparams.defaultNodeNameProperty].sansAccent().toLowerCase();
            var strLinkArticle = "<a target='article' href='http://www.histoiredelantiquite.net/tag/"
                + tag + "'>articles</a>";
            var strLinkImage = "<a target='images' href='http://www.histoiredelantiquite.net/recherche-de-photos-par-tag/nggallery/tags/"
                + tag + "'>images</a><br>";

            strLinkArticle = "";
            str += "liens vers le blog de l'antiquite; :" + strLinkArticle
                + "&nbsp;" + strLinkImage;
        }


        // lien Sinequa)
        if (typeof customizeUI.customizationName == 'Sinequa') {
            var name = obj[Gparams.defaultNodeNameProperty];
            if (!name)
                name = obj.name;
            var p = name.lastIndexOf(".");
            if (p > -1)
                name = name.substring(0, p);

            var sinequaLink = "<a target ='_blanck' href='http://frhdstd-aefl06x/search?text=" + name + "&advanced=0&precision=&after_included=True&after=&before_included=True&before=&docformat=&documentlanguages=&treepath-0=&sort=globalrelevance.desc'>Search in Sinequa</a>"
            // sinequaLink="";

            str = sinequaLink + "<br>" + str;
        }
        str += "<br> NeoId:" + currentObject.id;
        return str;

    }

    self.resizeImg = function (img, height, width) {
        if (height)
            img.height = height;
        if (width)
            img.width = width;
    }

    String.prototype.sansAccent = function () {
        var accent = [/[\300-\306]/g, /[\340-\346]/g, // A, a
            /[\310-\313]/g, /[\350-\353]/g, // E, e
            /[\314-\317]/g, /[\354-\357]/g, // I, i
            /[\322-\330]/g, /[\362-\370]/g, // O, o
            /[\331-\334]/g, /[\371-\374]/g, // U, u
            /[\321]/g, /[\361]/g, // N, n
            /[\307]/g, /[\347]/g, // C, c
        ];
        var noaccent = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N',
            'n', 'C', 'c'];

        var str = this;
        for (var i = 0; i < accent.length; i++) {
            str = str.replace(accent[i], noaccent[i]);
        }

        return str;
    }

    self.formatNode = function (node) {
        if (node.name)
            node.name=self.formatNodeName(node.name);

        return node;
    }

    self.formatNodeName = function (name) {
        var match = /#[0-9]*/.exec(name);// on enleve le suffixe des names ajoutés pour l'unicité des noeuds dans d3js
        if (match) {
            var p = match.index;
            if (p > -1)
                name = name.substring(0, p);
        }
        return name;
    }
    return self;
})()