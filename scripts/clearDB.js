const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "kupin.s",
    password: "JAZoXABeXAqal2D8MUhBBixb",
    database: "kupin_db"
});

// ALTER TABLE `lc_messages` ADD `step` INT NOT NULL DEFAULT '0' AFTER `datetime`;

con.connect(function(err) {
    var sql = "TRUNCATE TABLE lc_messages";
    con.query(sql, [], function (err, result, fields) {
        if (err) throw err;
    });
});


