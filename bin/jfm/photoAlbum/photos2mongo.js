var ExifImage = require('exif').ExifImage;
var fs = require('fs');
var Path = require("path");
var async=require("async");
var mongoProxy = require("../../mongoProxy.js")


//var jpegData = fs.readFileSync(path);


var photoAlbumProcessor = {


    scanDir: function (rootPath) {

        var pathes = []

        function recurse(obj, path) {

            if (fs.lstatSync(path).isDirectory()) {
                obj.children = [];
                var files = fs.readdirSync(path, 'utf8');

                level++;
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



        var level = 0;
        var dbName = "albumPhoto"
        var collection = "famille";
        var rootObj = {name: Path.basename(rootPath), children: []};
        recurse(rootObj, rootPath);

        var objs = [];
        var max = 5000;
        max = Math.min(pathes.length, max);

        var subsets=[];
        var aSubset=[];
        var subsetSize=100;
        for (var i = 0; i < max; i++) {
            if(i%subsetSize==0){
                subsets.push(aSubset);
                aSubset=[];
            }
            aSubset.push(pathes[i]);

        }
        subsets.push(aSubset);;




        async.eachSeries(subsets, function (aSubset, callback) {


            for (var i = 0; i < max; i++) {

                try {
                    new ExifImage({image: aSubset[i]}, function (error, exifData) {

                        if (error)
                            console.log('Error: ' + error.message);
                        else {
                            var obj = {
                                path: aSubset[i],
                                time: exifData.exif.DateTimeOriginal,
                            }

                            objs.push(obj);
                            //    console.log(objs.length)
                            if (objs.length > 100) {

                                mongoProxy.insert(dbName, collection, objs, null, function (err, result) {
                                    if (err)
                                        console.log(err);
                                    console.log("DONE " + objs.length);


                                });


                            }


                        }
                    })

                } catch (error) {

                    console.log('Error: ' + error.message);
                }
            }


        })
    }
}
var rootPath = "D:/photosCF/Pictures/photos2016/"
photoAlbumProcessor.scanDir(rootPath);
module.exports = photoAlbumProcessor;
