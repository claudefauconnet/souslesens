var fs = require('fs');


//Match (n)-[r]-(m)-[s]-(p) where ID(n)=ID(p) and n.subGraph="crossrefself" delete s

var data = "" + fs.readFileSync("D:\\Total\\crossReferences.txt");

var lines = data.split("\n")
var str = "title;fichier;lang;branch;type;id;type;branch2;domain;number;reference\n";
for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();

    var cols = line.split("\t");
    if (cols[3] == "fr")//lang only english
        continue;
    var root = "";
    var line2 = "";


    for (var j = 0; j < cols.length; j++) {
        if (j < 6) {


            if (j == 5) {
                var str2 = cols[j];
                //   str2 = str2.replace(/_/g, " ").replace(/\-/g, " ").replace(/fr/g, " FR").replace(/en/g, " EN").toUpperCase().trim();
                str2 = str2.replace(/fr/g, " FR").replace(/en/g, " EN").toUpperCase().trim();
                var regex = /([A-Z]*)[ \-_‐]+([A-Z]*)[ \-_‐]+([A-Z]*)[ \-_‐]+([0-9]*)/
                var array = regex.exec(str2)
                if (array && array.length > 4) {
                    //  var id= array[0];
                    var type = array[1];
                    var branch = array[2];
                    var domain = array[3];
                    var number = array[4];
                    var id = type + " " + branch + " " + domain + " " + number;
                    root += id + ";" + type + ";" + branch + ";" + domain + ";" + number + ";"
                }
                else {
                    root += str2 + ";;;;"
                }


            }
            else {

                root += cols[j] + ";"
            }
        } else {
            if ((j + 6) % 3 == 0) {
                line2 = root + cols[j] + "\n";
                str += line2;
            }

        }

    }


}


fs.writeFileSync("D:\\Total\\crossReferencesImport.csv", str);