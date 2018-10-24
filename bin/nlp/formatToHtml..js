var config = require("./config..js");


var formatToHtml = {

    format: function (sourceJson) {

        function getTableJson(table,fileName) {
            var html = "<table style='border-style: solid;border-width: 1px;border-color: #0000cc'>";

            if (table.values) {
                table.values.forEach(function (value, indexRow) {
                    html += "<tr>";

                    html += "<td>";
                    var i = 0;
                    for (var key in value) {
                        if ((i++) > 0)
                            html += "|"
                        html += key + ":" + value[key].text

                    }

                    html += "</td>";

                    html += "<tr>";
                })
            }

            if (table.rows) {

                table.rows.forEach(function (row, indexRow) {
                    html += "<tr>";
                    row.forEach(function (cell, indexCell) {
                        html += "<td>";
                        html += cell.text;

                       if(cell.images)
                               html +=extractImages(cell.images, fileName)


                        html += "</td>";
                    })
                    html += "<tr>";
                })
            }
            html += "</table>";
            return html;
        }


        function extractImages(images, fileName) {
            var html = ""
            images.forEach(function (image) {
                var url = image.replace("media/", config.imagesServerUrl + "" + fileName + "/");


                html += "<img src='" + url + "' >";

            })

            return html;
        }

        function formatBullets(paragraph) {
            if (paragraph.isSplitBullet) {
                return "<ul><li>" + paragraph.text + "</li></ul>"
            }
            var bullets = paragraph.bullets;
            if (!bullets || bullets.length == 0) {
                return paragraph.text;
            }
            var bulletsText = "";
            var start = 0;

            var bulletPrefix = "";
            var previousType = "";
            bullets.forEach(function (bullet, index) {
                if(bullet.text.indexOf("Rotors, which have exhibited high vibrations")>-1)
                    var x=1
                if (bullet.type == "ul2") {
                    bulletPrefix = "ul";

                }
                else
                    bulletPrefix = bullet.type;

                if (previousType != bullet.type) {
                    if (bullet.type == "ul2")
                        bulletsText += "</" + bulletPrefix + ">"
                    bulletsText += "<" + bulletPrefix + ">";
                }
                previousType = bullet.type

                if (index == 0)
                    start = bullet.offset;


                bulletsText += "<li>" + bullet.text + "</li>"
            })
            bulletsText += "</" + bulletPrefix + ">";
            if (start == 0)
                return bulletsText + paragraph.text.substring(start);
            else
                return paragraph.text.substring(0, start - 1) + bulletsText + paragraph.text.substring(start)


        }

        /* *************************end internal functions****************************/


        var html = "<div  style='border-style: solid;border-width: 2px;border-color: #c26629';margin:5px >"


        //tables
        var htmlTables = "";
        if (sourceJson.paragraph.tables) {
            sourceJson.paragraph.tables.forEach(function (table) {
                if (table.type == "table") {
                    htmlTables += getTableJson(table,sourceJson.fileName);
                }

                // on cree un tableau avec chaque ligne
                else if (table.type == "splitTable") {
                    var json = {rows: []};
                    table.values.forEach(function (obj) {
                        var row = []
                        for (var key in obj) {
                            row.push(key);
                            row.push(obj[key]);

                        }
                        json.rows.push(row)

                    })
                    htmlTables += getTableJson(table,sourceJson.fileName);
                }
            })
        }


        //images
        var htmlImages = extractImages(sourceJson.paragraph.images, sourceJson.fileName);
        //  sourceJson.paragraph.text =sourceJson.paragraph.text .replace(/{{"image":.*}}/gm,"");

        //bullets

        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);
        sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n");


        //infos
        var docTitleHtml = "<b><i>" + sourceJson.fileName + "  " + sourceJson.docTitle + "</i></b>"


        //titre
        html += sourceJson.chapter.title + "<br>";

        html += sourceJson.paragraph.text + "<br>";
        if (htmlTables && htmlTables.length > 0)
            html += htmlTables + "<br>";

        html += docTitleHtml + "<br>";
        if (htmlImages && htmlImages.length > 0)
            html += htmlImages + "<br>";


        html += "</div>"
        html = html.replace(/\n/gm, "<br>")
        html = html.replace(/\r/gm, "")
        return html;


    }


}

module.exports = formatToHtml;