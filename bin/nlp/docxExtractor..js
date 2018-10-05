var fs = require('fs');


var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var path = require('path');
var dom = require('xmldom').DOMParser


var cleanDocxXml = function (file, withTables) {

    var data = "" + fs.readFileSync(filePath);
//data=data.replace(/\r/gm,"");
    data = data.replace(/>/gm, ">\n");
    var lines = data.split("\n");

    var xml = "";

    lines.forEach(function (line) {
        var ok = true;
        if (line.indexOf("<w:p ") >= 0 || line.indexOf("</w:p>") >= 0)
            ok = true;
        else if (line.indexOf("<w:document ") >= 0 || line.indexOf("</w:document") >= 0)
            ok = true;
        else if (line.indexOf("<w:hyperlink ") >= 0 || line.indexOf("</w:hyperlink") >= 0)
            ok = true;

        else if (line.indexOf("<w:bookmarkStart") >= 0 || line.indexOf("<w:bookmarkEnd") >= 0)
            ok = true;
        else if (line.indexOf("<w:instrText") >= 0 || line.indexOf("</w:instrText") >= 0)
            ok = true;


        else if (withTables && line.indexOf("<w:t") >= 0 || line.indexOf("</w:t") >= 0) {//table
            ok = true
        }


        else if (line.indexOf("<w") == 0 || line.indexOf("</w") == 0 && line.indexOf("bookmarkStart") < 0) {
            ok = false
        }
        else if (line.indexOf("<v") == 0 || line.indexOf("</v") == 0) {
            ok = false
        }
        else if (line.indexOf("<a") == 0 || line.indexOf("</a") == 0) {
            ok = false
        }
        else if (line.indexOf("<pic") == 0 || line.indexOf("</pic") == 0) {
            ok = false
        }
        else if (line.indexOf("<o") == 0 || line.indexOf("</o") == 0) {
            ok = false
        }
        else if (line.indexOf("<w:instrText") == 0 || line.indexOf("</w:instrText") >= 0) {
            ok = false
        }


        if (ok) {
            //  line = line.replace("</w:t>", "")
            xml += line + "\n";
        }
    })
//xml=xml.replace(/<w:/gm,"<")//suppression prefix
//xml=xml.replace(/<\/w:/gm,"</")
    xml = xml.replace(/[\r\n]/gm, "")
    xml = xml.replace(/&/gm, "!!")
    return xml;
}


var extractTable = function (tblElt) {
    var json = [];

    var table = {rows: []};
    json.push(table)


    var columns = tblElt.getElementsByTagName("w:tr");
    for (var k = 0; k < columns.length; k++) {
        var row = [];
        table.rows.push(row)
        var cells = columns[k].getElementsByTagName("w:tc");

        for (var y = 0; y < cells.length; y++) {
            var cell = {};
            row.push(cell);
            /*    var str = "";
                var texts = getAllElementsByTagNameDepth(cells[y], "w:t");
                for (var z = 0; z < texts.length; z++) {
                    for (var w = 0; w < texts[z].childNodes.length; w++) {
                        var node = texts[z].childNodes[w];
                        if (node && node.data)
                            str += node.data;
                    }


                }*/
            cell.text = extractRunText


            (cells[y]);
        }


    }
    return json;
    // console.log(JSON.stringify(json,null,2))
}


var generateJsonTEST = function (xmlStr) {
    var jsonR = {};
    var jsonP = {};

    var doc = new dom().parseFromString(xmlStr);
    var texts = doc.documentElement.getElementsByTagName("w:t");

    var parentTags = [];
    var paragraphs = doc.documentElement.getElementsByTagName("w:tbl");
    for (var z = 0; z < paragraphs.length; z++) {
        var node = paragraphs[z];
        if (parentTags.indexOf(node.parentNode.tagName) < 0)
            parentTags.push(node.parentNode.tagName)


    }


    console.log(parentTags.toString())
}


