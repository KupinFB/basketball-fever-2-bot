// my ip : 130.180.212.30

/** DBMessage Interface
 * @typedef {Object} DBMessage
 * @property {string} sender_id - senders id from FB
 * @property {string} player_id - players id from FB */


/** DBInventoryItem Interface
 * @typedef {Object} DBInventoryItem
 * @property {int} InventoryItemID -
 * @property {string} FBPlayerID - players ID in FaceBook
 * @property {string} ItemCategory - category of item. {@link API.SHOP_OBJECT_CATEGORIES}
 * @property {string} ItemGUID - item GUID. {@link API.OBJECTS_GUIDS}
 * @property {int} Count -
 * @property {Date} AddingDateTime -
 * @property {int} IsActive -
 */

/** DBPlayer Interface
 * @typedef {Object} DBPlayer
 * @property {int} PlayerID - players ID in game
 * @property {string} FBPlayerID - players ID in FaceBook
 * @property {string} FBSenderID - senders ID between player and bot
 * @property {string} FBCurrentLocale - Player locale
 * @property {string} FBName - players name
 * @property {string} FBPhotoURL - URL of players photo
 * @property {Date} CreationDateTime - CDate
 * @property {Date} LastPlayDateTime - MDate
 * @property {int} AvailableMessagesCount
 * @property {int} FBBestScore
 * @property {int} IsActive
 * @property {Date} SessionStartDateTime
 * @property {int} DaysCount
 */

/** DBChallenge Interface
 * @typedef {Object} DBChallenge
 * @property {int} ChallengeID - challenge ID in game
 * @property {string} CreatorFBPlayerID - player/creator's ID in FaceBook
 * @property {string} OpponentFBPlayerID - opponent ID in FaceBook
 * @property {string} ContextID  - context id
 * @property {Date} CreationDateTime - CDate
 */

/** DBDuelOpponent Interface
 * @typedef {Object} DBDuelOpponent
 * @property {string} opponentName - challenge ID in game
 * @property {string} opponentPhotoURL -
 */

/** DBScheduleTask Interface
 * @typedef {Object} DBScheduleTask
 * @property {int} TaskID - row id
 * @property {string} FBPlayerID - players ID in FaceBook
 * @property {string} FBSenderID - senders ID between player and bot
 * @property {string} Template - message template type @link {SchedulerTask.TEMPLATES}
 * @property {Date} DateTime - time when we should process the task
 * @property {string} TemplateData - data for the template. String of object or empty string.
 * @property {Date} CreationDateTime - CDate
 */

/** @namespace MySQL */

/**
 * @typedef {Object} MySQL.ConnectionSettings
 * @property {string} host
 * @property {string} user
 * @property {string} password
 * @property {string} database
 */

/**
 * @typedef {Object} MySQL.Connection
 * @property {Function} end
 * @property {Function} query
 */

const mysql = require('mysql');
const mathHelper = require('./../helpers/mathHelper');


class DBHelper{

    /** @param {Settings} settings
     * @constructor */
    constructor(settings){
        /** @type {MySQL.ConnectionSettings} */
        this.connectionSettings = {};
        this.connectionSettings.host = settings.DB_HOST;
        this.connectionSettings.user = settings.DB_USER;
        this.connectionSettings.password = settings.DB_USER_PASS;
        this.connectionSettings.database = settings.DB_NAME;
    }

    /** Creates connection to DB
     * @param {MySQL.ConnectionSettings} connectionSettings
     * @returns {Promise<MySQL.Connection>} */
    static connect(connectionSettings) {
        return new Promise((resolve, reject) => {
            try{
                const con = mysql.createConnection(connectionSettings);
                con.connect((err) => {
                    if (err) {
                        reject({message: err});
                    }else{
                        resolve(con);
                    }
                });
            }catch (ex){
                reject({message: ex});
            }
        });
    }

    /** Closes connection to DB
     * @param {MySQL.Connection} connection - connection to DB */
    static endConnection(connection) {
        if(connection){
            connection.end();
        }
    }

