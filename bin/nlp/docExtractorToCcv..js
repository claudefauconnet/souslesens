var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var path = require('path');
var dom = require('xmldom').DOMParser

var docxExtractor = require("./docxExtractor..js");


var docExtractorToCcv = {

    /**
     *
     * ecrit tous les tableaux à l'interieur des paragraphes de tous les document d'un repertoire    en csv
     *
     *
     */
    allParagraphArray2X: function (dir, format) {

// build json tables
        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        xmlPaths.forEach(function (xmlPath) {
            var filePath = path.resolve(dir + "/" + xmlPath);
            var xmlStr = "" + fs.readFileSync(filePath);
            var doc = new dom().parseFromString(xmlStr);
            var tables = docxExtractor.getTablesinParagraphs(xmlStr)
            allTables.push({doc: xmlPath, tables: tables})
        })
var str="";
        if (format == "html") {
            str = "<html>";
            str += "<style>body{font-family:Verdana;font-size:12px} td{background-color :#a9b7d1;}</style>"
        }
        allTables.forEach(function (docTables) {

            str += docTables.doc + "********************************************************************\n";
            docTables.tables.forEach(function (table0, index) {
                table0.forEach(function (table) {

                    str += docTables.doc + "------------------table" + index + "-----------------\n"
                    if (format == "html")
                        str += docExtractorToCcv.jsonTableToHtml(table) + "\n";
                    else
                        str += docExtractorToCcv.jsonTableToCsv(table) + "\n";

                   // str += docTables.doc + "------------------end table" + index + "-----------------\n\n"
                })
            })

        })
        if (format == "html") {
            str += "</html>"
            str = str.replace(/\n/gm, "<br>\n")
        }
        console.log(str)
        //  console.log(JSON.stringify(allParagraphJsonTables, null, 2))

    },

    jsonTableToCsv: function (tableJson) {
        var str = "";
        tableJson.rows.forEach(function (row, indexRow) {
            if (indexRow > 0)
                str += "\n";
            row.forEach(function (cell, indexCell) {
                if (true || indexCell > 0)
                    str += "\t";
                str += cell.text
            })
        })
        return str;

    },


    jsonTableToHtml: function (tableJson) {
        var str = "<table border='1'>";
        tableJson.rows.forEach(function (row, indexRow) {
            str += "<tr>";
            row.forEach(function (cell, indexCell) {
                if (true || indexCell > 0)
                    str += "<td>";
                str += cell.text
                str += "</td>";
            })
            str += "</tr>";
        })
        str += "</table>"
        return str;

    },


    contentToCsv: function (contentJson, tocJson) {

        var contentMap = {};
        contentJson.forEach(function (line) {
            if (line.tocId)
                contentMap[line.tocId] = line;
        })

        var colsep = "\t";
        var lineSep = "\n";

        function recurseParentChapter(str, chapter) {


            var tocObj = tocJson[chapter["tocId"]];
            if (tocObj) {
                var rootStr = str + tocObj.key + colsep + tocObj.title + colsep;
                if (tocObj.parentAnchor && tocObj.parentAnchor != "_") {
                    parentChapter = contentMap[tocObj.parentAnchor]
                    str += recurseParentChapter(str, parentChapter);
                }

            }

            return str;


        }


        var csvHeader = "DocTitle" + colsep + "" + lineSep
        var csvBody = ""
        var rootStr = contentJson.docTitle


        contentJson.forEach(function (chapter) {
            var lineStr = recurseParentChapter("", chapter);

            var repeatedStr = chapter.title + colsep;
            if (chapter && chapter.paragraphs) {
                chapter.paragraphs.forEach(function (paragraph) {
                    lineStr += repeatedStr + paragraph.text + lineSep;
                })
            }
            lineStr = lineStr.replace(/\t\-/g, "");
            lineStr = lineStr.replace(/undefined/g, "");

            csvBody += rootStr + colsep + lineStr + lineSep;


        })
        return csvHeader + csvBody;


    }
}

module.exports = docExtractorToCcv;


if (true) {
    var dir = "D:\\Total\\docs\\GM MEC Word\\documents"
    docExtractorToCcv.allParagraphArray2X(dir, "html");

}