// p parents =w:tc,w:body
// r parents=w:p,w:ins,w:hyperlink,w:del;
// t parents=w:r
// w:bookmarkStart parents  =w:p
// w:bookmarkEnd parents=w:p
// hyperlink parents=w:p
// w:tbl parents=w:body


var generateJson = function (xmlStr) {
    var json = [];
    var bodyStr = "";
    var currentTocId = "";
    var jsonTables = [];
    var doc = new dom().parseFromString(xmlStr);
    var body = doc.documentElement.getElementsByTagName("w:body")[0];


    var tables = body.getElementsByTagName("w:tbl");
    for (var j = 0; j < tables.length; j++) {
        var jsonTable = extractTable(tables[j])
        jsonTable.startOffset = tables[j].columnNumber

        jsonTables.push(jsonTable)

    }


    var paragraphs = body.getElementsByTagName("w:p")


    var runStr;
    for (var i = 0; i < paragraphs.length; i++) {

        if (paragraphs[i].parentNode.tagName == "w:tc")
            continue;

        var obj = {status: "normal", title: "", text: ""};
        for (var j = 0; j < paragraphs[i].childNodes.length; j++) {
            var child = paragraphs[i].childNodes[j];


            obj.startOffset = paragraphs[i].columnNumber
            if (i < paragraphs.length - 1)
                obj.endOffset = paragraphs[i + 1].columnNumber
            else
                obj.sendOffset = 999999999;


            if (child.tagName == "w:bookmarkStart") {
                obj.status = "bookmark";

                var attrs = child.attributes;
                for (var k = 0; k < attrs.length; k++) {
                    if (attrs[k].name && attrs[k].value) {
                        if (attrs[k].name == "w:name")
                            obj.tocId = attrs[k].value
                    }

                    currentTocId = obj.tocId;


                }
            }

            if (child.tagName == "w:bookmarkEnd") {
                obj.status = "normal";
                obj.text = "";
            }

            runStr = "";
            if (child.tagName == "w:ins") {//ins revisions

                var runs = child.getElementsByTagName("w:r")
                for (var k = 0; k < runs.length; k++) {
                    runStr += extractRunText(runs[k])


                }
            }
            if (child.tagName == "w:r") {
                runStr = extractRunText(child)


            }

            if (runStr && runStr.indexOf("GS") == 0) {
                var xx = 3
                log = true;
            }

            /*   if(log)
                   console.log(runStr);*/


            if (obj.status == "bookmark") {
                obj.title += runStr;
            }
            if (obj.status == "normal") {
                obj.text += runStr;
            }


        }


        if (true || obj.title != "" || obj.text != "") {
            delete obj.status
            json.push(obj);
        }

    }

    function aggregateTables() {
        jsonTables.forEach(function (table, indexTable) {
            var offset = table.startOffset;
            var found = false
            json.forEach(function (paragraph, index) {
                if (offset > paragraph.startOffset && offset <= paragraph.endOffset) {

                    if (!json[index].tables)
                        json[index].tables = [];
                    json[index].tables.push(indexTable);
                    found = true;
                }

            })
            if (found == false) {
                if (!json.globalTables)
                    json.globalTables = [];
                json.globalTables.push("table-#" + indexTable)
            }
        })
        return json;

    }

    json = aggregateTables(json)


    function aggregateParagraphs(json) {
        var json2 = [{noChapter: []}];
        var currentParagraph = null;

        json.forEach(function (paragraph, index) {

            if (paragraph.text == "" && paragraph.title == "" && !paragraph.tables)
                return;

            if (!paragraph.tocId && !currentParagraph) {// pas dans TOC
                json2[0].noChapter.push(paragraph.text)
            }
            else if (paragraph.tocId) {
                // if(paragraph.text=="" && paragraph.title=="")
                // return;
                currentParagraph = {tocId: paragraph.tocId, title: paragraph.title, paragraphs: [],};
                if (paragraph.tables)
                    currentParagraph.tables = paragraph.tables
                if (paragraph.text != "") {
                    currentParagraph.paragraphs.push(paragraph.text);

                }

                json2.push(currentParagraph)

            }
            else if (!paragraph.tocId) {
                var obj = {}

                if (paragraph.text.trim() != "")
                    obj.text = paragraph.text
                if (paragraph.tables)
                    paragraph.tables = paragraph.tables
                currentParagraph.paragraphs.push(obj);
            }


        })

        return json2;


    }

    var json2 = json

    var json2 = aggregateParagraphs(json)


    json2.tables = jsonTables

    return json2;
}

