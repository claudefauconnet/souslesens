var fs = require('fs');
var multer = require('multer');
var serverParams=require('./serverParams.js')


var diskStorage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, '/uploads');
    },
    filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
    }
});
var memStorage = multer.memoryStorage()

//var upload = multer({storage: storage}).single('photo');


var fileUpload = {
    upload: function (req, fieldName, callback) {
        var storage = diskStorage;
        if (callback)
            storage = memStorage;
        var upload = multer({
            storage: storage,
            limits: {fileSize: serverParams.uploadMaxSize}
        }).single(fieldName);
        upload(req, null, function (err) {
            if (err) {
                callback('Error Occured' + err);
                return;
            }
            callback(null, req)

        })

    }


}


module.exports = fileUpload;