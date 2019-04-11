const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "kupin.s",
    password: "JAZoXABeXAqal2D8MUhBBixb",
    database: "kupin_db"
});

// ALTER TABLE `lc_messages` ADD `step` INT NOT NULL DEFAULT '0' AFTER `datetime`;

con.connect(function(err) {
    var sql = "UPDATE lc_messages SET datetime = '2018-05-14 22:00:00'  WHERE player_id = '1644748095603659'"; //2134020496614200
    con.query(sql, [], function (err, result, fields) {
        if (err) throw err;
    });
});