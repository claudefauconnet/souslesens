/**
 * Created by claud on 09/02/2017.
 */


var csv = require('csvtojson');
var fs = require('fs');

var regexNormeInt = new RegExp("([GS|CR|LI]{2}[- ]MS[- ][A-Z]{3,4}[- ][0-9]{2,4})", "gm");

var csvFilePath = './normesInternesMS.csv';
var csvFilePathOut = './normesInternesMS_out.csv';
var jsonArray = []


csv({noheader: false, trim: true, delimiter: " - "})
    .fromFile(csvFilePath)
    .on('json', function (json) {


        jsonArray.push(json)
    })
    .on('done', function () {
        var newObjs = {};
        for (var i = 0; i < jsonArray.length; i++) {
            var obj = jsonArray[i];

            var linkedDocs = [];

            var array = regexNormeInt.exec(obj.sourcestr3);

            if (array && array.length > 0) {
                var id = array[1]
                var array2;
                while ((array2 = regexNormeInt.exec(obj.entity1)) !== null) {
                    if (linkedDocs.indexOf(array2[0]) < 0)
                        linkedDocs.push(array2[0])
                }
            }

            newObjs[id] = linkedDocs;
        }

        var str = "col1\tcol2\n";
        for (var key in newObjs) {
            for (var i = 0; i < newObjs[key].length; i++) {
                str += key + "\t" + newObjs[key][i] + "\n";
            }
        }
        fs.writeFileSync(csvFilePathOut, str);


    })