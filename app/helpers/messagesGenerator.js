const mathHelper = require('./mathHelper');

module.exports = {
    prepareThanksForPlaying1: ()=>{
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '🔥🏀  Welcome to BasketBall Fever!  🏀🔥',
                        subtitle: 'I’m a messenger bot that will keep track of your progress and help you if you get stuck. \n' +
                        'Come back every day to unlock new balls and locations!',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Now",
                                "payload": JSON.stringify({from: 'thanks_for_playing_solo_button'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    /** @param {GamePayload} payload */
    prepareThanksForPlayingList1: (payload) => {
        let data = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "list",
                    elements: [
                        {
                            title: '🔥🏀Welcome to BasketBall Fever!  🏀🔥',
                            subtitle: 'I’m a messenger bot that will keep track of your progress and help you if you get stuck. \n' +
                            'Come back every day to unlock new balls and locations!',
                            image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing"
                        }
                    ]
                }
            }
        };
        for(let i=0; i<payload.opp.length; i++){
            let opponent = payload.opp[i];
            data.attachment.payload.elements.push({
                title: opponent.n,
                subtitle: "Tap Challenge to beat "+opponent.n+"!👇",
                image_url: opponent.p,
                buttons: [
                    {
                        type: "game_play",
                        title: "Challenge",
                        payload: JSON.stringify({from: 'thanks_for_playing_challenge_friend_button'}),
                        game_metadata: {
                            player_id: opponent.id
                        }
                    }
                ]
            });
        }
        return data;
    },
    prepareThanksForPlaying2: ()=>{
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '🔥🏀Thanks for playing Basketball Fever! 🏀🔥',
                        subtitle: '✨Come back tomorrow for free coins ✨',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'thanks_for_playing_solo_button'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    /** @param {GamePayload} payload */
    prepareThanksForPlayingList2: (payload) => {
        let data = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "list",
                    elements: [
                        {
                            title: '🏀Thanks for playing Basketball Fever! 🏀🔥',
                            subtitle: '✨Come back tomorrow for free coins ✨',
                            image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing"
                        }
                    ]
                }
            }
        };
        for(let i=0; i<payload.opp.length; i++){
            let opponent = payload.opp[i];
            data.attachment.payload.elements.push({
                title: opponent.n,
                subtitle: "Tap Challenge to beat "+opponent.n+"!👇",
                image_url: opponent.p,
                buttons: [
                    {
                        type: "game_play",
                        title: "Challenge",
                        payload: JSON.stringify({from: 'thanks_for_playing_challenge_friend_button'}),
                        game_metadata: {
                            player_id: opponent.id
                        }
                    }
                ]
            });
        }
        return data;
    },
    prepareThanksBtn: () => {
        return {
            "attachment": {
            "type": "template",
                "payload": {
                "template_type": "generic",
                    "elements": [{
                    "title": "So, let's do it!",
                    "buttons": [
                        {
                            "type": "game_play",
                            "title": "Play Basketball Fever",
                            "payload": "{}"
                        }
                    ],
                }]
            }
        }
        }
    },

    /** @param {String} name
     * @param {String} photoURL
     * @param {String} id */
    prepareMessagesToFriends: (name, photoURL, id) => {
        let title = '';
        let subtitle = '';
        let guid = '';
        if(mathHelper.randomInteger(0, 99)<50){
            title = "Join your friends playing Basketball Fever!";
            guid = 'message_your_friend_start_playing_1';
        }else{
            title = "Your friend's are playing 🏀🔥 join them now! 😊";
            guid = 'message_your_friend_start_playing_2';
        }
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": title,
                        "subtitle": "Press play to challenge "+name+"!",
                        "image_url": photoURL,
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play",
                                "payload": JSON.stringify({from: guid}),
                                "game_metadata": {
                                    "player_id": id
                                }
                            }
                        ],
                    }]
                }
            }
        };
    },
    /** @param {String} name
     * @param {String} photoURL
     * @param {String} id */
    prepareMessagesToFriendsNewPlayer: (name, photoURL, id) => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "🔥🏀"+name+" has joined the game!🏀🔥",
                        "subtitle": "Press play to challenge "+name+"!",
                        "image_url": photoURL,
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play",
                                "payload": JSON.stringify({from: 'message_your_friend_start_playing_3'}),
                                "game_metadata": {
                                    "player_id": id
                                }
                            }
                        ],
                    }]
                }
            }
        };
    },

    prepareMessageForEyeBallPresent: () => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '👀Today\'s special... Unlock the EYE BALL👀',
                        subtitle: '🍻Free PLAY NOW to unlock 🍻',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'eye_ball_present'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    prepareMessageForFireBallPresentD1: () => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '🔥Don\'t break the streak!🔥',
                        subtitle: '🔥Play three days in a row to unlock the FIRE BALL🔥',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'fire_ball_present_d1'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    prepareMessageForFireBallPresentD2: () => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '🔥Don\'t break the streak!🔥',
                        subtitle: '🔥Play two more days in a row to unlock the FIRE BALL🔥',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'fire_ball_present_d2'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    prepareMessageForFireBallPresentD3: () => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: '🔥Don\'t break the streak!🔥',
                        subtitle: '🔥Play now to unlock the FIRE BALL🔥',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'fire_ball_present_d3'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    prepareMessageForDailyGift: () => {
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: 'Claim your coins...',
                        subtitle: 'Play now to receive your daily bonus',
                        image_url: "https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing",
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": "Play Pong Fever",
                                "payload": JSON.stringify({from: 'daily_gift_coins'}),
                            }
                        ],
                    }]
                }
            }
        };
    },
    prepareMessageForD1: () => {
        const arr = [
            {
                title: 'Time for a 🏀break?',
                subtitle: '',
                buttonText: 'Play Now',
                guid: 'D1_1',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing'
            },
            {
                title: '🏀+ 🔥= 😃',
                subtitle: '',
                buttonText: 'Play Now!',
                guid: 'D1_2',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing'
            },
            {
                title: 'Claim your coins... Play now to receive your daily bonus',
                subtitle: '',
                buttonText: 'Claim Reward',
                guid: 'D1_3',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/gift_coins'
            },
            {
                title: '🤑🏀Daily Reward is available! 🤑🏀 ',
                subtitle: '',
                buttonText: 'Collect Now',
                guid: 'D1_4',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/gift_coins'
            },
            {
                title: 'Play 1on1 in cities all over the world',
                subtitle: '',
                buttonText: "Let's Go",
                guid: 'D1_5',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing'
            },
            {
                title: 'Come back every day to unlock new balls and locations',
                subtitle: '',
                buttonText: 'Start Duel',
                guid: 'D1_6',
                image: 'https://web-hooks.tk/pongfevercup/api/v1/static/images/thanks_for_playing'
            },
        ];
        const messageData = arr[mathHelper.randomInteger(0, arr.length-1)];
        return {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        title: messageData.title,
                        subtitle: messageData.subtitle,
                        image_url: messageData.image,
                        "buttons": [
                            {
                                "type": "game_play",
                                "title": messageData.buttonText,
                                "payload": JSON.stringify({from: messageData.guid}),
                            }
                            ,{
                                "type":"web_url",
                                "url":"https://www.facebook.com/basketballfever2/",
                                "title":"Funpage",
                                "webview_height_ratio": "full"
                            }
                        ],
                    }]
                }
            }
        };
    }
};