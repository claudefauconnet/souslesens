var mysql = require('mysql');
//var nodeMaria = require('node-mariadb');




var connections = {};
var mySQLproxy = {
    getConnection: function (connOptions, callback) {
        var connectionKey = connOptions.host + ';' + connOptions.database;
        if (!connections[connectionKey]) {
            var connection = mysql.createConnection(connOptions);

            connection.connect(function (err) {
                if (err)
                    return callback(err);
                console.log("Connected!");
                connections[connectionKey] = connection;
                callback(null, connection);
            });
        }
        else
            callback(null, connections[connectionKey]);
    },


    find: function (connection, sql, callback) {
        var nodeMaria = require('node-mariadb');



        mySQLproxy.getConnection(connection, function (err, conn) {
            if (err)
                return callback(err);
            conn.query(sql, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result);
            });
        });

    }





}


module.exports = mySQLproxy;




