let {getArgs, getName, getMessageText} = require('./util');

let {isProfileExists, isAchivkaExists, isAchivkaRelExists,
	isUsernameExists, isAliasExists, isAliasRelExists,
	getProfile, getAchivkas, getAliases,
	addProfile, addAchivka, addAchivkaRel,
	addUsername, addAlias, addAliasRel,
	delAchivka, delAchivkaRel, delUsername,
	delAlias, delAliasRel,
	verifyBalls} = require('./profile_tools');

let config = require('./config');

async function payRespect(knex, bot, msg, num) {
	let ballError = verifyBalls(msg, num);

	if(ballError) {
		return await bot.sendMessage(msg.chat.id, ballError, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if(num < 0) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> отбирать честь нельзя, это не конфетка младенца', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	let profileRow1 = await getProfile(knex, msg.from.id);
	let profileRow2 = await getProfile(knex, msg.reply_to_message.from.id);

	await knex('profiles').where('userid', msg.from.id)
		.update('respects', Number(profileRow1.respects) - num);
	await knex('profiles').where('userid', msg.reply_to_message.from.id)
		.update('respects', Number(profileRow2.respects) + num);

	return await bot.sendMessage(msg.chat.id, `<b>${
		getName(msg)
	}</b> отдал <b>${num}</b> чести <b>${
		getName(msg.reply_to_message)
	}</b>`, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function voteBan(knex, bot, msg, num) {
	let ballError = verifyBalls(msg, num, true);

	if(ballError) {
		return await bot.sendMessage(msg.chat.id, ballError, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	let profileRow1 = await getProfile(knex, msg.from.id);
	let profileRow2 = await getProfile(knex, msg.reply_to_message.from.id);

	if(msg.from.id === msg.reply_to_message.from.id) {
		await knex('profiles').where('userid', msg.from.id)
			.update('suicides', Number(profileRow1.suicides) + num);
	} else {
		await knex('profiles').where('userid', msg.from.id)
			.update('ibans', Number(profileRow1.ibans) + num);
		await knex('profiles').where('userid', msg.reply_to_message.from.id)
			.update('bans', Number(profileRow2.bans) + num);
	}

	if(msg.from.id === msg.reply_to_message.from.id) {
		if(num < 0) {
			return await bot.sendMessage(msg.chat.id, `<b>${
				getName(msg)
			}</b> воскрес <b>${-num}</b> раз`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		} else {
			return await bot.sendMessage(msg.chat.id, `<b>${
				getName(msg)
			}</b> совершил суицид <b>${num}</b> раз`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}
	} else {
		if(num < 0) {
			return await bot.sendMessage(msg.chat.id, `<b>${
				getName(msg)
			}</b> разбанил <b>${
				getName(msg.reply_to_message)
			}</b> <b>${-num}</b> раз`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		} else {
			return await bot.sendMessage(msg.chat.id, `<b>${
				getName(msg)
			}</b> забанил <b>${
				getName(msg.reply_to_message)
			}</b> <b>${num}</b> раз`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}
	}
}

async function voteEban(knex, bot, msg, num) {
	let ballError = verifyBalls(msg, num);

	if(ballError) {
		return await bot.sendMessage(msg.chat.id, ballError, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	let profileRow1 = await getProfile(knex, msg.from.id);
	let profileRow2 = await getProfile(knex, msg.reply_to_message.from.id);

	await knex('profiles').where('userid', msg.from.id)
		.update('iebans', Number(profileRow1.iebans) + num);
	await knex('profiles').where('userid', msg.reply_to_message.from.id)
		.update('ebans', Number(profileRow2.ebans) + num);

	if(num < 0) {
		return await bot.sendMessage(msg.chat.id, `Теперь <b>${
			getName(msg.reply_to_message)
		}</b> на <b>${-num}</b> eban меньше`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	} else {
		return await bot.sendMessage(msg.chat.id, `Теперь <b>${
			getName(msg.reply_to_message)
		}</b> на <b>${num}</b> eban больше`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

async function vRotEban(knex, bot, msg, num) {
	let ballError = verifyBalls(msg, num);

	if(ballError) {
		return await bot.sendMessage(msg.chat.id, ballError, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	let profileRow1 = await getProfile(knex, msg.from.id);
	let profileRow2 = await getProfile(knex, msg.reply_to_message.from.id);

	await knex('profiles').where('userid', msg.from.id)
		.update('irotebans', Number(profileRow1.irotebans) + num);
	await knex('profiles').where('userid', msg.reply_to_message.from.id)
		.update('rotebans', Number(profileRow2.rotebans) + num);

	return await bot.sendMessage(msg.chat.id, `<b>${
		getName(msg)
	}</b> сделал vroteban <b>${
		getName(msg.reply_to_message)
	}</b> <b>${num}</b> раз`, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function linkUser(knex, bot, msg, action) {
	let oldusername = '';
	let newusername = '';

	if(msg.reply_to_message) {
		if(msg.reply_to_message.from.username) {
			oldusername = '@' + msg.reply_to_message.from.username;
		}
		[newusername] = getArgs(msg.text, 1);
	} else {
		[oldusername, newusername] = getArgs(msg.text, 2);
	}

	oldusername = (oldusername || '').toLowerCase();
	newusername = (newusername || '').toLowerCase();

	if(action !== 'link' && action !== 'unlink') {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> действие должно быть link или unlink', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if((!oldusername || !newusername || oldusername.length <= 1 || newusername.length <= 1) &&
	(!msg.reply_to_message || (!newusername || newusername.length <= 1))) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> должно быть старое и новое имя пользователя, либо вы должны ответить тому, кого хотите залинковать', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if((!msg.reply_to_message && oldusername[0] !== '@') || newusername[0] !== '@') {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> имя пользователя должно начинаться с собаки', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if((!msg.reply_to_message && oldusername.length > 33) || newusername.length > 33) {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> имя пользователя больше 32 символа', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if(!msg.reply_to_message && !/^@\w+$/.test(oldusername)) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> старое имя пользователя может состоять только из латинских букв, цифр и знака подчёркивания', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(!/^@[A-Za-zА-Яа-яЁё0-9_]+$/.test(newusername)) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> новое имя пользователя может состоять только из латинских букв, кириллических букв, цифр и знака подчёркивания', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(action === 'link' && oldusername === newusername) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> старое и новое имя пользователя не могут быть одинаковыми', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(((msg.reply_to_message)
		? (msg.from.id === msg.reply_to_message.from.id)
		: (`@${msg.from.username}` === oldusername)) &&
	!config.admin_ids.includes(msg.from.id)) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> самому себе добавлять или удалять имя пользователя нельзя', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(action === 'link') {
		let aliasExists = false;

		if(msg.reply_to_message) {
			aliasExists = await isAliasRelExists(knex, msg.reply_to_message.from.id, newusername, 'userid');
		} else {
			aliasExists = await isAliasRelExists(knex, oldusername, newusername, 'username');
		}

		if(aliasExists) {
			return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> <b>${
				msg.reply_to_message ? getName(msg.reply_to_message) : oldusername.htmlspecialchars()
			}</b> уже известен как <b>${
				newusername.htmlspecialchars()
			}</b>`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}

		if(msg.reply_to_message) {
			if(!await isProfileExists(knex, msg.reply_to_message.from.id)) {
				await addProfile(knex, msg.reply_to_message.from.id);
			}

			if(!await isAliasExists(knex, newusername)) {
				await addAlias(knex, newusername);
			}

			await addAliasRel(knex, msg.reply_to_message.from.id, newusername, 'userid');
		} else {
			if(!await isUsernameExists(knex, oldusername)) {
				await addUsername(knex, oldusername);
			}

			if(!await isAliasExists(knex, newusername)) {
				await addAlias(knex, newusername);
			}

			await addAliasRel(knex, oldusername, newusername, 'username');
		}

		return await bot.sendMessage(msg.chat.id, `<b>${
			msg.reply_to_message ? getName(msg.reply_to_message) : oldusername.htmlspecialchars()
		}</b> теперь известен как <b>${
			newusername.htmlspecialchars()
		}</b>`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	} else if(action === 'unlink') {
		let aliasExists = false;

		if(msg.reply_to_message) {
			aliasExists = await isAliasRelExists(knex, msg.reply_to_message.from.id, newusername, 'userid');
		} else {
			aliasExists = await isAliasRelExists(knex, oldusername, newusername, 'username');
		}

		if(!aliasExists) {
			return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> <b>${
				msg.reply_to_message ? getName(msg.reply_to_message) : oldusername.htmlspecialchars()
			}</b> не известен как <b>${
				newusername.htmlspecialchars()
			}</b>`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}

		if(msg.reply_to_message) {
			await delAliasRel(knex, msg.reply_to_message.from.id, newusername, 'userid');

			if(!await isAliasRelExists(knex, undefined, newusername)) {
				await delAlias(knex, newusername);
			}
		} else {
			await delAliasRel(knex, oldusername, newusername, 'username');

			if(!await isAliasRelExists(knex, oldusername, undefined, 'username')) {
				await delUsername(knex, oldusername);
			}

			if(!await isAliasRelExists(knex, undefined, newusername)) {
				await delAlias(knex, newusername);
			}
		}

		return await bot.sendMessage(msg.chat.id, `<b>${
			msg.reply_to_message ? getName(msg.reply_to_message) : oldusername.htmlspecialchars()
		}</b> теперь не известен как <b>${
			newusername.htmlspecialchars()
		}</b>`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

async function addDelAchivka(knex, bot, msg, achivka, action) {
	if(!msg.reply_to_message) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> ответьте тому, кому вы хотите добавить или удалить ачивку', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(msg.from.id === msg.reply_to_message.from.id &&
		!config.admin_ids.includes(msg.from.id)) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> самому себе добавлять или удалять ачивку нельзя', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(action !== 'add' && action !== 'del') {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> действие должно быть add или del', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if(!achivka) {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> вы забыли ачивку', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	achivka = achivka.toLowerCase();

	if(action === 'add') {
		let achivkaExists = await isAchivkaRelExists(knex, msg.reply_to_message.from.id, achivka);

		if(achivkaExists) {
			return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> <b>${
				getName(msg.reply_to_message)
			}</b> уже имеет ачивку <b>${
				achivka.toTitleCase().htmlspecialchars()
			}</b>`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}


		if(!await isProfileExists(knex, msg.reply_to_message.from.id)) {
			await addProfile(knex, msg.reply_to_message.from.id);
		}

		if(!await isAchivkaExists(knex, achivka)) {
			await addAchivka(knex, achivka);
		}

		await addAchivkaRel(knex, msg.reply_to_message.from.id, achivka);

		return await bot.sendMessage(msg.chat.id, `<b>${
			getName(msg.reply_to_message)
		}</b> теперь имеет ачивку <b>${
			achivka.toTitleCase().htmlspecialchars()
		}</b>`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	} else if(action === 'del') {
		let achivkaExists = await isAchivkaRelExists(knex, msg.reply_to_message.from.id, achivka);

		if(!achivkaExists) {
			return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> <b>${
				getName(msg.reply_to_message)
			}</b> не имеет ачивку <b>${
				achivka.toTitleCase().htmlspecialchars()
			}</b>`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}

		await delAchivkaRel(knex, msg.reply_to_message.from.id, achivka);

		if(!await isAchivkaRelExists(knex, undefined, achivka)) {
			await delAchivka(knex, achivka);
		}

		return await bot.sendMessage(msg.chat.id, `<b>${
			getName(msg.reply_to_message)
		}</b> теперь не имеет ачивку <b>${
			achivka.toTitleCase().htmlspecialchars()
		}</b>`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

async function showProfile(knex, bot, msg) {
	let id = msg.from.id;
	let username = msg.from.username || '';
	let name = getName(msg);

	if(msg.reply_to_message) {
		id = msg.reply_to_message.from.id;
		username = msg.reply_to_message.from.username || '';
		name = getName(msg.reply_to_message);
	}

	// специально не инициализируем профиль, чтобы получилось undefined
	let profileRow = await getProfile(knex, id, false);
	let membersCount = await bot.getChatMembersCount(msg.chat.id);
	let achivkas = await getAchivkas(knex, id);
	let aliases = await getAliases(knex,
		(username ? `@${username.toLowerCase()}` : ''), 'username');
	let aliasesId = await getAliases(knex, id, 'userid');

	// выводим бан в процентах от количества участников группы
	if(!isNaN(profileRow.bans)) {
		profileRow.bans = Number((profileRow.bans / membersCount * 100).toFixed(2));
	}

	// выводим eban в процентах от количества участников группы
	if(!isNaN(profileRow.ebans)) {
		profileRow.ebans = Number((profileRow.ebans / membersCount * 100).toFixed(2));
	}

	if(achivkas.length > 0) {
		achivkas = achivkas
			.map((item) =>
				item.toTitleCase().htmlspecialchars()
			).join('</b>, <b>');
	} else {
		// опять прикол с undefined
		achivkas = undefined;
	}

	if(aliases && aliasesId) {
		aliases = aliases.concat(aliasesId);
	} else if(aliasesId) {
		aliases = aliasesId;
	}

	if(aliases.length > 0) {
		aliases = aliases
			.map((item) => item.htmlspecialchars())
			.join('</b>, <b>');
	} else {
		// опять прикол с undefined
		aliases = undefined;
	}

	// выводим так, чтоб было NaN
	let replyText = `Профиль <b>${name}</b>:
<b>${Number(profileRow.respects)}</b> чести
<b>${Number(profileRow.bans)}%</b> бана
<b>${Number(profileRow.ibans)}</b> раз банил
<b>${Number(profileRow.suicides)}</b> суицидов
<b>${Number(profileRow.ebans)}%</b> eban
<b>${Number(profileRow.iebans)}</b> раз делал eban
<b>${Number(profileRow.rotebans)}</b> vroteban
<b>${Number(profileRow.irotebans)}</b> раз делал vroteban
Ачивки: <b>${achivkas}</b>
Известен как: <b>${aliases}</b>`;

	let lastSendedMessage = {};

	for(let replyPart of replyText.match(/(.|[\r\n]){1,4000}/g)) {
		try {
			lastSendedMessage = await bot.sendMessage(msg.chat.id, replyPart, {
				parse_mode:'HTML',
				reply_to_message_id: msg.message_id
			});
		} catch(e) {
			if(e.code === 400) {
				try {
					lastSendedMessage = await bot.sendMessage(msg.chat.id, replyPart + '</b>', {
						parse_mode:'HTML',
						reply_to_message_id: msg.message_id
					});
				} catch(e) {
					if(e.code === 400) {
						lastSendedMessage = await bot.sendMessage(msg.chat.id, '<b>' + replyPart, {
							parse_mode:'HTML',
							reply_to_message_id: msg.message_id
						});
					} else {
						throw e;
					}
				}
			} else {
				throw e;
			}
		}
	}

	return lastSendedMessage;
}

async function realBan(knex, bot, msg, status) {
	if(!config.admin_ids.includes(msg.from.id)) {
		return;
	}

	if(!msg.reply_to_message) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> укажите кого заблокировать/разблокировать', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(msg.from.id === msg.reply_to_message.from.id) {
		return await bot.sendMessage(msg.chat.id,
			'<b>Ошибка:</b> защита от дурака в действии', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}

	if(status !== true && status !== false) {
		return await bot.sendMessage(msg.chat.id, 'Ошибка: статус блокировки должен быть true или false', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	let profileRow = await getProfile(knex, msg.reply_to_message.from.id);

	if(profileRow.banned === status) {
		if(profileRow.banned) {
			return await bot.sendMessage(msg.chat.id, 'Ошибка: человек уже заблокирован', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		} else {
			return await bot.sendMessage(msg.chat.id, 'Ошибка: человек ещё не заблокирован', {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		}
	}

	await knex('profiles').where('userid', msg.reply_to_message.from.id)
		.update('banned', status);

	if(status) {
		return await bot.sendMessage(msg.chat.id, `<b>${
			getName(msg.reply_to_message)
		}</b> успешно заблокирован`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	} else {
		return await bot.sendMessage(msg.chat.id, `<b>${
			getName(msg.reply_to_message)
		}</b> успешно разблокирован`, {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

async function processLinks(knex, bot, msg) {
	let aliases = getMessageText(msg).match(/@[A-Za-zА-Яа-я0-9_]+/g);

	if(aliases === null) {
		return;
	}

	let rows = await knex('aliases_rel')
		.leftJoin('profiles', 'aliases_rel.profile_id', 'profiles.id')
		.leftJoin('usernames', 'aliases_rel.username_id', 'usernames.id')
		.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id')
		.whereIn('alias', aliases)
		.select('userid', 'username', 'alias');

	let usernames = rows.map(row => {
		if(row.userid !== null) {
			return `<a href="tg://user?id=${row.userid}">${row.alias}</a>`;
		} else if(row.username !== null) {
			return row.username;
		}
	});

	if(usernames.length > 0) {
		return await bot.sendMessage(msg.chat.id, usernames.join(' '), {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

async function processLinksInline(knex, msgText, markup) {
	let aliases = msgText.match(/@[A-Za-zА-Яа-я0-9_]+/g);

	if(aliases === null) {
		return msgText;
	}

	let rows = await knex('aliases_rel')
		.leftJoin('profiles', 'aliases_rel.profile_id', 'profiles.id')
		.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id')
		.whereIn('alias', aliases)
		.select('userid', 'alias');

	rows.forEach(row => {
		if(row.userid !== null) {
			if(markup === 'html') {
				msgText = msgText.replace(new RegExp(`${RegExp.quote(row.alias)}`, 'gi'),
					`<a href="tg://user?id=${row.userid}">$&</a>`);
			} else if(markup === 'markdown') {
				msgText = msgText.replace(new RegExp(`${RegExp.quote(row.alias)}`, 'gi'),
					`[$&](tg://user?id=${row.userid})`);
			}
		}
	});

	return msgText;
}

module.exports = {
	payRespect,
	voteBan,
	voteEban,
	vRotEban,
	linkUser,
	addDelAchivka,
	showProfile,
	realBan,
	processLinks,
	processLinksInline
};
