var fs=require('fs');
var pathLib=require('path')

var license=fs.readFileSync("../license.txt");

var pathes=["public/admin/js",
    "public/admin/",
    "public/admin/js",
    "public/common/",
    "public/common/js",
    "public/toutlesens/",
    "public/toutlsesens/js",
    "public/toutlsesens/js/d3",
    "public/toutlsesens/js/resources",

]

for(var i=0;i<pathes.length;i++) {
    var path = "../" + pathes[i]+"/";
    var files = fs.readdirSync(path);
    for(var j=0;j<files.length;j++) {
       if( fs.lstatSync(path+files[j]).isDirectory())
           continue;
        var data=fs.readFileSync(path+files[j]);
        if(false) {
            if ((/.*The MIT License/).test(data)) {
                console.log(files[i])
            }
            else {
                data = license + data;
                fs.writeFileSync(path + files[j], data)
            }
        }
        if(true){
            if((/TOUTLESENS LICENCE/).test(data)){
                console.log(files[i])

                data = (""+data).replace("TOUTLESENS LICENCE","SOUSLESENS LICENCE");
                fs.writeFileSync(path+files[j], data)
            }
        }
    }

}
