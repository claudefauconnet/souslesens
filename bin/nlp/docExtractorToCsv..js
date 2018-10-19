var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var path = require('path');
var dom = require('xmldom').DOMParser

var docxExtractor = require("./docxExtractor..js");
var formatToBot = require("./formatToBot..js");
var formatToHtml = require("./formatToHtml..js");
var formatToColumns = require("./formatToColumns..js");
var config = require("./config..js");
var docExtractorToCsv = {


    /**
     *
     * ecrit tous les tableaux à l'interieur des paragraphes de tous les document d'un repertoire    en csv
     *
     *
     */
    allParagraphArray2X: function (dir, format, sortByColsNumber) {

        function getTableColsNumber(tableJson) {
            var ncols = 0;
            tableJson.rows.forEach(function (row, indexRow) {
                ncols = Math.max(row.length, ncols);

            })
            return ncols;
        }

        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        xmlPaths.forEach(function (xmlPath) {
            if (xmlPath.indexOf(".xml") < 0)
                return;
            if (xmlPath.indexOf("_header.xml") > -1)
                return;
            if (xmlPath.indexOf("_rels.xml") > -1)
                return;
            var filePath = path.resolve(dir + "/" + xmlPath);
            var xmlStr = "" + fs.readFileSync(filePath);
            var doc = new dom().parseFromString(xmlStr);
            var tables = docxExtractor.getTablesinParagraphs(doc)
            allTables.push({doc: xmlPath, tables: tables})
        })


        var strArray = [];

        allTables.forEach(function (docTables) {
            docTables.tables.forEach(function (table, index) {
                var str = ""
                if (format == "html")
                    str += docExtractorToCsv.jsonTableToHtml(table) + "\n";
                else
                    str += docExtractorToCsv.jsonTableToCsv(table) + "\n";
                var obj = {content: str, doc: docTables.doc}
                if (sortByColsNumber) {
                    obj.colsNumber = getTableColsNumber(table);
                }
                strArray.push(obj);

            })
        })

        if (sortByColsNumber) {
            strArray = strArray.sort(function (a, b) {
                if (a.colsNumber > b.colsNumber)
                    return 1;
                if (a.colsNumber < b.colsNumber)
                    return -1;
                return 0;
            })

        }
        var str = "";
        if (format == "html") {
            str = "<html>";
            str += "<style>body{font-family:Verdana;font-size:12px} td{background-color :#a9b7d1;}</style>"
        }

        strArray.forEach(function (line, index) {
            //  console.log(line.colsNumber);
            str += "------------------colsNumber : " + line.colsNumber + "-----------------\n"
            str += line.doc + "********************************************************************\n";
            str += line.content + "\n";

            //   console.log(line.colsNumber+ "  "+line.content)

        })


        if (format == "html") {
            str += "</html>"
            str = str.replace(/\n/gm, "<br>\n")
        }
        //  console.log(str)
        //  console.log(JSON.stringify(allParagraphJsonTables, null, 2))
        fs.writeFileSync(dir + "/allTablesOrdered.csv", str)
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


    /* jsonTableToHtml: function (tableJson) {
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

     },*/

    jsonContentsToCsv: function (dir) {


        var setPurposeAndScope = function (tables) {
            var str = "";

            tables.forEach(function (table) {
                if (table.paragraphIndex == -1) {// hors chapitre donc en tete
                    if( table.rows[0].length==1){//modele 1
                        var cellPurpose = table.rows[0][0];
                        var cellScope = table.rows[1][0];
                        var p = cellPurpose.indexOf("Purpose:");
                        str += cellPurpose.substring(p + "Purpose:".length);
                        str += "\t";
                        p = cell1Txt.indexOf("Scope of application:");
                            str += cellScope.substring(p + "Scope of application:".length);
                    }
                    else if(true){//modele 2
                        var cellPurpose = table.rows[0][1];
                        var cellScope = table.rows[1][1];

                        str += cellPurpose+"\t"+cellScope;
                    }
                    else{
                        console.log("Probem extracting Pupose and scope")
                    }




                }
            })
            /*  if (tables.length > 0 && tables[0].rows[0]) {
                  var cell0 = tables[0].rows[0][0];
                  var cell1 = tables[0].rows[1][0];
                  var index = cell0.indexOf("Purpose:");
                  if (index == 0)
                      str += cell0.substring(index + "Purpose:".length);
                  str += "\t";
                  index = cell1.indexOf("Scope of application:");
                  if (index == 0)
                      str += cell1.substring(index + "Scope of application:".length);


              }*/
            return str;
        }


        // le titre est dans la dernière ligne du tableau du fichier header1.xml
        var extractDocTitle = function (headerTables) {
            var docTitle = ""
            if (headerTables.length > 0) {
                var titleTable = headerTables[headerTables.length - 1];
                var lastRow = titleTable.rows[titleTable.rows.length - 1][0];
                docTitle = lastRow;
            }
            return docTitle;
        }

        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        var str = "id\tFile\tdocTitle\tpurpose\tscope\tparentChapters\tChapterKey\tChapter\thtmlText\tbotText";
        str += "\ttitle\ttext\ttable\tdocTitle\timage"
        str += "\n";
        var botStr = ""
        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        var botObjs = [];
        var htmlTexts = "";
        var columnTexts = "title\ttext\ttable\tdocTitle\timage\n";

        xmlPaths.forEach(function (xmlPath) {


            if (xmlPath.indexOf(".xml") < 0)
                return;
            if (xmlPath.indexOf("_header.xml") > -1)
                return;
            if (xmlPath.indexOf("_rels.xml") > -1)
                return;

            var filePath = path.resolve(dir + "/" + xmlPath);
            if (fs.lstatSync(filePath).isDirectory())
                return;
            var xmlStr = "" + fs.readFileSync(filePath);

            // console.log("---------" + filePath);
            var doc = new dom().parseFromString(xmlStr);
            var headerTables = docxExtractor.extractHeaderJson(filePath.replace(".xml", "_header.xml"))
            var docRels = docxExtractor.getRelsMap(filePath.replace(".xml", "_rels.xml"));
            var fileName = xmlPath.substring(0, xmlPath.lastIndexOf("."))
            try {
                var jsonContent = docxExtractor.extractContentJson(doc, docRels);
                //  jsonContent = addTablesToChapters(jsonContent);


                var purposeAndScope = setPurposeAndScope(jsonContent.tables);


                var docTitle = extractDocTitle(headerTables);
                var startId = Math.round((Math.random() * 100000))


                jsonContent.forEach(function (chapter, index) {

                    if (!chapter.key)
                        chapter.key = "";
                    chapter.title = removeHtmlTags(chapter.title);
                    // "id\tFile\tdocTitle\tpurpose\tscope\tparentChapters\tChapterKey\tChapter\thtmlText\tbotText\n";
                    var rooTxt = fileName + "\t" + docTitle + "\t" + purposeAndScope + "\t" + chapter.parent + "\t" + chapter.tocNumber + "\t" + chapter.title + "\t";
                    ;
                    chapter.paragraphs.forEach(function (paragraph) {
                        if (paragraph) {
                            var paragraphText = paragraph.text;

                            if (paragraph.images.length > 0)
                                var xx = 1


                            var botSourceObj = {
                                fileName: fileName,
                                docTitle: docTitle,
                                chapter: chapter,
                                paragraph: paragraph
                            }
                            //clone before use
                            var htmlSourceObj = JSON.parse(JSON.stringify(botSourceObj));
                            var columnsSourceObj = JSON.parse(JSON.stringify(botSourceObj));


                            var botObj = formatToBot.format(botSourceObj);
                            botObjs.push(botObj)
                            var botText = JSON.stringify(botObj)
                            var htmlText = formatToHtml.format(htmlSourceObj);
                            htmlTexts += htmlText

                            var columnText = formatToColumns.format(columnsSourceObj);
                            columnTexts += columnText + "\n";


                            // console.log(botText + "\n");

                            str += (startId++) + "\t" + rooTxt + htmlText + "\t" + botText + "\t" + columnText + "\n";

                        }

                    })


                })
            } catch (e) {
                console.log(e);
                //     str += "ERROR processing " + fileName + " : " + e + "\n";
                //    botObjs.push({ERROR: " processing " + fileName + " : " + e})
            }

        });
        //  console.log(str)
        fs.writeFileSync(dir + "/allDocsContent2.html", htmlTexts)
        fs.writeFileSync(dir + "/allDocsContent2.csv", str)
        fs.writeFileSync(dir + "/botContent.json", JSON.stringify(botObjs, null, 2))
        fs.writeFileSync(dir + "/allColumns.csv", columnTexts)

    },

    readDocumentsInDir: function (dir, callback) {


    },


}

module.exports = docExtractorToCsv;
//dir = "D:\\Total\\docs\\GM MEC Word\\documents"


var dir = "D:\\Total\\docs\\GM MEC Word\\documents\\test"
dir = "D:\\Total\\docs\\GM MEC Word\\documents"
if (true) {
    docExtractorToCsv.jsonContentsToCsv(dir);
}
if (false) {

    docExtractorToCsv.allParagraphArray2X(dir, "html", true);

}


if (false) {
    var dir = "D:\\ATD_Baillet\\applicationTemporaire\\xml"


    docExtractorToCsv.allParagraphArray2X(dir, "csv", true);
}