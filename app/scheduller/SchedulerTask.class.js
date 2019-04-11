
/** @class */
class SchedulerTask {

    /** @param {SchedulerTask|Object} data */
    constructor(data) {
        /** @type {Date} */
        this.time = data.time;
        /** @type {Date} */
        this.creationDate = data.creationDate?data.creationDate:null;
        /** @type {String}
         * @link SchedulerTask.TEMPLATES*/
        this.template = data.template?data.template:'';
        /** @type {Object|null} */
        this.templateData = data.templateData?data.templateData:null;
        /** @type {String} */
        this.playerID = data.playerID?data.playerID:'';
        /** @type {String} */
        this.senderID = data.senderID?data.senderID :'';
        /** @type {Number} */
        this.taskID = data.taskID?data.taskID:'';
    }

    /** @param {DBScheduleTask} DBTask */
    static CreateFromDBObject(DBTask) {
        let templateData = null;
        if(DBTask.TemplateData){
            try{
                templateData = JSON.parse(DBTask.TemplateData)
            }catch (e) { }
        }
        return new SchedulerTask({
            taskID: DBTask.TaskID,
            playerID: DBTask.FBPlayerID,
            senderID: DBTask.FBSenderID,
            time: DBTask.DateTime,
            template: DBTask.Template,
            templateData: templateData,
            creationDate: DBTask.CreationDateTime
        });
    }
}

SchedulerTask.TEMPLATES = {
    EYE_BALL: 'EYE_BALL',
    FIRE_BALL_D1: 'FIRE_BALL_D1',
    FIRE_BALL_D2: 'FIRE_BALL_D2',
    FIRE_BALL_D3: 'FIRE_BALL_D3',
    DAILY_GIFT: 'DAILY_GIFT',
    D1: 'D1',
};

exports.SchedulerTask = SchedulerTask;