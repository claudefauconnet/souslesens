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
    upload: function (req, res, callback) {
        var storage = diskStorage;
        if (callback)
            storage = memStorage;
        var upload = multer({storage: storage}).single('photo');
        upload(req, res, function (err) {
            if (err) {
                console.log('Error Occured'+err);
                return;
            }
            if (callback) {
                callback(null, req.file.buffer)
            } else {
                console.log(req.file);
                res.end('Your File Uploaded');
                console.log('Photo Uploaded');
            }
        })

    }


}


module.exports = fileUpload;