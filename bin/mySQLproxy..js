var mysql = require('mysql');
var elasticProxy = require('./elasticProxy.js');


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

var connOptions = {
    host: "localhost",
    user: "root",
    password: "vi0lon",
    database: 'phototheque'
}


if (false) {
    mySQLproxy.find(connOptions, "select * from phototheque limit 100", function (err, result) {
        var x = result;
        console.log(JSON.stringify(result[0], null, 2))
    });
}
if (false) {
    elasticProxy.indexSqlTable(connOptions, "select * from phototheque", "phototheque", "phototheque", function (err, result) {
        var x = 1;
        console.log("done");
    })
}