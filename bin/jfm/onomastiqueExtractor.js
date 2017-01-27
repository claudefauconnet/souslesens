/**
 * Created by claud on 06/01/2017.
 */
var fs = require("fs");
var mongo=require("../mongoProxy.js");
var file = "D:/JeanFrancois/00-ECOLESetCOURANTSonomastique.txt"
function analyzeTxt() {
    var titles = {};
    var authors = []
    var desc = [];
    var data = fs.readFileSync(file);
    data = "\n" + data;
    data = data.replace(/\\r/, "");

    // var regexTitle = new RegExp("\\n*[0-9]+- +(.+)\\n*", "g");
    var regexTitle = /\n*[0-9]+- +(.+)\n/g

    var regexauthor = new RegExp(".*([A-Z][a-z]+ [A-Z]+).*\\n(.*)", "g");
    regexauthor = /.*([A-Z][a-z]+ [A-Z]+)/g;

    var result;
    var result2;
    var max = 100;
    var i = 0;
    var oldIndex = 0;
    var previousTitle;
    while (i++ < max && (result = regexTitle.exec(data)) != null) {
        var title = result[1];
        titles[title] = ({name: title, index: result.index});
        if (previousTitle)
            titles[previousTitle].end = result.index;
        previousTitle = title;

        // log(JSON.stringify(result));

    }

    for (var key in titles) {

        var aTitle=titles[key];
        aTitle.authors=[];
        aTitle.title_id=[];
        var start = aTitle.index+aTitle.name.length;
        if(!aTitle.end)
            aTitle.end=data.length-1;
        var str = data.substring(start, aTitle.end);
       // console.log(str);
i=0;
    var regexLines=/\n(.*)/g
      //  str = "\n" + str;
      str  = str.replace(/\r\n/g, "\r");
        while (i++ < max && (result = regexLines.exec(str)) != null) {
             var str2= result[1];
          //  console.log(str2);
            if(regexauthor.test(str2)) {

                titles[key].authors.push(str2);
            }

            // log(JSON.stringify(result));

        }
    }

    toMongo(titles);

  //  console.log(JSON.stringify(titles));
   // console.log(JSON.stringify(authors));
   // console.log(JSON.stringify(desc));

}


function toMongo( json){
    var data=[];
    var titleId=0;
    var authorId=0;
    var authors={};
    for(var key in json){
        titleId++;
        for( var i=0;i<json[key].authors.length;i++){
            var author=json[key].authors[i];
            var autId;
            if(authors[author])
                autId= authors[author];
          else {
                autId=++authorId;
                authors[author]=autId;
            }

            var obj={
                subject:key.trim(),
                subjectId:titleId,
                author:author.trim(),
                autorId:autId
            }
            data.push(obj);

        }
    }
    var result=mongo.insert("chaudron","jfmAuthors",data,function(err,result){
        if(err)
        console.log(err);
        console.log("done" +result.length+" docs inserted")
    });

}

function analyzeTxt0() {
    var titles = [];
    var authors = []
    var desc = [];
    var data = fs.readFileSync(file);
    data = "\n" + data;
    data = data.replace(/\\r/, "");

    var regexTitle = new RegExp("\n*[0-9]+- +(.+)\n* +(.+)\n*(.+)\n*(.+)\n*(.+)\n*(.+)\n*(.+)", "g");
    var regexauthor = new RegExp(".*([A-Z][a-z]+ [A-Z]+).*\n(.*)", "g");
    9
    var result;
    var result2;
    var max = 10000;
    var i = 0;
    while (i++ < max && (result = regexTitle.exec(data)) != null) {
        //   console.log(JSON.stringify(result));
        /* for (var i = 0; i < result[1].length; i++) {

         }*/
        titles.push(result[1]);
        authors.push(result[2]);
        if (regexauthor.test(result[2])) {
            authors.push(result[2]);
        }
        else {
            desc.push(result[2]);
        }
        if (regexauthor.test(result[3])) {
            authors.push(result[3]);
        }
        else {
            desc.push(result[3]);
        }
        desc.push(result[3]);

        //  console.log("2   "+JSON.stringify(result[2]));
        //  console.log("3   "+JSON.stringify(result[3]));
        //  console.log(JSON.stringify(result));

    }
    console.log(JSON.stringify(titles));
    console.log(JSON.stringify(authors));
    console.log(JSON.stringify(desc));

}


analyzeTxt();