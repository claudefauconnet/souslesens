var config=require("./config..js");


var formatToHtml = {

    format: function (sourceJson) {

        function getTableJson(table) {
            var html = "<table style='border-style: solid;border-width: 1px;border-color: #0000cc'>";
            table.rows.forEach(function (row, indexRow) {
                html += "<tr>";
                row.forEach(function (cell, indexCell) {
                    html += "<td>";
                    html += cell;
                    html += "</td>";
                })
                html += "<tr>";
            })
            html += "</table>";
            return html;
        }

        function extractImages(text, fileName) {
         var html=""
            var imageArray;
            // while((imageArray = /{{image:(.*)}}/.exec(text))!=null){
            imageArray = /{{"image":(.*)}}/g.exec(text);
            if (imageArray != null) {
                var url = imageArray[1].replace("media/", config.imagesServerUrl + "" + fileName +"/");
                url=url.replace(/"/gm,"")
             html+="<img src='"+url+"' >";

            }
            return html;
        }

        function formatBullets(paragraph) {
            if( paragraph.isSplitBullet){
                return "<ul><li>"+paragraph.text+"</li></ul>"
            }
            var bullets = paragraph.bullets;
            if (!bullets || bullets.length == 0) {
                return paragraph.text;
            }
            var bulletsText = "";
            var start = 0;
            var bulletPrefix="<"+paragraph.style+">";
            if(paragraph.style =="ul2")
                bulletPrefix="<ul>";
            bulletsText+=bulletPrefix;
            bullets.forEach(function (bullet, index) {
                if (index == 0)
                    start = bullet.offset;
                bulletsText += "<li>" + bullet.text + "</li>"
            })
            bulletsText+="</"+paragraph.style+">";
            return paragraph.text.substring(0, start) + bulletsText + paragraph.text.substring(start + 1)

        }

/* *************************end internal functions****************************/





        var html = "<div  style='border-style: solid;border-width: 2px;border-color: #c26629';margin:5px >"



        //tables
        var htmlTables = "";
        if (sourceJson.paragraph.tables) {
            sourceJson.paragraph.tables.forEach(function (table) {
                if (table.type == "table") {
                    htmlTables+= getTableJson(table);
                }

                // on cree un tableau avec chaque ligne
                else if (table.type == "splitTable") {
                    var json={rows:[]};
                    table.values.forEach(function (obj) {
                      var row=[]
                        for (var key in obj) {
                           row.push(key);
                            row.push(obj[key]);

                        }
                        json.rows.push(row)

                    })
                    htmlTables+= getTableJson(table);
                }
            })
        }


        //images
        var htmlImages = extractImages(sourceJson.paragraph.text, sourceJson.fileName);
        sourceJson.paragraph.text =sourceJson.paragraph.text .replace(/{{"image":.*}}/gm,"");

        //bullets

        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);
        sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n");



        //infos
        var docTitleHtml = "<b><i>"+ sourceJson.fileName + "  " + sourceJson.docTitle+"</i></b>"


        //titre
        html += sourceJson.chapter.title+"<br>";

       html+=sourceJson.paragraph.text+"<br>";
        if(htmlTables && htmlTables.length>0)
       html+=htmlTables+"<br>";

        html+=docTitleHtml+"<br>";
     if(htmlImages && htmlImages.length>0)
        html+=htmlImages+"<br>";




        html += "</div>"
        html=html.replace(/\n/gm,"<br>")
        html=html.replace(/\r/gm,"")
        return html;


    }


}

module.exports = formatToHtml;