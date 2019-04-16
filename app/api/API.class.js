// const consoleLogger = require('../helpers/consoleLogger');
// const request = require('request');

const Scheduler = require('./../scheduller/Scheduler.class').Scheduler;
const SchedulerTask = require('./../scheduller/SchedulerTask.class').SchedulerTask;

const path = require('path');
const friendsCache = require('./../data/friendsCache');
const messagesGenerator = require('./../helpers/messagesGenerator');
const crypto = require('crypto-js');


/* CUSTOM TYPES DECLARATION */

/** @typedef {Object} API.RequestPlayerGet
 *  @property {string} playerID - FBPlayerID
 *  @property {string} playerName - Player FB Name
 *  @property {string} playerPhotoURL - Player FB Photo URL
 *  @property {string} playerLocale - Locale of player player
 *  @property {int} playerBestScore -
 */

/** @typedef {Object} API.RequestChallengeAdd
 *  @property {string} playerID - player FB ID
 *  @property {string} opponentID - opponent FB ID
 *  @property {string} contextID - FB context iD
 */
/** @typedef {Object} API.RequestChallengeGet
 *  @property {string} playerID - player FB ID
 *  @property {number} challengeID - challenge ID
 */
/** @typedef {API.RequestChallengeGet} API.RequestChallengeDelete */
/** @typedef {API.RequestChallengeGet} API.RequestChallengeDone */

/** @typedef {Object} API.RequestDuelOpponentRetrieve
 *  @property {string} playerID - player FB ID*/

/** @typedef {Object} API.RequestDataToSetFriends
 *  @property {string} id - FBPlayerID
 *  @property {string} name - Player Name
 *  @property {string} photo - Photo URL
 *  @property {string} locale -
 *  @property {boolean} isNewPlayer -
 *  @property {Array<string>} friendsArr - Array of friends IDs
 */

/** @typedef {Object} API.RequestDataToNotifyBuying
 *  @property {string} id - FBPlayerID
 *  @property {API.SHOP_OBJECT_CATEGORIES} objectCategory - Type of the object that was buying {@link API.SHOP_OBJECT_CATEGORIES}
 *  @property {string} objectGUID - Guid of object
 */

/** @typedef {Object} API.GameRequest
 *  @property {API.GameRequestBody} body
 */

/** @typedef {Object} API.GameRequestBody
 *  @property {string} playerId - FBPlayerID
 *  @property {string} signature - Signature to validate {@link API.CheckRequestSignature} and process {@link API.GetEncodedSignatureData}
 */

/* END - CUSTOM TYPES DECLARATION */

/** @class */
class API {

    /** @param {Object} app
     * @param {Settings} settings
     * @param {DBHelper} db
     * @param {Scheduler} scheduler
     * @constructor */
    constructor(app, settings, db, scheduler) {

        this.app = app;
        /** @private
         * @type {Settings} **/
        this.settings = settings;
        /** @type {DBHelper|Object} **/
        this.db = db;
        /** @type {Scheduler} **/
        this.scheduler = scheduler;

        this.initialize();
    }

