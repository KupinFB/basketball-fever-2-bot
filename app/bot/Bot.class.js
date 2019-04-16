const GamePayload = require('./GamePayload.class').GamePayload;
const Scheduler = require('./../scheduller/Scheduler.class').Scheduler;
const SchedulerTask = require('./../scheduller/SchedulerTask.class').SchedulerTask;
const API = require('./../api/API.class').API;

const consoleLogger = require('../helpers/consoleLogger');
const mockDataHelper = require('../helpers/mockDataHelper');
const messagesGenerator = require('../helpers/messagesGenerator');
const friendsCache = require('../data/friendsCache');

class Bot {

    /** @param {Object} app
     * @param {Settings} settings
     * @param {DBHelper} db
     * @param {Scheduler} scheduler
     * @constructor */
    constructor(app, settings, db, scheduler) {

        this.app = app;
        /** @type {Settings|Object} **/
        this.settings = settings;
        /** @type {DBHelper|Object} **/
        this.db = db;
        /** @type {Scheduler|Object} **/
        this.scheduler = scheduler;

        this.initialize();
    }

    initialize() {
        this.app.get('/pongfevercup', (req, res) => {
            console.log('REQUEST: /pongfevercup');
            res.status(200).send('YO!!!');
        });
        this.app.post(Bot.ROUTES.WEBHOOK, (req, res) => {
            /** @typedef {Object} FBMessageBody
             * @property {Object} object
             * @property {Object} entry
             * @property {Array<Object>} entry.messaging
             * @property {Object} entry.messaging.game_play.
             * @property {String} entry.messaging.game_play.context_type
             * @property {String} entry.messaging.game_play.context_id
             * @property {String} entry.messaging.game_play.player_id
             * @property {String} entry.messaging.game_play.payload
             * @property {Object} entry.messaging.sender
             * @property {String} entry.messaging.sender.id */
            let body = req.body;
            console.log('____________________');
            console.log('--== SOME EVENT ==--');
            if (body.object === 'page') {
                if(body.entry){
                    body.entry.forEach((entry) => {
                        if(entry.messaging){
                            entry.messaging.forEach((event) => {
                                if (event.game_play) {
                                    this.handleGamePlayEvent(event);
                                }else if (event.message) {
                                    //console.log('  message: ' + event.message);
                                    this.handleMessage(event.sender.id, event.message);
                                }
                            });
                        }else if(entry.changes){
                            entry.changes.forEach((change) => {
                                console.log('change', change);
                            });
                        }

                    });
                }
                res.status(200).send('EVENT_RECEIVED');
            } else {
                res.sendStatus(404);
            }
        });

        this.app.get(Bot.ROUTES.WEBHOOK, (req, res) => {
            console.log('VERIFY REQUEST');
            let mode = req.query['hub.mode'];
            let token = req.query['hub.verify_token'];
            let challenge = req.query['hub.challenge'];
            if (mode && token) {
                if (mode === 'subscribe' && token === this.settings.VERIFY_TOKEN) {
                    res.status(200).send(challenge);

                } else {
                    res.sendStatus(403);
                }
            }else{
                res.sendStatus(403);
            }
        });

        if(this.settings.IS_DEV_MODE){

            // MOCK REQUEST
            //console.log(Bot.ROUTES.MOCK_TEST_GAMEPLAY);
            this.app.get(Bot.ROUTES.MOCK_TEST_GAMEPLAY, (req, res) => {
                // console.log(mockDataHelper.PLAYERS.ARTEM.playerId.toString());
                friendsCache.add(mockDataHelper.PLAYERS.ARTEM.playerId, [mockDataHelper.PLAYERS.SERGEY.playerId]);
                const mockEvent = mockDataHelper.gamePlayEvents.getArtemPlayerData(GamePayload.TYPES.STANDARD_PLAYER_INFORMATION, true);
                this.handleGamePlayEvent(mockEvent);
                // console.log(mockEvent);
                res.sendStatus(200)
            });
        }
    }

