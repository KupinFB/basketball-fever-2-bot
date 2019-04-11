
var  canwe = require('../canWeSendTheMessage');

  var message = {  id : 0,
			player_id : "Buba Kastorskiy", 
			context_id: " zuu buu", 
			type : " thi thi type", 
			direction : " nach ost",
//			datetime : Date.now()
		}; 

canwe.canWeSendTheMessage(message, function(result){
	//console.log(result);
});

return;