    initialize() {

        /* STATIC REQUESTS */
        this.app.get(API.ROUTES.STATIC_HTML_PRIVACY_POLICY, (req, res) => {
            API.ResponseFile(res, path.resolve(__dirname + '/../../static/html/privacy-policy.html'));
        });
        this.app.get(API.ROUTES.STATIC_HTML_TOS, (req, res) => {
            API.ResponseFile(res, path.resolve(__dirname+ '/../../static/html/tos.html'));
        });
        this.app.get(API.ROUTES.STATIC_IMG_THANKS_FOR_PLAYING_IMG, (req, res) => {
            API.ResponseFile(res, path.resolve(__dirname+ '/../../static/images/thanks_for_playing.jpg'));
        });
        this.app.get(API.ROUTES.STATIC_IMG_GIFT_COINS, (req, res) => {
            API.ResponseFile(res, path.resolve(__dirname+ '/../../static/images/gift_coins.jpg'));
        });
        this.app.get(API.ROUTES.STATIC_CONFIG, (req, res) => {
            API.ResponseFile(res, path.resolve(__dirname+ '/../../static/data/config.json'));
        });


        /* API REQUESTS */
        this.app.post(API.ROUTES.PLAYER_ADD, (req, res)=>{this.onRequestPlayerAdd(req, res)});
        this.app.post(API.ROUTES.PLAYER_GET, (req, res)=>{this.onRequestPlayerGet(req, res)});
        this.app.post(API.ROUTES.PLAYER_INIT, (req, res)=>{this.onRequestPlayerInit(req, res)});
        this.app.post(API.ROUTES.PLAYER_FRIENDS_NOTIFY, (req, res)=>{this.onRequestNotifyFriends(req, res)});
        this.app.post(API.ROUTES.PLAYER_NOTIFY_BUY, (req, res)=>{this.onRequestNotifyBuying(req, res)});

        this.app.post(API.ROUTES.CHALLENGE_ADD, (req, res)=>{this.onRequestChallengeAdd(req, res)});
        this.app.post(API.ROUTES.CHALLENGE_GET, (req, res)=>{this.onRequestChallengeGet(req, res)});
        this.app.post(API.ROUTES.CHALLENGE_DELETE, (req, res)=>{this.onRequestChallengeDelete(req, res)});
        this.app.post(API.ROUTES.CHALLENGE_DONE, (req, res)=>{this.onRequestChallengeDone(req, res)});

        this.app.post(API.ROUTES.SCHEDULER_ADD_D1, (req, res)=>{this.onAddSchedullerTaskD1(req, res)});

        this.app.post(API.ROUTES.DUEL_OPPONENT_RETRIEVE, (req, res)=>{this.onRequestDuelOpponentRetrieve(req, res)});
    }

