var ExifImage = require('exif').ExifImage;
var fs = require('fs');
var Path = require("path");
var async = require("async");
var mongoProxy = require("../../mongoProxy.js")


//var jpegData = fs.readFileSync(path);


var photoAlbumProcessor = {


    scanDir: function (rootPath) {

        var pathes = []
        var index = 0;

        function recurse(obj, path) {

            if (fs.lstatSync(path).isDirectory()) {
                obj.children = [];
                var files = fs.readdirSync(path, 'utf8');


                files.forEach(function (childName) {
                    if (childName.indexOf(".JPG") > -1) {
                        var childPath = path + "/" + childName
                        var childObj = {name: childName}
                        obj.children.push(childObj);
                        if (fs.lstatSync(childPath).isDirectory()) {
                            childObj.children = [];
                            recurse(childObj, childPath);
                        } else {

                            pathes.push(childPath)

                        }
                    }
                });


            }
            else {

            }


        }

        var regexDate = /([0-9]{4}):*([0-9]{2}):([0-9]{2}) (.*)/g
        var rootObj = {name: Path.basename(rootPath), children: []};
        recurse(rootObj, rootPath);
     //  pathes.length=100;


        var objs = [];
        async.concat(pathes, readMetadata, function (err, objs) {


            var xxx = objs;
            var dbName = "albumPhoto"
            var collection = "famille";
            mongoProxy.insert(dbName, collection, objs, null, function (err, result) {
                if (err)
                    console.log(err);
                console.log("DONE " + objs.length);
            });
        });


        function readMetadata(path, callback) {
            try {
                new ExifImage({image: path}, function (err, exifData) {

                    var regex = /([0-9]{4}):*([0-9]{2}):([0-9]{2}) (.*)/g


                    if (err)
                        return callback({error: true});
                    var date = new Date(1900, 0, 0, 0, 0, 0);
                    var array = regexDate.exec(exifData.exif.DateTimeOriginal);
                    if (array) {
                        if (array[1] == "0000")
                            date = new Date(1900,0,0)
                        else {
                            var str = array[1] + "-" + array[2] + "-" + array[3] + "T" + array[4]+"Z"
                            date = new Date(str);
                        }
                    }
                    var obj = {
                        date: date,
                        path: path,
                        index: index++
                    }
                    return callback(null, obj);
                });


            } catch (error) {
                return callback({error: true});
                console.log('Error: ' + error.message);
            }
        }


    }
}
var rootPath = "D:/photosCF/Pictures/photos2016/"
photoAlbumProcessor.scanDir(rootPath);
module.exports = photoAlbumProcessor;
