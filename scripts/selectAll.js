const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "kupin.s",
    password: "JAZoXABeXAqal2D8MUhBBixb",
    database: "kupin_db"
});

con.connect(function(err) {
    const sql = "SELECT * FROM lc_messages LIMIT 10";
    //const sql = "SELECT * FROM lc_messages WHERE TIMESTAMPDIFF(SECOND, datetime, NOW())<=30 LIMIT 10";
    //const sql = "SELECT * FROM lc_messages WHERE step = 0 AND TIMESTAMPDIFF(MINUTE, datetime, NOW())<=24 LIMIT 10";
    //const sql = "SELECT COUNT(*) FROM lc_messages;";

    //const sql = "SELECT * FROM lc_messages WHERE player_id=2134020496614200";
    //const sql = "SELECT * FROM lc_messages"; // WHERE player_id=2134020496614200";
    con.query(sql, [], function (err, result, fields) {
        if (err) throw err;
        for(var i=0; i< result.length; i++){
            //console.log('-> ', result);
            //console.log('-> ', result[i].step, result[i].datetime);
        }
    });
});