    /** Request on loading of player data. We try to add this player if does not exist.
     * Also we update player data if we need it.
     * And return player data.
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestPlayerInit(request, response){
        //console.log('onRequestPlayerInit');
        const playerId = request.body.playerID;
        /** @type {API.RequestPlayerGet} */
        const data = this.processData(request);
        if(data){
            //console.log('data: ', data);
            if(data.playerID === playerId){
                //console.log('data.playerID === playerId: ', data.playerID === playerId);
                this.db.getPlayers("WHERE FBPlayerID='" + data.playerID + "'")
                    .then((playersArr) => {
                        if (playersArr && playersArr.length > 0) {
                            // ПОЛЬЗОВАТЕЛЬ СУЩУСТВУЕТ
                            return new Promise((resolve, reject) => {
                                /** @type {Array<DBPlayer>} */
                                let currentPlayersArr = [];
                                let sessionWasReset = true;
                                let sessionDays = 0;
                                let sessionStart = new Date();
                                let playerDataForInsert = Object.assign({}, playersArr[0]);
                                playerDataForInsert.FBName = data.playerName;
                                playerDataForInsert.FBPhotoURL = data.playerPhotoURL;
                                playerDataForInsert.FBCurrentLocale = data.playerLocale;
                                playerDataForInsert.FBBestScore = data.playerBestScore;
                                this.db.updatePlayer(playersArr[0], playerDataForInsert).then((players) => {
                                    currentPlayersArr = players;
                                    sessionStart = currentPlayersArr[0].LastPlayDateTime;
                                    if ((Date.now() <= (currentPlayersArr[0].SessionStartDateTime.getTime() + ((currentPlayersArr[0].DaysCount + 1) * Scheduler.TIME_CONSTANTS.DAY) + 8 * Scheduler.TIME_CONSTANTS.HOUR))) {
                                        sessionWasReset = false;
                                        sessionDays = Math.floor((Date.now() - currentPlayersArr[0].SessionStartDateTime.getTime()) / Scheduler.TIME_CONSTANTS.DAY);
                                        sessionStart = currentPlayersArr[0].SessionStartDateTime;
                                    }
                                    return this.db.updateSession(playerId, sessionDays, sessionStart);
                                }).then(() => {
                                    currentPlayersArr[0].DaysCount = sessionDays;
                                    currentPlayersArr[0].SessionStartDateTime = sessionStart;
                                    // удалить все задачи при сбросе сесиии
                                    if (sessionWasReset) {
                                        Promise.all([
                                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D1),
                                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D2),
                                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D3)
                                        ]).then(() => {
                                            resolve(currentPlayersArr);
                                        }).catch(() => {
                                            resolve(currentPlayersArr);
                                        })
                                    } else {
                                        resolve(currentPlayersArr);
                                    }
                                }).catch(reject);
                            });
                        }else{
                            // НОВЫЙ ПОЛЬЗОВАТЕЛЬ
                            return new Promise((resolve, reject)=>{

                                console.log('ADD player 2');
                                this.db.addPlayer({
                                    FBPlayerID: data.playerID,
                                    FBSenderID: '',
                                    FBCurrentLocale: data.playerLocale,
                                    FBName: data.playerName,
                                    FBPhotoURL: data.playerPhotoURL,
                                    FBBestScore: data.playerBestScore
                                }, false)
                                    .then(()=>{
                                        return this.db.addSession(data.playerID);
                                    })
                                    .then(()=>{
                                        return this.db.getPlayers("WHERE FBPlayerID='" + data.playerID + "'");
                                    })
                                    .then(resolve)
                                    .catch(reject);
                            });
                        }
                    })
                    .then((playersArr) => {

                        response.json({
                            'success':true,
                            data: {
                                PlayerID: playersArr[0].PlayerID,
                                FBPlayerID: playersArr[0].FBPlayerID,
                                FBName: playersArr[0].FBName,
                                FBPhotoURL: playersArr[0].FBPhotoURL,
                                FBCurrentLocale: playersArr[0].FBCurrentLocale,
                                FBBestScore: playersArr[0].FBBestScore,
                                LastPlayDateTime: playersArr[0].LastPlayDateTime,
                                CreationDateTime: playersArr[0].CreationDateTime,
                                SessionStartDateTime: playersArr[0].SessionStartDateTime,
                                DaysCount: playersArr[0].DaysCount
                            }
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add player request:', reason);
                        response.json({'success':false});
                    });
            }
        } else {
            response.json({'success':false});
        }
    }

    /** Request on loading of player data.
     * Also we update player data if we need it.
     * And return player data.
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestPlayerGet(request, response){
        const playerId = request.body.playerID;
        /** @type {API.RequestPlayerGet} */
        const data = this.processData(request);
        if(data){
            if(data.playerID === playerId){
                this.db.getPlayers("WHERE FBPlayerID='" + data.playerID + "'")
                    .then((playersArr) => {
                        if (playersArr && playersArr.length > 0) {
                            return playersArr;
                        }else{
                            return new Promise((resolve, reject)=>{
                                console.log('ADD player 1');
                                this.db.addPlayer({
                                    FBPlayerID: data.playerID,
                                    FBSenderID: '',
                                    FBCurrentLocale: data.playerLocale,
                                    FBName: data.playerName,
                                    FBPhotoURL: data.playerPhotoURL,
                                    FBBestScore: data.playerBestScore
                                }, false)
                                    .then(()=>{
                                        return this.db.addSession(data.playerID);
                                    })
                                    .then(()=>{
                                        return this.db.getPlayers("WHERE FBPlayerID='" + data.playerID + "'");
                                    })
                                    .then(resolve)
                                    .catch(reject);
                            });
                        }
                    })
                    .then((playersArr) => {

                        response.json({
                            'success':true,
                            data: {
                                PlayerID: playersArr[0].PlayerID,
                                FBPlayerID: playersArr[0].FBPlayerID,
                                FBName: playersArr[0].FBName,
                                FBPhotoURL: playersArr[0].FBPhotoURL,
                                FBCurrentLocale: playersArr[0].FBCurrentLocale,
                                FBBestScore: playersArr[0].FBBestScore,
                                LastPlayDateTime: playersArr[0].LastPlayDateTime,
                                CreationDateTime: playersArr[0].CreationDateTime,
                                SessionStartDateTime: playersArr[0].SessionStartDateTime,
                                DaysCount: playersArr[0].DaysCount
                            }
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add player request:', reason);
                        response.json({'success':false});
                    });
            }
        } else {
            response.json({'success':false});
        }
    }

    /** Request on game starting to add friend if it does not exist. Returns player data
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestPlayerAdd(request, response) {


    }

    /** Request to register new challenge. Returns challenge id
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestChallengeAdd(request, response) {
        const playerId = request.body.playerID;

        /** @type {API.RequestChallengeAdd} */
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                console.log('Add challenge', data.playerID, data.opponentID, data.contextID);
                this.db.addChallenge(data.playerID, data.opponentID, data.contextID)
                    .then((res) => {
                        response.json({
                            'success':true,
                            data: { ChallengeID: res.insertId }
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add onRequestPlayerAdd request:', reason);
                        response.json({'success':false});
                    });
            }
        }
    }

    /** Request to check challenge id
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestChallengeGet(request, response) {
        const playerId = request.body.playerID;
        /** @type {API.RequestChallengeGet} */
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                console.log('Get challenge', data.challengeID);
                this.db.getChallenge(data.challengeID)
                    .then((res) => {
                        console.log('challenge: ', res);
                        response.json({
                            'success':true,
                            data: res
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process onRequestChallengeGet request:', reason);
                        response.json({'success':false});
                    });
            }
        }
    }

    /** Request to remove challenge
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestChallengeDelete(request, response) {
        const playerId = request.body.playerID;
        /** @type {API.RequestChallengeDelete} */
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                console.log('Delete challenge: ', data.challengeID);
                this.db.deleteChallenge(data.challengeID)
                    .then((res) => {
                        response.json({
                            'success':true
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add onRequestChallengeDelete request:', reason);
                        response.json({'success':false});
                    });
            }
        }
    }

    /** Request to set challeng status to "DONE"
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestChallengeDone(request, response) {
        const playerId = request.body.playerID;
        /** @type {API.RequestChallengeDelete} */
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                console.log('DONE challenge: ', data.challengeID);
                this.db.doneChallenge(data.challengeID)
                    .then((res) => {
                        response.json({
                            'success':true
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add onRequestChallengeDelete request:', reason);
                        response.json({'success':false});
                    });
            }
        }
    }


    /** Request to find fake duel opponent
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestDuelOpponentRetrieve(request, response) {
        //console.log('!!!!!!!!!!!!!!')
        const playerId = request.body.playerID;
        /** @type {API.RequestDuelOpponentRetrieve} */
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                this.db.retrieveDuelOpponent(playerId)
                    .then((res) => {
                        response.json({
                            'success':true,
                            data: res
                        });
                    })
                    .catch((reason) => {
                        console.log('Can not process add onRequestChallengeDelete request:', reason);
                        response.json({'success':false});
                    });
            }
        }
    }


    /** Processes requests to notify friends about player joining. We use it to set a friends arr to the {@link friendsCache}.
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestNotifyFriends(request, response) {
        const playerId = request.body.playerID;
        /** @type {API.RequestDataToSetFriends} */
        const data = this.processData(request);
        if(data){
            if(data.id && data.name && data.photo && data.id === playerId){
                //friendsCache.add(playerId, data.friendsArr);
                const playerFriendsIDs = data.friendsArr;
                if (playerFriendsIDs && playerFriendsIDs.length > 0) {
                    this.db.getPlayers("WHERE FBPlayerID IN (" + playerFriendsIDs.join() + ")").then((players) => {
                        for (let i = 0; i < players.length; i++) {
                            const cPlayer = players[i];
                            if (cPlayer.FBPlayerID !== playerId) {
                                if(data.isNewPlayer){
                                    API.SendMessageToPlayer(cPlayer.FBSenderID, messagesGenerator.prepareMessagesToFriendsNewPlayer(data.name, data.photo, playerId), this.settings.PAGE_ACCESS_TOKEN)
                                        .then(() => { });
                                }else{
                                    API.SendMessageToPlayer(cPlayer.FBSenderID, messagesGenerator.prepareMessagesToFriends(data.name, data.photo, playerId), this.settings.PAGE_ACCESS_TOKEN)
                                        .then(() => { });
                                }

                            }
                        }
                    });
                }
                response.json({'success':true});
            }else{
                response.json({'success':false});
            }
        } else {
            response.json({'success':false});
        }
    }

    onAddSchedullerTaskD1(request, response){
        const playerId = request.body.playerID;
        /** @type {API.RequestDataToNotifyBuying} **/
        const data = this.processData(request);
        if(data){
            if(playerId === data.playerID){
                this.db.getPlayers("WHERE FBPlayerID='" + playerId + "'").then((playersArr) => {
                    if (playersArr && playersArr.length > 0) {
                        const playerData = playersArr[0];
                        this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.D1).then(()=>{
                            return this.scheduler.add(new SchedulerTask({
                                time: new Date(Date.now() + Scheduler.TIME_CONSTANTS.DAY),
                                template: SchedulerTask.TEMPLATES.D1,
                                templateData: null,
                                playerID: playerId,
                                senderID: playerData.FBSenderID
                            }));
                        }).then(()=>{
                            response.json({'success':true});
                        }).catch((reason)=>{
                            console.log('Can not update task: ', reason);
                            response.json({'success':false});
                        })
                    }else{
                        response.json({'success':false});
                    }
                }).catch((reason)=>{
                    console.log('Can not get player: ', reason);
                    response.json({'success':false});
                });
            }else{
                response.json({'success':false});
            }
        }else{
            response.json({'success':false});
        }
    }

    /** Processes requests to notify buying. We use it to notify EyeBall and FireBall buying (to remove tasks from the scheduler).
     * @param {Object} request - Express Request object
     * @param {Object} response - Express Response object */
    onRequestNotifyBuying(request, response) {
        const playerId = request.body.playerID;
        /** @type {API.RequestDataToNotifyBuying} **/
        const data = this.processData(request);
        response.json({'success':true});

        return;

        if(data){
            this.db.getInventoryItem(playerId, data.objectCategory, data.objectGUID)
                .then( (items) => {
                    if(!items || !items[0]){
                        return this.db.addInventoryItem(playerId, data.objectCategory, data.objectGUID, 1);
                    }else{
                        return new Promise( (resolve) => { resolve() } )
                    }
                })
                .then( () => {
                    if(data.objectCategory === API.SHOP_OBJECT_CATEGORIES.BALL) {
                        if(data.objectGUID === API.OBJECTS_GUIDS.BALL.EYE) {
                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.EYE_BALL);
                        }
                        if(data.objectGUID === API.OBJECTS_GUIDS.BALL.FIRE || data.objectGUID === API.OBJECTS_GUIDS.TICKET.BALL_FIRE) {
                            // !!! DONE - D3 - удаляем тикет на фаерболл
                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D1);
                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D2);
                            this.scheduler.removeTaskByTemplate(playerId, SchedulerTask.TEMPLATES.FIRE_BALL_D3);
                        }
                    }
                } );
            response.json({'success':true});
        }else{
            response.json({'success':false});
        }
    }

    /**
     *
     * @param {Object} response - Express Response object
     * @param {string} path = path to the file that has to be responsed
     */
    static ResponseFile(response, path) {
        try{
            response.sendFile(path);
        } catch(ex) {
            response.status(404);
        }
    }

    /** @param {API.GameRequest} request
     * @returns {Object} */
    processData(request){
        if(!this.settings.IS_DEV_MODE){
            const signature = request.body.signature;
            const isValid = API.CheckRequestSignature(signature, this.settings.APP_SECRET);
            if (isValid) {
                const dataStr = API.GetEncodedSignatureData(signature);
                //console.log('--> ', dataStr);
                let data = {};
                if(dataStr){
                    try{
                        data = JSON.parse(dataStr);
                    }catch (ex) { console.log('processData CATCH:', ex); }
                }
                return data;
            }
            else {
                console.log('invalid signature');
                // response.json({'success' : false, 'error' : {message:'invalid signature'}});
            }
        }else{
            return request.body.data;
        }
    }

    /** Checks is the signature valid
     * @param {string} signedRequest
     * @param {string} appSecret
     * @returns {boolean} */
    static CheckRequestSignature(signedRequest, appSecret){
        try {
            const firstPart = signedRequest.split('.')[0];
            const replaced = firstPart.replace(/-/g, '+').replace(/_/g, '/');
            const signature = crypto.enc.Base64.parse(replaced).toString();
            const dataHash = crypto.HmacSHA256(signedRequest.split('.')[1], appSecret).toString();
            return signature === dataHash;
        } catch (ex) {
            return false;
        }
    }

    /** Converts the signature string to object
     * @param {string} signedRequest
     * @returns {String} */
    static GetEncodedSignatureData(signedRequest){
        try{
            let json = crypto.enc.Base64.parse(signedRequest.split('.')[1]).toString(crypto.enc.Utf8);
            while(json.indexOf(String.fromCharCode(0)) > -1){
                json = json.replace(String.fromCharCode(0),"?");
            }
            /** @type {{request_payload:string}} */
            const encodedData = JSON.parse(json);
            return encodedData.request_payload;
        } catch (ex) {
            console.log('GetEncodedSignatureData ex: ', ex);
            return '';
        }
    }

    /** Sends a message to the FB Messenger
     * @param sender_id - FBSenderID
     * @param response - Message Data that will be sent
     * @param accessToken - Page access token {@link Settings}
     * @returns {Promise}
     */
    static SendMessageToPlayer(sender_id, response, accessToken) {
        const request = require('request');

        return new Promise((resolve, reject) => {
            let request_body = {
                "recipient": { "id": sender_id },
                "message": response
            };
            request({
                "uri": "https://graph.facebook.com/v2.6/me/messages",
                "qs": {"access_token": accessToken},
                "method": "POST",
                "json": request_body
            }, (err) => { // (err, res, body)
                if (!err) {
                    console.log('        message sent!');
                    resolve();
                } else {
                    console.error("        Unable to send message:" + err);
                    reject({message: err});
                }
            });
        });
    }
}

