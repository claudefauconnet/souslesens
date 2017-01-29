var jsonfile = require('jsonfile');
//var _file = './bin/storedData.js';
var _file = '../bin/storedData.js';

var storedData={
    displayParams:{aa:"a",bb:"bbb" },
    queries:{},
}

write(storedData)
//read();
function read(file){
    if(!file)
        file=_file;
    currentJson=jsonfile.readFileSync(file);
}
function write(obj,file){
    if(!file)
        file=_file;
if(!obj)
    obj=currentJson;

    jsonfile.writeFile(file, obj, function (err) {
        console.error(err)
    })
}
var currentJson;
var jsonFileReader={




    load: function (field,response){
        if(currentJson==null)
       read();
        if(currentJson) {
            response.setHeader('Content-Type', 'application/json');
            response.send (JSON.stringify(currentJson[field]));
        }

    },

    save: function ( obj,response){
        if(currentJson==null)
            read();
        for(var key in obj){
            var value=obj[key];

        if(currentJson) {
            currentJson[key] = value;
        }

        }
        write();;
        response.send("params saved")


    }










}
module.exports=jsonFileReader;