/**
 *
 * if not returnFlatJson returns a tree
 * returnFlatJson return a map of chapters with tocIds as keys
 *
 **/
var parseTOC = function (xmlStr,returnFlatJson) {
    var tocArray = []
    var doc = new dom().parseFromString(xmlStr);
    var elements = doc.documentElement.getElementsByTagName("w:hyperlink");
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var obj = {text: ""};
        var str = "";

        var regexCleanTitle = /(.*[^\d])\d*/
        var str = extractRunText(element)
        str = regexCleanTitle.exec(str)[1];
        obj.text = str;

        var attrs = element.attributes;
        var attrsObj = {}
        for (var j = 0; j < attrs.length; j++) {
            if (attrs[j].name && attrs[j].value) {
                attrsObj[attrs[j].name] = attrs[j].value;
            }
            if (attrsObj["w:anchor"])
                obj.anchor = (attrsObj["w:anchor"])
        }
        tocArray.push(obj);


    }


    //build toc Tree structure

    var tocMap = {}
    tocArray.forEach(function (obj, index) {
        var p = obj.text.indexOf(" ");
        var key = "#" + obj.text.substring(0, p).trim();
        var title = obj.text.substring(p + 1);
        var obj2 = {title: title, key: "" + key, children: [], anchor: obj.anchor};
        tocMap[key] = obj2;
    })

//set parents
    for (var key in tocMap) {
        var p = key.lastIndexOf(".")
        if (p < 0) {
            tocMap[key].parent = "#";
            continue;
        }
        var key2 = key.substring(0, p);
        var parent = tocMap[key2];
        if (parent) {
            tocMap[key].parentAnchor=parent.anchor
            tocMap[key].parent = parent;
        }
        else {

            tocMap[key].parent = "#";
        }

    }

    if(returnFlatJson){
        var tocMap2={}
        for (var key in tocMap) {
            tocMap2[tocMap[key].anchor]=tocMap[key];
        }


        return tocMap2;
    }

//build tree
    var tocStruct = [];

    function recurseParent(obj) {
        while (obj && obj.parent != "#") {
            obj.parent.children.push(obj);
            obj.parentKey = obj.parent;
            recurseParent(obj.parent);
            obj.parent = "#";
        }


    }

    for (var key in tocMap) {
        if (tocMap[key].parent == "#")
            tocStruct.push(tocMap[key])

        recurseParent(tocMap[key])


    }


    //console.log(JSON.stringify(tocStruct, null, 2))
    return tocStruct;


}

var linkContentJsonToToc = function (toc, content) {


    var contentMap = {}
    var nTocParagraphs = []
    content.forEach(function (line, index) {

        if (line.tocId)
            contentMap[line.tocId] = line;
        else
            nTocParagraphs.push(line)
    })


    function recurse(obj) {
        var tocId = obj.anchor;
        var tocContent = contentMap[tocId];
        if (tocContent) {
            obj.content = tocContent;
        }
        obj.children.forEach(function (child, index) {
            recurse(child)
        })
    }


    toc.forEach(function (line) {
        recurse(line);


    })
    toc.splice(0, 0, content[0])


    tablesContent = {};
    content.tables.forEach(function (table, index) {
        tablesContent["table-#" + index] = table;
    })

    return {body: toc, tablesContent: tablesContent};

}


var extractRunText = function (run) {
    var runStr = "";
    var texts = run.getElementsByTagName("w:t")

    for (var k = 0; k < texts.length; k++) {
        var textStr = ""
        for (var l = 0; l < texts[k].childNodes.length; l++) {
            var textChild = texts[k].childNodes[l]
            if (textChild.data && textChild.data != "")
                textStr += textChild.data;
        }
        runStr += textStr.replace(/\n/g, "");
//console.log(runStr)

    }
    return runStr;

}

