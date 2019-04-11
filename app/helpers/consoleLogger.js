module.exports = {
    logGamePlayEvent: (playerId, senderId)=>{
        const dt = new Date();
        console.log('----==== GAME_PLAY EVENT ====----    ( ', dt.getUTCHours() +" : "+ dt.getUTCMinutes() + " : " + dt.getUTCSeconds()+" )");
        console.log('    Player ID: ', playerId, ' | Sender ID: ', senderId);
    }
};