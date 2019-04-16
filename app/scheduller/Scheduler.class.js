/** @class */
class Scheduler {

    /** @param {DBHelper} db
     * @param {Settings} settings */
    constructor(db, settings) {
        this.db = db;
        this.settings = settings;
    }

    start() {
        setInterval(()=>{
            try{
                this.applyTasks();
            }catch (e) {
                console.log('CATCH: Scheduler timer crash');
            }
        }, Scheduler.TIME_CONSTANTS.MINUTE)
    }

    /** @param {SchedulerTask} task
     * @return {Promise}*/
    add(task){
        return this.db.addSchedulerTask(task);
    }

    /** Returns a list of all tasks of player
     * @param FBPlayerID
     * @returns {Promise<Array<DBScheduleTask>>} */
    getAll(FBPlayerID){
        return this.db.getSchedulerTasksOfPlayer(FBPlayerID);
    }

    /**
     *
     * @param FBPlayerID
     * @param template
     * @return {Promise}
     */
    removeTaskByTemplate(FBPlayerID, template){
        return this.db.removeSchedulerTaskByTemplate(FBPlayerID, template);
    }

    applyTasks() {
        const API = require('./../api/API.class').API;
        const SchedulerTask = require('./../scheduller/SchedulerTask.class').SchedulerTask;

        this.db.getActualSchedulerTasks()
            .then((dbTasks) => {
                const tasksArr = dbTasks.map((element) => {
                    return SchedulerTask.CreateFromDBObject(element);
                });

                tasksArr.forEach((curTask) => {
                    const messageData = Scheduler.GetMessageDataForTask(curTask);
                    this.db.getPlayers("WHERE FBPlayerID='" + curTask.playerID + "'").then((playersArr) => {
                            const playerData = playersArr[0];
                            return this.callSendAPI(playerData.FBSenderID, messageData)
                        })
                        .then(() => { // The message was sent
                            return this.db.removeSchedulerTask(curTask.taskID);
                        })
                        .then(() => {

                            // !!! DONE D3 - Добалять тикет в инвентарь
                            // // !!! DONE Ежедневный подарок - Добалять задачу Ежедневного подарка
                            if (curTask.template === SchedulerTask.TEMPLATES.DAILY_GIFT) {
                                this.db.addSchedulerTask(new SchedulerTask({
                                        time: new Date(Date.now() + Scheduler.TIME_CONSTANTS.DAY),
                                        template: SchedulerTask.TEMPLATES.DAILY_GIFT,
                                        templateData: null,
                                        playerID: curTask.playerID,
                                        senderID: curTask.senderID
                                    })
                                ).then(() => {
                                });
                            }
                            if (curTask.template === SchedulerTask.TEMPLATES.FIRE_BALL_D3) {
                                this.db.addInventoryItem(curTask.playerID, API.SHOP_OBJECT_CATEGORIES.TICKET, API.OBJECTS_GUIDS.TICKET.BALL_FIRE, 1).then(() => {
                                });
                            }
                        })
                    /*if(curTask.template === SchedulerTask.TEMPLATES.FIRE_BALL_D1 || curTask.template === SchedulerTask.TEMPLATES.FIRE_BALL_D2){
                        this.db.getPlayers(" WHERE FBPlayerID='"+curTask.playerID+"'")
                            .then((players)=>{
                                const playerDBData = players[0];
                                if(playerDBData){

                                }
                            })
                    }*/
                    //})
                });
            })
            .catch(() => {

            })
    }

    /** @param {SchedulerTask} task */
    static GetMessageDataForTask(task){
        const SchedulerTask = require('./../scheduller/SchedulerTask.class').SchedulerTask;
        const messagesGenerator = require('../helpers/messagesGenerator');


        let resObject = null;
        switch (task.template){
            case SchedulerTask.TEMPLATES.EYE_BALL: {
                resObject = messagesGenerator.prepareMessageForEyeBallPresent();
                break;
            }
            case SchedulerTask.TEMPLATES.FIRE_BALL_D1: {
                resObject = messagesGenerator.prepareMessageForFireBallPresentD1();
                break;
            }
            case SchedulerTask.TEMPLATES.FIRE_BALL_D2: {
                resObject = messagesGenerator.prepareMessageForFireBallPresentD2();
                break;
            }
            case SchedulerTask.TEMPLATES.FIRE_BALL_D3: {
                resObject = messagesGenerator.prepareMessageForFireBallPresentD3();
                break;
            }
            case SchedulerTask.TEMPLATES.DAILY_GIFT:{
                resObject = messagesGenerator.prepareMessageForDailyGift();
                break;
            }
            case SchedulerTask.TEMPLATES.D1:{
                resObject = messagesGenerator.prepareMessageForD1();
                break;
            }
            default: { }
        }
        return resObject;
    }

    callSendAPI(sender_id, response) {
        const API = require('./../api/API.class').API;
        if(this.settings.IS_DEV_MODE){
            return new Promise((resolve)=>{
                resolve();
                console.log(response);
            });
        }else{
            return API.SendMessageToPlayer(sender_id, response, this.settings.PAGE_ACCESS_TOKEN);
        }
    }
}


Scheduler.TIME_CONSTANTS = {
    SECOND: 1000,
    MINUTE: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24,
};


exports.Scheduler = Scheduler;