    /** Does SQL query
     * @param {MySQL.Connection} con - connection to DB
     * @param {string} sql - SQL string
     * @param {Array} params - array op params for SQL string
     * @returns {Promise} */
    query(con, sql, params) {
        return new Promise((resolve, reject) => {
            try{
                con.query(sql, params, (err, result) => { // , fields
                    if (err) {
                        reject({message: err});
                    }else{
                        resolve(result);
                    }
                });
            }catch (ex) {
                reject({message: ex});
            }
        });
    }

    /** Returns promise with connection to DB.
     * Accepts function that returns promise with your code and this function receives connection.
     * Connection will be closed after resolving of your promise.
     * @param {Function} promiseFunc - This function accepts connection and has to return promise. Connection will be closed automatically on this promise resolving or rejection.
     * @returns {Promise} - this function returns a promise with data that returns a promise from promiseFunc() */
    doConnection (promiseFunc){
        return new Promise((resolve, reject) => {
            let connection;
            DBHelper.connect(this.connectionSettings).then((con) => {
                connection = con;
                return promiseFunc(con);
            }).then((data) => {
                DBHelper.endConnection(connection);
                resolve(data);
            }).catch((reason) => {
                DBHelper.endConnection(connection);
                reject(reason);
            })
        });
    }

    /** Connect to DB and then do query with params array
     * @param {String} sql - SQL string
     * @param {Array} paramsArr - array op params for SQL string
     * @returns {Promise} */
    connectAndQuery(sql, paramsArr){
        return this.doConnection((connection)=>{
            return new Promise((resolve, reject) => {
                this.query(connection, sql, paramsArr).then(resolve).catch(reject);
            });
        });
    }


