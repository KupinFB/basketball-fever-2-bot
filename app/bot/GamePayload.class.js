class GamePayload {

    /** @param {String} payloadString */
    constructor(payloadString) {

        /** List of opponents. 3 friends for challenge.
         * @typedef {Array<Object>} GamePayloadFriend
         * @property {String} n - Opponent name
         * @property {String} p - Opponent photo URL
         * @property {String} id - Opponent ID */
        this.opp = []; //

        /** Player name
         * @type {string} */
        this.n = '';

        /** Player photo url
         * @type {string} */
        this.p = '';

        /** Player locale
         * @type {string} */
        this.l = '';

        /** Player best score in the current session
         * @type {Number} */
        this.bs = 0;

        /** Type of Payload
         * @see GamePayload.TYPES
         * @type {string} */
        this.t = '';

        this.assignPayloadStr(payloadString);
    }

    /** Parses a payload string and assign this object to the instance of GamePayload Class
     * @param {String} payloadString */
    assignPayloadStr(payloadString){
        if(payloadString){
            try{
                Object.assign(this, JSON.parse(payloadString));
            }catch (ex){ }
        }
    }

}

/** List of GamePlayload types */
GamePayload.TYPES = {
    STANDARD_PLAYER_INFORMATION: 'S_P_I',
    THANKS_FOR_PLAYING_1: 'T_F_P_1',
    THANKS_FOR_PLAYING_2: 'T_F_P_2'
};

exports.GamePayload = GamePayload;