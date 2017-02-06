/**
 * Created by claud on 04/02/2017.
 */

var exportMongoToNeo = require('../bin/exportMongoToNeo.js');
var fileUpload= require('../bin/fileUpload.js');

var uploadToNeo = {

    uploadAndImport: function (serverPath, callback) {
        if (req.body.serverPath) {
            var data = fs.readFileSync(req.body.serverPath);
            if (!data) {
                var message = "Cannot read file " + serverPath;
                callback(message);
                return;
            }
            try {
                data = JSON.parse("" + data);
            }
            catch (e) {
                callback(e);
                return;
            }
            if (!data[0]) {
                var e = "the file does not contain an array of nodes or relations"
                callback(e);
                return;
            }

            if (data[0].r)
                exportMongoToNeo.copyRelations(data, callback);
            else
                exportMongoToNeo.copyNodes(data, callback);

        }
        else {
            fileUpload.upload(req, function (err, data) {
                try {
                    data = JSON.parse("" + data);
                }
                catch (e) {
                    callback(e);
                    return;
                }
                if (!data[0]) {
                    var e = "the file does not contain an array of nodes or relations"
                    callback(e);
                    return;
                }

                if (data[0].r)
                    exportMongoToNeo.copyRelations(data, callback);
                else
                    exportMongoToNeo.copyNodes(data, callback);
            });
        }


    }


}


module.exports = uploadToNeo;