let {getName} = require('./util');
let {doVzhuh, getCat} = require('./conversation_tools');

async function sendWithMe(bot, msg) {
	if(new RegExp(`^/me(?:@${bot.me.username})?$`).test(msg.text)) {
		await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> нет текста сообщения', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
		return;
	}

	await bot.sendMessage(msg.chat.id, `<b>* ${
		getName(msg)
	}</b> ${
		msg.text.replace(new RegExp(`^/me(?:@${
			bot.me.username
		})? `), '')
	}`, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function sendVzhuh(bot, msg) {
	await bot.sendMessage(msg.chat.id, doVzhuh(msg.text.replace(new RegExp(`^/vzhuh@${
		bot.me.username
	} `), '')), {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function sendCat(bot, msg) {
	try {
		let file = await getCat();

		bot.sendAnimation(msg.chat.id, {
			source: file
		}, {
			reply_to_message_id: msg.message_id
		});
	} catch(e) {
		await bot.sendMessage(msg.chat.id,
			`Котики не идут:
<code>${e}</code>`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}
}

module.exports = {
	sendWithMe,
	sendVzhuh,
	sendCat
};