    /**@param {DBPlayer|Object} playerData
     * @returns {Promise<Array<DBPlayer>> || Promise<SQLResultSet>}*/
    addPlayer(playerData, returnFullPlayerData) {
        return this.doConnection((connection)=>{
            return new Promise((resolve, reject) => {
                //console.log(playerData);
                const sql = 'INSERT INTO mt_players (FBPlayerID, FBSenderID, FBCurrentLocale, FBName, ' +
                    'FBPhotoURL, CreationDateTime, LastPlayDateTime, AvailableMessagesCount, FBBestScore, IsActive) ' +
                    'values (?,?,?,?,?, NOW(), NOW(), 5, ?, 1)';
                this.query(connection, sql,
                    [playerData.FBPlayerID, playerData.FBSenderID, playerData.FBCurrentLocale, playerData.FBName, playerData.FBPhotoURL, playerData.FBBestScore])
                    .then((res) => {
                        if(returnFullPlayerData){
                            return this.query(connection, 'SELECT * FROM view_players WHERE PlayerID=' + res.insertId, []);
                        }else{
                            return res;
                        }
                    })
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     *
     * @param {DBPlayer} currentPlayerData
     * @param {DBPlayer|Object} newPlayerData
     * @returns {Promise<Array<DBPlayer>>}
     */
    updatePlayer(currentPlayerData, newPlayerData) {
        return this.doConnection((connection)=>{
            return new Promise((resolve, reject) => {
                this.query(connection, "UPDATE mt_players SET " +
                    "   FBCurrentLocale = ?, " +
                    "   FBName = ?, " +
                    "   FBPhotoURL = ?, " +
                    "   LastPlayDateTime = NOW(), " +
                    "   AvailableMessagesCount = ?, " +
                    "   FBBestScore = ? " +
                    "WHERE PlayerID = ?;",
                    [
                        newPlayerData.FBCurrentLocale?newPlayerData.FBCurrentLocale:currentPlayerData.FBCurrentLocale,
                        newPlayerData.FBName?newPlayerData.FBName:currentPlayerData.FBName,
                        newPlayerData.FBPhotoURL?newPlayerData.FBPhotoURL:currentPlayerData.FBPhotoURL,
                        5,
                        newPlayerData.FBBestScore>currentPlayerData.FBBestScore?newPlayerData.FBBestScore:currentPlayerData.FBBestScore,
                        currentPlayerData.PlayerID
                    ])
                    .then(() => {
                        return this.query(connection, 'SELECT * FROM view_players WHERE PlayerID=' + currentPlayerData.PlayerID, []);
                    })
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**@param {string} condition
     * @returns {Promise<Array<DBPlayer>>}*/
    getPlayers(condition) {
        return this.connectAndQuery('SELECT * from view_players '+condition, []);
    }

    /**
     * @param {string} playerID
     * @param {string} opponentID
     * @param {string} contextID
     * @returns {Promise<SQLResultSet>}*/
    addChallenge(playerID, opponentID, contextID) {
        return this.connectAndQuery('INSERT INTO mt_challenges (CreatorFBPlayerID, OpponentFBPlayerID, ContextID, CreationDateTime) ' +
            'values (?,?,?, NOW())',
            [playerID, opponentID, contextID] );
    }


    /**
     * @param {string} condition
     * @returns {Promise<Array<DBChallenge>>}*/
    getChallenges(condition) {
        return this.connectAndQuery('SELECT * from mt_challenges ' + condition, []);
    }

    /**
     * @param {number} challengeID
     * @returns {Promise<DBChallenge>}*/
    getChallenge(challengeID) {
        return new Promise((resolve, reject)=>{
            this.connectAndQuery('SELECT * FROM mt_challenges WHERE ChallengeID = ?', [challengeID])
                .then((arr)=>{
                    if(!arr || !arr.length){
                        reject({code: 'NOT_FOUND', message: 'This challenge was not found'})
                    }else{
                        resolve(arr[0]);
                    }
                })
                .catch(reject);
        });
    }

    /**
     * @param {number} challengeID
     * @returns {Promise<SQLResultSet>}*/
    deleteChallenge(challengeID) {
        return this.connectAndQuery('DELETE FROM mt_challenges WHERE ChallengeID = ?;', [challengeID]);
    }

    /**
     * @param {number} challengeID
     * @returns {Promise<SQLResultSet>}*/
    doneChallenge(challengeID) {
        return this.connectAndQuery('UPDATE mt_challenges SET ' +
            'Status = ? ' +
            'WHERE ChallengeID = ?;',
            ['DONE', challengeID]);
    }

    /**
     * @param {string} playerID
     * @returns {Promise<DBDuelOpponent>}*/
    retrieveDuelOpponent(playerID) {
        return new Promise((resolve, reject)=>{
            this.connectAndQuery('SELECT * FROM mt_players WHERE FBPlayerID <> ? ORDER BY RAND() LIMIT 1', [playerID])
                .then((arr)=>{
                    if(!arr || !arr.length){
                        reject({code: 'NOT_FOUND', message: 'Opponent was not found'})
                    }else{
                        resolve({
                            opponentName: arr[0].FBName,
                            opponentPhotoURL: arr[0].FBPhotoURL
                        });
                    }
                })
                .catch(reject);
        });
    }


    /**@param {SchedulerTask} task
     * @returns {Promise}*/
    addSchedulerTask(task) {
        let templateDataStr = '';
        if(task.templateData){
            try{ templateDataStr = JSON.stringify(task.templateData); }catch (e) { }
        }
        return this.connectAndQuery('INSERT INTO mt_schedulertasks (FBPlayerID, FBSenderID, DateTime, Template, TemplateData, CreationDateTime) ' +
            'values (?,?,?,?,?, NOW())',
            [task.playerID, task.senderID, task.time, task.template, templateDataStr] );
    }

    /** Returns a list of all tasks that have to be processed
     * @returns {Promise<Array<DBScheduleTask>>} */
    getActualSchedulerTasks() {
        return this.connectAndQuery('SELECT * FROM mt_schedulertasks WHERE DateTime < NOW()', []);
    }

    getSchedulerTask(FBPlayerID, Template){
        return this.connectAndQuery('SELECT * from mt_schedulerTasks WHERE FBPlayerID = ? AND Template = ?;',
            [FBPlayerID, Template]);
    }


    /** Returns a list of all tasks of player
     * @prop {string} FBPlayerID - FB player ID
     * @returns {Promise<Array<DBScheduleTask>>} */
    getSchedulerTasksOfPlayer(FBPlayerID) {
        return this.connectAndQuery('SELECT * FROM mt_schedulertasks WHERE FBPlayerID = ?;', [FBPlayerID]);
    }

    /** Removes the task from DB
     * @param {int} taskID
     * @returns {Promise} */
    removeSchedulerTask(taskID) {
        return this.connectAndQuery('DELETE FROM mt_schedulertasks WHERE TaskID = ?;', [taskID]);
    }

    /** @param FBPlayerID
     * @param {string} Template - see {@link SchedulerTask.TEMPLATES}
     * @returns {Promise} */
    removeSchedulerTaskByTemplate(FBPlayerID, Template) {
        return this.connectAndQuery('DELETE from mt_schedulertasks WHERE FBPlayerID = ? AND Template = ?;', [FBPlayerID,Template]);
    }

    addSession(FBPlayerID) {
        return this.connectAndQuery('INSERT INTO mt_play_sessions (FBPlayerID, SessionStartDateTime, DaysCount) ' +
            'values (?, NOW(), 0)',
            [FBPlayerID]);
    }

    updateSession(FBPlayerID, DaysCount, SessionStartDateTime) {
        return this.connectAndQuery('UPDATE mt_play_sessions SET ' +
            'SessionStartDateTime = ?, ' +
            'DaysCount = ? ' +
            'WHERE FBPlayerID = ?;',
            [SessionStartDateTime, DaysCount, FBPlayerID]);
    }


    /**
     * @param {string} FBPlayerID
     * @param {string} category - see {@link API.SHOP_OBJECT_CATEGORIES}
     * @param {string} itemGUID - see {@link API.OBJECTS_GUIDS}
     * @param {int} count
     * @returns {Promise} */
    addInventoryItem(FBPlayerID, category, itemGUID, count) {
        return this.connectAndQuery('INSERT INTO mt_inventory_items (FBPlayerID, ItemCategory, ItemGUID, Count, AddingDateTime) ' +
            'values (?, ?, ?, ?, NOW())',
            [FBPlayerID, category, itemGUID, count]);
    }
    /**
     * @param {string} FBPlayerID
     * @param {string} category - see {@link API.SHOP_OBJECT_CATEGORIES}
     * @param {string} itemGUID - see {@link API.OBJECTS_GUIDS}
     * @returns {Promise<Array<DBInventoryItem>>} */
    getInventoryItem(FBPlayerID, category, itemGUID) {
        return this.connectAndQuery('SELECT * FROM mt_inventory_items WHERE FBPlayerID = ? AND ItemCategory = ? AND ItemGUID = ?;',
            [FBPlayerID, category, itemGUID]);
    }
    /**
     * @param {string} FBPlayerID
     * @param {string} firstCategory - see {@link API.SHOP_OBJECT_CATEGORIES}
     * @param {string} firstItemGUID - see {@link API.OBJECTS_GUIDS}
     * @param {string} secondCategory - see {@link API.SHOP_OBJECT_CATEGORIES}
     * @param {string} secondItemGUID - see {@link API.OBJECTS_GUIDS}
     * @returns {Promise<Array<DBInventoryItem>>} */
    getInventoryItems(FBPlayerID, firstCategory, firstItemGUID, secondCategory, secondItemGUID) {
        return this.connectAndQuery('SELECT * FROM mt_inventory_items WHERE (FBPlayerID = ? AND ItemCategory = ? AND ItemGUID = ?) OR (ItemCategory = ? AND ItemGUID = ? AND FBPlayerID = ?);',
            [FBPlayerID, firstCategory, firstItemGUID, secondCategory, secondItemGUID, FBPlayerID]);
    }

    checkAbilityToSendMessages(FBPlayerID) {
        return new Promise((resolve, reject) => {
            this.connectAndQuery('SELECT * FROM mt_players WHERE FBPlayerID = ? AND AvailableMessagesCount > 0 AND TIMESTAMPDIFF(HOUR, NOW(), LastPlayDateTime) < 239;',
                [FBPlayerID]).then((playersArr) => {
                if (playersArr && playersArr.length > 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }).catch((reason) => {
                reject(reason);
                //console.log(reject);
            });
        });
    }

    decreaseMessage(FBPlayerID){
        return this.connectAndQuery('UPDATE mt_players SET ' +
            'AvailableMessagesCount = AvailableMessagesCount - 1 ' +
            'WHERE FBPlayerID = ?;',
            [FBPlayerID]);
    }


}
exports.DBHelper = DBHelper;

