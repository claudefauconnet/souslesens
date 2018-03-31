var mysql = require('mysql');
//var nodeMaria = require('node-mariadb');
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





if (false) {
    var connOptions = {
        host: "localhost",
        user: "root",
        password: "vi0lon",
        database: 'phototheque'
    }
    elasticProxy.indexSqlTable(connOptions, "select * from phototheque", "phototheque", "phototheque", function (err, result) {
        var x = 1;
        console.log("done");
    })
}

if (false) {
    var connOptions = {
        host: "localhost",
        user: "root",
        password: "vi0lon",
        database: 'audiotheque'
    }
    elasticProxy.indexSqlTable(connOptions, "select * from audiotheque", "audiotheque", "audiotheque", function (err, result) {
        var x = 1;
        console.log("done");
    })
}