    handleGamePlayEvent(event) {
        let sessionWasReset = false;
        let isItNewPlayer = false;
        let playerDBData = null;

        const senderId = event.sender.id; // Messenger sender id
        const playerId = event.game_play.player_id; // Instant Games player id

        let playerFriendsIDs = friendsCache.get(playerId);
        friendsCache.remove(playerId);

        // const contextId = event.game_play.context_id;
        // const contextType = event.game_play.context_type;

        /** @type {GamePayload|null} */
        //console.log(event.game_play.payload);
        const payload = event.game_play.payload ? (new GamePayload(event.game_play.payload)) : null;
        const playerDataForInsert = {
            FBPlayerID: playerId,
            FBSenderID: senderId,
            FBName: payload?payload.n:'',
            FBCurrentLocale: payload?payload.l:'',
            FBPhotoURL: payload?payload.p:'',
            FBBestScore: payload?payload.bs:0
        };

        consoleLogger.logGamePlayEvent(playerId, senderId);

        this.db.getPlayers("WHERE FBPlayerID='" + playerId + "'").then((playersArr) => {
            if (playersArr && playersArr.length > 0) {
                this.db.connectAndQuery('UPDATE mt_players SET ' +
                    '   LastPlayDateTime = NOW(), ' +
                    '   FBSenderID = ?, ' +
                    '   AvailableMessagesCount = ? ' +
                    'WHERE FBPlayerID = ?;',
                    [
                        senderId,
                        5,
                        playerId
                    ])
                    .then(()=>{

                    })
                    .catch((reason)=>{
                        console.log('Can not update player data (GamePlayEvent)', reason);
                    });
            }
        });

        if(!payload || !payload.t) {
            //return; !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Убрать отправку!!
            //this.callSendAPI(senderId, messagesGenerator.prepareThanksForPlaying2());
            console.log("!payload");
            return;
        }

        if(payload.t === 'T_F_P_1'){
            if(payload.opp && payload.opp.length > 0){ // SEND THANKS FOR PLAYING - LIST
                this.callSendAPI(senderId, messagesGenerator.prepareThanksForPlayingList1(payload))
            } else {
                this.callSendAPI(senderId, messagesGenerator.prepareThanksForPlaying1());
            }
        }else if(payload.t === 'T_F_P_2'){
            if(payload.opp && payload.opp.length > 0){ // SEND THANKS FOR PLAYING - LIST
                this.callSendAPI(senderId, messagesGenerator.prepareThanksForPlayingList2(payload))
            } else {
                this.callSendAPI(senderId, messagesGenerator.prepareThanksForPlaying2());
            }
        }
        return;

        this.db.getPlayers("WHERE FBPlayerID='" + playerId + "'").then((playersArr) => {
            if (playersArr && playersArr.length > 0) {
                return new Promise((resolve, reject) => {
                    /** @type {Array<DBPlayer>} */
                    let currentPlayersArr = [];
                    sessionWasReset = true;
                    let sessionDays = 0;
                    let sessionStart = new Date();
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
            } else {
                isItNewPlayer = true;
                return new Promise((resolve, reject) => {
                    let currentPlayersArr = [];
                    this.db.addPlayer(playerDataForInsert).then((players) => {
                        currentPlayersArr = players;
                        return this.db.addSession(playerDataForInsert.FBPlayerID);
                    }).then(() => {
                        currentPlayersArr[0].DaysCount = 0;
                        currentPlayersArr[0].SessionStartDateTime = currentPlayersArr[0].CreationDateTime;

                        resolve(currentPlayersArr);
                    }).catch(reject);
                });
            }
        }).then((players) => {
            console.log('    New: ', isItNewPlayer, ' | Pay: ', payload !== null && payload !== undefined, ' | Name: ', payload ? payload.n : '');
            playerDBData = players[0];
            if (payload) {
                if (isItNewPlayer) {
                    this.scheduler.add(new SchedulerTask({
                            time: new Date(Date.now() + 2 * Scheduler.TIME_CONSTANTS.HOUR),
                            template: SchedulerTask.TEMPLATES.EYE_BALL,
                            templateData: null,
                            playerID: playerId,
                            senderID: senderId
                        })
                    );
                    // !!! DONE Ежедневный подарок - Добалять задачу Ежедневного подарка
                    this.scheduler.add(new SchedulerTask({
                            time: new Date(Date.now() + Scheduler.TIME_CONSTANTS.DAY),
                            template: SchedulerTask.TEMPLATES.DAILY_GIFT,
                            templateData: null,
                            playerID: playerId,
                            senderID: senderId
                        })
                    );
                }
                // не куплен шар и если нет ни одной задачи на фаербол
                // !!! DONE D3 - Не делаем задачи если есть тикет на фаер бол в инвентаре
                this.db.getInventoryItems(playerId, API.SHOP_OBJECT_CATEGORIES.BALL, API.OBJECTS_GUIDS.BALL.FIRE, API.SHOP_OBJECT_CATEGORIES.TICKET, API.OBJECTS_GUIDS.TICKET.BALL_FIRE)
                    .then((items) => {
                        if (!items || !items[0]) {
                            this.scheduler.getAll(playerId).then((tasks) => {
                                if (!tasks) {
                                    tasks = [];
                                }
                                let hasTask = false;
                                tasks.forEach((element) => {
                                    if (element.Template === SchedulerTask.TEMPLATES.FIRE_BALL_D1
                                        || element.Template === SchedulerTask.TEMPLATES.FIRE_BALL_D2
                                        || element.Template === SchedulerTask.TEMPLATES.FIRE_BALL_D3) {
                                        hasTask = true;
                                    }
                                });
                                if (!hasTask) {
                                    // добавляем задачу
                                    let taskTemplate = SchedulerTask.TEMPLATES.FIRE_BALL_D1;
                                    if (playerDBData.DaysCount === 1) {
                                        taskTemplate = SchedulerTask.TEMPLATES.FIRE_BALL_D2;
                                    } else if (playerDBData.DaysCount === 2) {
                                        taskTemplate = SchedulerTask.TEMPLATES.FIRE_BALL_D3;
                                    }
                                    this.scheduler.add(new SchedulerTask({
                                            time: new Date(playerDBData.SessionStartDateTime.getTime() + (playerDBData.DaysCount + 1) * Scheduler.TIME_CONSTANTS.DAY),
                                            template: taskTemplate,
                                            templateData: null,
                                            playerID: playerId,
                                            senderID: senderId
                                        })
                                    );
                                }
                            });
                        }
                    });

                if (isItNewPlayer && playerFriendsIDs && playerFriendsIDs.length > 0 && playerDBData) {
                    this.db.getPlayers("WHERE FBPlayerID IN (" + playerFriendsIDs.join() + ")").then((players) => {
                        for (let i = 0; i < players.length; i++) {
                            const cPlayer = players[i];
                            if (cPlayer.FBPlayerID !== playerId) {
                                this.callSendAPI(cPlayer.FBSenderID, messagesGenerator.prepareMessagesToFriends(payload.n, payload.p, playerId));
                            }
                        }
                    });
                }

            }
        }).catch( (reason) => {

        });
    }

    handleMessage(sender_id, received_message) {
        if (received_message.text && received_message.text.toLowerCase() === "hi") {
            this.callSendAPI(sender_id, { "text": `Hello!` });
        }
        else if (received_message.text && received_message.text.toLowerCase() === "play") {
            this.callSendAPI(sender_id, messagesGenerator.prepareThanksBtn());
        }
    }

    callSendAPI(sender_id, response) {
        if(this.settings.IS_DEV_MODE){
            return new Promise(()=>{
                //console.log(response);
            });
        }else{
            return API.SendMessageToPlayer(sender_id, response, this.settings.PAGE_ACCESS_TOKEN);
        }

    }
};

Bot.ROUTES = {
    WEBHOOK: '/pongfevercup/webhook',
    MOCK_TEST_GAMEPLAY: '/mock/TestGamePlay'
};

exports.Bot = Bot;