/** Routes for API request
 * @enum {string} **/
API.ROUTES = {

    /** Link to PrivacyPolicy.html **/
    STATIC_HTML_PRIVACY_POLICY: '/pongfevercup/api/v1/static/html/PrivacyPolicy',

    /** Link to TOS.html **/
    STATIC_HTML_TOS: '/pongfevercup/api/v1/static/html/tos',

    /** Link to image "thanks_for_playing" **/
    STATIC_IMG_THANKS_FOR_PLAYING_IMG: '/pongfevercup/api/v1/static/images/thanks_for_playing',

    /** Link to image "gift_coins.jpg" **/
    STATIC_IMG_GIFT_COINS: '/pongfevercup/api/v1/static/images/gift_coins',

    STATIC_CONFIG: '/pongfevercup/api/v1/static/config',

    PLAYER_ADD: '/pongfevercup/api/v1/player/add',
    PLAYER_GET: '/pongfevercup/api/v1/player/get',
    PLAYER_INIT: '/pongfevercup/api/v1/player/init',

    CHALLENGE_ADD: '/pongfevercup/api/v1/challenge/add',
    CHALLENGE_GET: '/pongfevercup/api/v1/challenge/get',
    CHALLENGE_DELETE: '/pongfevercup/api/v1/challenge/delete',
    CHALLENGE_DONE: '/pongfevercup/api/v1/challenge/done',

    SCHEDULER_ADD_D1: '/pongfevercup/api/v1/scheduler/add/d1',

    DUEL_OPPONENT_RETRIEVE: '/pongfevercup/api/v1/duel/opponent/retrieve',

    /** ROUTE: set a list of friends to send "Your friend join the game" **/
    PLAYER_FRIENDS_NOTIFY: '/pongfevercup/api/v1/player/friends/notify',

    /** ROUTE: notify about ball buying. To remove scheduler tasks **/
    PLAYER_NOTIFY_BUY: '/pongfevercup/api/v1/player/notify/buying',

};

/** Categories of object that can be buying in the game shop
 * @enum {string} **/
API.SHOP_OBJECT_CATEGORIES = {
    BALL: 'ball',
    TICKET: 'ticket'
};

/** GUIDs of game objects */
API.OBJECTS_GUIDS = {
    BALL: {
        EYE: 'eye',
        FIRE: 'fire'
    },
    TICKET: {
        BALL_FIRE: 'ball_fire'
    }
};


exports.API = API;