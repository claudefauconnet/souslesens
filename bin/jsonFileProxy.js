var jsonfile = require('jsonfile');
var _file = 'storedData.js';


function write(obj, file) {
    if (!file)
        file = _file;
    if (!obj)
        obj = currentJson;

    jsonfile.writeFile(file, obj, function (err) {
        console.error(err)
    })
}
var currentJson;
var jsonFileProxy = {


    load: function (type, user, callback) {
        if (currentJson == null)
            read();
        if (currentJson) {
            callback(null, currentJson[type][user]);
        }

    },

    save: function (type, obj, user, callback) {
        if (currentJson == null)
            read();

        if (currentJson) {
            if (!currentJson[type])
                currentJson[type] = {}
            if (!currentJson[type][user])
                currentJson[type][user] = {}
            currentJson[type][user][obj.name] = {
                value: obj.value,
                description: obj.description,
                scope: obj.scope
            };
        }
        write();
        callback(null, "{ok :\"params saved\"")


    }


}
module.exports = jsonFileProxy;