var getAllElementsByTagNameDepth = function (element, tagName) {
    function recurse(element, tagName, result) {
        if (!element.getElementsByTagName)
            return result;
        result = result || [];
        var elements = element.getElementsByTagName(tagName);
        for (var i = 0; i < elements.length; i++) {
            result.push(elements[i])
        }
        if (elements.length > 0)
            ;//  return result;
        for (var i = 0; i < element.childNodes.length; i++) {
            recurse(element.childNodes[i], tagName, result)
        }
        return result;


    }

    return recurse(element, tagName, [])

}


var arrayToCsv = function (linkedContentJson) {


}


var contentToCsv = function (contentJson,tocJson) {

    var contentMap={};
    contentJson.forEach(function(line){
            if(line.tocId)
        contentMap[line.tocId]=line;
    })

    var colsep = "\t";
    var lineSep = "\n";

    function recurseParentChapter(str, chapter) {


        var tocObj=tocJson[chapter["tocId"]];
        if(tocObj){
           var  rootStr=  str+tocObj.key + colsep + tocObj.title + colsep;
            if(tocObj.parentAnchor && tocObj.parentAnchor!="_" ){
              parentChapter=contentMap[tocObj.parentAnchor]
             str+= recurseParentChapter(str, parentChapter);
            }

        }

        return str;


    }


    var csvHeader = "DocTitle" + colsep + "" + lineSep
    var csvBody = ""
    var rootStr = contentJson.docTitle


    contentJson.forEach(function (chapter) {
        var lineStr = recurseParentChapter("", chapter);

         var repeatedStr=chapter.title + colsep;
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



var extractXmlFilesFromDocXDir=function(dir){
    try{
    var unzip=require("unzip");
    dir=path.resolve(dir)
    var docxFiles=fs.readdirSync(dir)
    docxFiles.forEach(function(docPath){
        var docPath=path.resolve(dir+"/"+docPath);
     if(docPath.indexOf(".docx")>-1) {
         fs.createReadStream(docPath)
             .pipe(unzip.Parse())
             .on('entry', function (entry) {
                 var fileName = entry.path;
                 var type = entry.type; // 'Directory' or 'File'
                 var size = entry.size;
                 var documentXmlDirPath=dir+"/documents";
                 if (!fs.existsSync(documentXmlDirPath)) {
                     fs.mkdir(documentXmlDirPath);
                 }

                 if (entry.path === "word/document.xml") {
                     var docName=docPath.substring(docPath.lastIndexOf(path.sep)+1,docPath.lastIndexOf("."));
                     var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" +docName+".xml");
                  //   console.log(unzippedWordDirPath);
                     entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                 } else {
                     entry.autodrain();
                 }


             });
     }



       // var unzippedDocxDir=

    })


    }
    catch(e){
       console.log(e);
        }

}



if(true) {
    processDir("D:\\Total\\docs\\GM MEC Word\\documents");




    if(false) {
    extractXmlFilesFromDocXDir("D:\\Total\\docs\\GM MEC Word");

}
if (false) {
    var filePath = "D:\\Total\\NLP\\document.xml";
    var data = "" + fs.readFileSync(filePath);
    var cleanXml = data;// data.replace(/>/gm, ">\n");

    var contentJson = generateJson(cleanXml);
    //console.log(JSON.stringify(contentJson, null, 2))
    //  console.log("******************************************************************");

    var toc = parseTOC(cleanXml);
    //  console.log(JSON.stringify(toc, null, 2))
    //  console.log("******************************************************************");

    var linkedContentJson = linkContentJsonToToc(toc, contentJson);
    //  console.log(JSON.stringify(linkedContentJson, null, 2))

    var toc = parseTOC(cleanXml,true);
    var csv = contentToCsv(contentJson,toc);
    console.log(csv);
    // var tablesJson = extractTables(cleanXml)
}

