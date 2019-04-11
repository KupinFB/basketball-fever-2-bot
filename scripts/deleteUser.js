const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "kupin.s",
    password: "JAZoXABeXAqal2D8MUhBBixb",
    database: "kupin_db"
});

con.connect(function(err) {
    const sql = "DELETE FROM lc_messages WHERE player_id='1420224898078255'";
    //const sql = "SELECT * FROM lc_messages"; // WHERE player_id=2134020496614200";
    con.query(sql, [], function (err, result, fields) {
        if (err) throw err;
        for(let i=0; i< result.length; i++){
            //console.log('-> ', result[i].step, result[i].datetime);
        }
    });
});