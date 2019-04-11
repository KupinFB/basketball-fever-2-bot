const friendsData = {};


module.exports = {

    /** @public
     * @param {string} playerId
     * @param {Array<string>} friendsArr */
    add: (playerId, friendsArr) => {
        friendsData[playerId] = friendsArr;
    },

    /** @public
     * @param {string} playerId */
    remove: (playerId) => {
        friendsData[playerId] = null;
        delete friendsData[playerId]; // Remove object prop
    },

    /** @public
     * @param {string} playerId
     * @returns {Array<string>}*/
    get: (playerId) => {
        if(friendsData.hasOwnProperty(playerId) && friendsData[playerId]){
            return friendsData[playerId]
        }else{
            return [];
        }
    },
};