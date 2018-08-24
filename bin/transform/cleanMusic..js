var fs = require('fs');


var entries = []

function cleanMusic(path, pathNew) {


    if (fs.existsSync(path)) {
        if (fs.lstatSync(path).isDirectory()) {
            if (!fs.existsSync(pathNew)) {
                fs.mkdirSync(pathNew)
            }
            var children = fs.readdirSync(path);
            children.sort(function (a, b) {
                if (b > a)
                    return 1;
                if (a > b)
                    return -1;
                return 0;

            })
            for (var i = 0; i < children.length; i++) {
                var file = children[i];
                var pathChild = path + "/" + file;
                var pathChildNew = pathNew + "/" + file;


                if (fs.lstatSync(pathChild).isDirectory()) { // recurse
                    if (!fs.existsSync(pathChildNew)) {
                        fs.mkdirSync(pathChildNew)
                    }
                    cleanMusic(pathChild, pathChildNew);
                }
                else {
                    var p = pathChild.lastIndexOf(".");
                    var name = pathChild.substring(0, p)
                    if (entries.indexOf(name) < 0) {
                        entries.push(name)
                        fs.copyFileSync(pathChild, pathChildNew);

                    }
                    else {
                        console.log("duplicate : " + pathChild)
                    }

                }

            }
        }
    }


}

cleanMusic("H:\\Musique", "H:\\Musique2");
console.log(JSON.stringify(entries, 0, null))