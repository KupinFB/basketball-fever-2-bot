
const PLAYERS = {
    SERGEY: {
        playerId: '3062011580499841',
        name: 'Sergey',
        photo: 'https://platform-lookaside.fbsbx.com/platform/instantgames/profile_pic.jpg?igpid=2062011580499841&height=256&width=256&ext=1543059052&hash=AeQkoJ0_KUJCAI3M'
        //senderID: ''
    },
    ARTEM: {
        playerId: '0000000000000001',
        name: 'TEst',
        photo: 'https://platform-lookaside.fbsbx.com/platform/instantgames/profile_pic.jpg?igpid=2360360283980017&height=256&width=256&ext=1543083433&hash=AeSCXLBz3giXHNcR',
        senderId: '1943011815787265',
        locale: 'eng-eng'
    }
};

module.exports = {
    PLAYERS: PLAYERS,
    gamePlayEvents: {
        getArtemPlayerData: (payloadType, includeOpponents) => {
            const opp = [];
            if(includeOpponents){
                opp.push({
                    id: PLAYERS.SERGEY.playerId,
                    n: PLAYERS.SERGEY.name,
                    p: PLAYERS.SERGEY.photo
                });
            }
            const mockPayload = {
                opp: opp,
                t: payloadType,
                n:PLAYERS.ARTEM.name,
                p: PLAYERS.ARTEM.photo,
                l: PLAYERS.ARTEM.locale
            };
            return {
                sender: {
                    id:PLAYERS.ARTEM.senderId
                },
                game_play: {
                    player_id: PLAYERS.ARTEM.playerId,
                    payload: JSON.stringify(mockPayload)
                }
            };
        }
    }
};