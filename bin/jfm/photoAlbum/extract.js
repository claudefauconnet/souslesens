/**
 * Created by claud on 01/02/2017.
 */
var fs = require('fs');
var mongoProxy = require("../../mongoProxy.js");
var path = "D:/archidocs/docx2txt"

if (fs.lstatSync(path).isDirectory()) {
    var files = fs.readdirSync(path, 'utf8');
    files.forEach(function (childName) {
        var childPath = path + "/" + childName;
        parseFile(childPath);
    })

}


function parseFile(path) {
    var data = fs.readFileSync(path);
    data = "" + data;


    var patternTitle = new RegExp("^([0-9]+..+)$", "gm");


    var array = [];
    while ((array2 = patternTitle.exec(data)) !== null) {

        if (array2 && array2.length > 0) {

            var title = array2[1];
            array.push(title);
        }

    }
    var objs = [];
    var index = 0;
    var titles = {};
    for (var i = 0; i < array.length; i++) {
        var title = array[i];
        var p = data.indexOf(title, index) + title.length;
        var q = 0;
        if (i < array.length - 1)
            var q = data.indexOf(array[i + 1], index);
        else
            var q = data.length - 1;
        index = q+title.length;
        var content = data.substring(p, q);//.replace(/\n/g, "");


        if (titles[title]) {
            titles[title] = titles[title] + "" + content;
        } else {
            var obj = {
                file: path.substring(path.lastIndexOf("/") + 1),
                title: title,
                content: content
            }
            objs.push(obj);
            titles[title] = obj;
        }


    }
    storeFile(objs);
}

function storeFile(objs) {
    mongoProxy.insert("archidocs", "test", objs, null, function (err, result) {
        if (err)
            console.log(err);
    })
}
