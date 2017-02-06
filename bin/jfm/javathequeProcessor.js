/**
 * Created by claud on 07/01/2017.
 */
var fs = require("fs");
var Path = require("path");
var mongo = require("../mongoProxy.js")


var JavathequeProcessor = {


    fsTree: function (rootPath) {

        var pathes = []

        function recurse(obj, path) {

            if (fs.lstatSync(path).isDirectory()) {
                obj.children = [];
                var files = fs.readdirSync(path, 'utf8');

                level++;
                files.forEach(function (childName) {
                    var childPath = path + "/" + childName
                    var childObj = {name: childName}
                    obj.children.push(childObj);
                    if (fs.lstatSync(childPath).isDirectory()) {
                        childObj.children = [];
                        recurse(childObj, childPath);
                    } else {

                        pathes.push(childPath)

                    }
                });


            }
            else {

            }


        }

        function jonTreeToMongo(rootObj) {
            var leaves = [];
            recursePath(rootObj, []);
            var xxx = leaves;


            return;

        }

        var level = 0;
        var regexImgDate=/([0-9]{4})([0-9]{2})([0-9]{2})[A-Z]..*/
        var rootObj = {name: Path.basename(rootPath), children: []};
        recurse(rootObj, rootPath);
        var xxx = pathes;
        var data = [];
        for (var i = 0; i < pathes.length; i++) {
            var aPath = pathes[i].split('/');
            var obj = {};
            var startLevel = 4
            for (var j = startLevel; j < aPath.length; j++) {
                var value = aPath[j].trim();
                obj["level" + (j - startLevel + 1)] = value;

                // si le nom contient les nom du repertoire parent on le met en attribut
                if (false && j > startLevel && value.indexOf(aPath[j - 1]) > -1) {
                    value = aPath[j].replace(aPath[j - 1], "");
                    var parent = "parent" + (j - 1);
                    obj[parent] = aPath[j - 1]
                }
                // on ajoute l attribut path pour les documents et les images
                if (value.indexOf(".") > -1) {
                    obj.path = "/" + pathes[i].substring(pathes[j].indexOf(aPath[startLevel - 1]));

                    if (value.toLocaleLowerCase().indexOf(".jpg") > -1){
                        obj.photo = value;

                        var dateArray=regexImgDate.exec(value);
                        if(dateArray && dateArray.length>1) {
                            obj.date = new Date();
                            obj.date .setYear(dateArray[1]);
                            obj.date .setMonth(dateArray[2]-1);
                            obj.date.setDate(dateArray[3]);
                          //  console.log(obj.date);
                            var xx="";
                        }
                    }
                    else
                        obj.document = value;



                }


            }


            //affectation des subdivisions geographiques

            if (aPath[startLevel] == "BERSIH DESA, MERTI DUSUN") {
                var placeStr=aPath[startLevel+1];
                if(placeStr.indexOf(".")<0) {
                    var places = placeStr.split("-");

                    for (var k = 0; k < places.length; k++) {
                        var place = places[k].trim();
                        if (k == 0)
                            obj.propinsi = place;
                        if (k == 1)
                            obj.kabupaten = place;
                        if (k == 2)
                            obj.kecamatan = place;
                        if (k == 3)
                            obj.kelurahan = place;
                        if (k == 4)
                            obj.dusun = place;
                    }
                    if (obj.photo)
                        obj.photoLevel = places.length - 1;
                    else if (obj.document)
                        obj.documentLevel = places.length - 1;
                }

            }


            if (aPath[startLevel] == "CEMBENGAN (R)") {


            }
            data.push(obj);
        }
        mongo.delete("chaudron", "javatheque", {}, function (err, result) {
            if (err)
                return err;
            mongo.insert("chaudron", "javatheque", data,function (err, result) {
                if (err)
                    return err;
            });
        });


    }


}

var rootPath = "D:/JFM/TERRAIN/JAVATHEQUE";

JavathequeProcessor.fsTree(rootPath);


module.exports = JavathequeProcessor;

