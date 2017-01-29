var jsonfile = require('jsonfile');
var _file = 'storedData.js';
//var _file = '../bin/storedData.js';

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
var jsonFileProxy={




    load: function (type,user,response){
        if(currentJson==null)
       read();
        if(currentJson) {
            response.setHeader('Content-Type', 'application/json');
            response.send (JSON.stringify(currentJson[type][user]));
            response.end();
        }

    },

    save: function (type, obj,user,response){
        if(currentJson==null)
            read();

        if(currentJson) {
            if(! currentJson[type])
                currentJson[type]={}
            if(! currentJson[type][user])
                currentJson[type][user]={}
            currentJson[type][user][obj.name]= {value:obj.value,
                description:obj.description,
                scope:obj.scope};
        }


        write();
        response.send("{ok :\"params saved\"")
        response.end();


    }










}
module.exports=jsonFileProxy;