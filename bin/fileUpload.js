var fs = require('fs');
var multer = require('multer');




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
    upload: function (req, callback) {
        var storage = diskStorage;
      if (callback)
            storage = memStorage;
        var upload = multer({storage: storage}).single('photo');
        upload(req, res, function (err) {
            if (err) {
                callback('Error Occured' + err);
                return;
            }
            callback(null, req.file.buffer)

        })

    }


}



module.exports = fileUpload;