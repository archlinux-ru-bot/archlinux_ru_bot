let Captcha = require('node-captcha-generator');
let {getName} = require('../../util');

let ActiveCaptcha = [];
let pluginUtils = {};

async function delCurrentCaptcha(bot, currentCaptcha) {
	for(let itemCaptcha of currentCaptcha) {
		try {
			await bot.deleteMessage(itemCaptcha.chat_id, itemCaptcha.my_message_id);
		} catch(e) {
			if(e.message !== 'Bad Request: message to delete not found') {
				throw e;
			}
		}

		clearTimeout(itemCaptcha.timeout);
		ActiveCaptcha.splice(ActiveCaptcha.indexOf(itemCaptcha), 1);

		try {
			pluginUtils.delMonopolyAccess(itemCaptcha.chat_id, itemCaptcha.user_id);
		} catch(e) {
			if(e.message !== 'Messages of this user is not in monopoly access' &&
			e.message !== 'Messages of this user is not in monopoly access by this plugin') {
				throw e;
			}
		}
	}
}

function сaptchaToBase64(captchaObj) {
	return new Promise((resolve, reject) => {
		captchaObj.toBase64((err, base64) => {
			if(err) {
				reject(err);
			}

			resolve(base64.replace(/^data:image\/png;base64,/, ''));
		});
	});
}

async function init(utils) {
	pluginUtils = utils;
}

async function onNewMessage(bot, msg) {
	let currentCaptcha = [];
	let allCurrentCaptcha = ActiveCaptcha.filter(item =>
		item.chat_id === msg.chat.id && item.user_id === msg.from.id);

	if(typeof msg.reply_to_message !== 'undefined') {
		currentCaptcha = ActiveCaptcha.filter(item =>
			item.chat_id === msg.chat.id && item.my_message_id === msg.reply_to_message.message_id &&
			item.user_id === msg.from.id);
	} else {
		currentCaptcha = allCurrentCaptcha;
	}

	if(typeof msg.new_chat_members !== 'undefined') {
		for(let newUser of msg.new_chat_members) {
			let allCurrentCaptcha = ActiveCaptcha.filter(item =>
				item.chat_id === msg.chat.id && item.user_id === newUser.id);

			let captchaObj = new Captcha({
				length: 6,
				size:{
					width: 450,
					height: 200
				}
			});

			let captchaCode = Number(captchaObj.value);
			let captchaBase64 = await сaptchaToBase64(captchaObj);
			let captchaImage = Buffer.from(captchaBase64, 'base64');

			let captchaMessage = await bot.sendPhoto(msg.chat.id, {
				source: captchaImage
			}, {
				caption:
`Напиши в ответ на это сообщение код и я тебя пропущу. Иначе - кикну через минуту.
Код состоит из 6 цифр, на мобильном может обрезаться - тогда надо развернуть изображение во весь экран.
Повторный заход возможен через минуту.`,
				reply_to_message_id: msg.message_id
			});

			await delCurrentCaptcha(bot, allCurrentCaptcha);

			let timeoutObject = setTimeout(async () => {
				try {
					let allCurrentCaptcha = ActiveCaptcha.filter(item =>
						item.chat_id === msg.chat.id && item.user_id === newUser.id);

					await delCurrentCaptcha(bot, allCurrentCaptcha);

					try {
						await bot.kickChatMember(msg.chat.id, newUser.id, Math.round(Date.now() / 1000) + 60);
					} catch(e) {
						if(e.description === 'Bad Request: not enough rights to restrict/unrestrict chat member') {
							await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> нет прав на бан', {
								parse_mode: 'HTML',
								reply_to_message_id: msg.message_id
							});
						} else {
							throw e;
						}
					}

					try {
						await bot.deleteMessage(msg.chat.id, msg.message_id);
					} catch(e) {
						if(e.description === 'Bad Request: message can\'t be deleted') {
							await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> нет прав на удаление сообщений', {
								parse_mode: 'HTML',
								reply_to_message_id: msg.message_id
							});
						} else {
							throw e;
						}
					}
				} catch(e) {
					pluginUtils.log(e);
				}
			}, 60000);

			ActiveCaptcha.push({
				message_id: msg.message_id,
				chat_id: msg.chat.id,
				user_id: newUser.id,
				my_message_id: captchaMessage.message_id,
				code: captchaCode,
				timeout: timeoutObject
			});

			await pluginUtils.addMonopolyAccess(msg.chat.id, newUser.id, true);
		}
	} else if(allCurrentCaptcha.length > 0) {
		if(currentCaptcha.length > 0 && typeof msg.text !== 'undefined' && currentCaptcha[currentCaptcha.length - 1].code === Number(msg.text)) {
			await delCurrentCaptcha(bot, allCurrentCaptcha);

			let successMessage = await bot.sendMessage(msg.chat.id, `<b>${getName(msg)}</b> успешно прошел капчу!`, {
				parse_mode: 'HTML'
			});

			try {
				await bot.deleteMessage(msg.chat.id, msg.message_id);
			} catch(e) {
				if(e.description === 'Bad Request: message can\'t be deleted') {
					return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> нет прав на удаление сообщений', {
						parse_mode: 'HTML',
						reply_to_message_id: msg.message_id
					});
				} else {
					throw e;
				}
			}

			return successMessage;
		} else {
			try {
				return await bot.deleteMessage(msg.chat.id, msg.message_id);
			} catch(e) {
				if(e.description === 'Bad Request: message can\'t be deleted') {
					return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> нет прав на удаление сообщений', {
						parse_mode: 'HTML',
						reply_to_message_id: msg.message_id
					});
				} else {
					throw e;
				}
			}
		}
	}
}

module.exports = {
	init,
	onNewMessage
};
