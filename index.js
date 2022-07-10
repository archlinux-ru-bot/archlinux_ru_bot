let Telegraf = require('telegraf');

let {getArgs, getName, getMessageText} = require('./util');

let {createTables, initializePlugins,
	uninitializePlugins} = require('./initialize_tools');

let {getProfile} = require('./profile_tools');

let {payRespect, voteBan, voteEban,
	vRotEban, linkUser, addDelAchivka,
	showProfile, realBan, processLinks,
	processLinksInline} = require('./profile_actions');

let {getChat, migrateChat} = require('./chat_tools');
let {getPluginMonopolyAccess} = require('./runtime_plugin_tools');
let {sendToPlugins} = require('./plugin_actions');
let {doVzhuh} = require('./conversation_tools');
let {sendWithMe, sendVzhuh, sendCat} = require('./conversation_actions');

let {showAbout, showHelp, showInlineHelp,
	showAdminHelp, showHostInfo, showUpdateNotification} = require('./info_actions');

let {payRespectByKeyword, voteBanByKeyword, orReaction} = require('./message_actions');

async function exitHandler() {
	try {
		bot.stop();
	} catch(e) {
		console.log(e);
	}

	try {
		await uninitializePlugins();
	} catch(e) {
		console.log(e);
	}
}

process.on('exit', exitHandler);
process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

let knex = require('knex')({
	client: 'pg',
	connection: {
		host: process.env.DB_HOST,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DBNAME
	}
});

let bot = new Telegraf(process.env.BOT_TOKEN, {
	telegram: {
		apiRoot: 'http://localhost:8081'
	}
});

async function main() {
	await createTables(knex);

	try {
		await initializePlugins(knex, bot.telegram);
	} catch(e) {
		console.log(e);
	}

	bot.on('message', (ctx, next) => {
		if(ctx.message.chat.type !== 'private') {
			next(ctx);
		}
	});

	bot.on('migrate_to_chat_id', async (ctx, next) => {
		try {
			let chat = await getChat(knex, ctx.message.chat.id);

			if(typeof chat.chatid === 'undefined') {
				return;
			}

			await migrateChat(knex, chat.chatid, ctx.message.migrate_to_chat_id);
		} catch(e) {
			console.log(e);
		}

		next(ctx);
	});

	bot.on('message', async (ctx, next) => {
		try {
			let profileRow = await getProfile(knex, ctx.message.from.id, false);

			if(!profileRow.banned) {
				next(ctx);
			}
		} catch(e) {
			console.log(e);
		}
	});

	bot.on('message', async (ctx, next) => {
		next(ctx);

		try {
			await showUpdateNotification(knex, bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on('message', async (ctx, next) => {
		try {
			let monopolyAccess = getPluginMonopolyAccess(ctx.message.chat.id, ctx.message.from.id);

			if(monopolyAccess === null) {
				next(ctx);
			} else {
				await sendToPlugins(knex, bot.telegram, ctx.message);
			}
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/about@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showAbout(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/help@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showHelp(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/inlinehelp@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showInlineHelp(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/adminhelp@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showAdminHelp(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/ping@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await bot.telegram.sendMessage(ctx.message.chat.id, 'PONG', {
				parse_mode: 'HTML',
				reply_to_message_id: ctx.message.message_id
			});
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/F@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [num] = getArgs(ctx.message.text, 1);

			if(typeof num !== 'undefined' && num.length > 0) {
				num = Number(num);
			} else {
				num = 1;
			}

			await payRespect(knex, bot.telegram, ctx.message, num);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/(vote)?ban@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [num] = getArgs(ctx.message.text, 1);

			if(typeof num !== 'undefined' && num.length > 0) {
				num = Number(num);
			} else {
				num = 1;
			}

			await voteBan(knex, bot.telegram, ctx.message, num);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/voteeban@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [num] = getArgs(ctx.message.text, 1);

			if(typeof num !== 'undefined' && num.length > 0) {
				num = Number(num);
			} else {
				num = 1;
			}

			await voteEban(knex, bot.telegram, ctx.message, num);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/vroteban@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [num] = getArgs(ctx.message.text, 1);

			if(typeof num !== 'undefined' && num.length > 0) {
				num = Number(num);
			} else {
				num = 1;
			}

			await vRotEban(knex, bot.telegram, ctx.message, num);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/ln@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await linkUser(knex, bot.telegram, ctx.message, 'link');
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/unlink@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await linkUser(knex, bot.telegram, ctx.message, 'unlink');
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/mkachivka@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [achivka] = getArgs(ctx.message.text, 1);

			await addDelAchivka(knex, bot.telegram, ctx.message, achivka, 'add');
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/rmachivka@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [achivka] = getArgs(ctx.message.text, 1);

			await addDelAchivka(knex, bot.telegram, ctx.message, achivka, 'del');
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/profile@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showProfile(knex, bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/me(?:@${bot.telegram.me.username})?(?:[^A-Za-zА-Яа-яЁё0-9_]|$)`, 'i'), async (ctx) => {
		try {
			await sendWithMe(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/vzhuh@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await sendVzhuh(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/meow@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await sendCat(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/hostinfo@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			await showHostInfo(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.hears(new RegExp(`^/realban@${bot.telegram.me.username}`, 'i'), async (ctx) => {
		try {
			let [status] = getArgs(ctx.message.text, 1);

			if(typeof status !== 'undefined' && status.length > 0) {
				if(status === 'true') {
					status = true;
				} else if(status === 'false') {
					status = false;
				}
			} else {
				status = true;
			}

			await realBan(knex, bot.telegram, ctx.message, status);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on(['text', 'sticker'], async (ctx, next) => {
		try {
			await payRespectByKeyword(knex, bot.telegram, ctx, ctx.message, next);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on(['text', 'sticker'], async (ctx, next) => {
		try {
			await voteBanByKeyword(knex, bot.telegram, ctx, ctx.message, next);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on(['text', 'animation', 'audio', 'document', 'photo', 'video', 'voice'], async (ctx, next) => {
		next(ctx);

		try {
			await processLinks(knex, bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on(['text', 'animation', 'audio', 'document', 'photo', 'video', 'voice'], async (ctx, next) => {
		next(ctx);

		try {
			await orReaction(bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on(['text', 'animation', 'audio', 'document', 'photo', 'video', 'voice'], async (ctx, next) => {
		next(ctx);

		try {
			if(new RegExp(
				'(?:[^A-Za-zА-Яа-яЁё0-9_]|^)д(о|а)лб(о|а)(е|ё)б(?:[^A-Za-zА-Яа-яЁё0-9_]|$)',
				'i').test(getMessageText(ctx.message))) {
				await bot.telegram.sendMessage(ctx.message.chat.id, 'Не долбоёб, а долбоёбище', {
					parse_mode: 'HTML',
					reply_to_message_id: ctx.message.message_id
				});
			}
		} catch(e) {
			console.log(e);
		}
	});

	bot.on('message', async (ctx) => {
		try {
			await sendToPlugins(knex, bot.telegram, ctx.message);
		} catch(e) {
			console.log(e);
		}
	});

	bot.on('inline_query', async (ctx) => {
		try {
			let htmlMessage = await processLinksInline(knex, ctx.inlineQuery.query.extendFormatting('html'), 'html');
			let markdownMessage = await processLinksInline(knex, ctx.inlineQuery.query.extendFormatting('markdown'), 'markdown');
			let vzhuhResult = doVzhuh(htmlMessage);
			let answerObject = [];

			if(markdownMessage.length > 0) {
				answerObject.push({
					type: 'article',
					id: 'markdown',
					title: 'Markdown',
					input_message_content: {
						message_text: markdownMessage,
						parse_mode: 'Markdown'
					},
					description: markdownMessage
				});
			}

			if(htmlMessage.length > 0) {
				answerObject.push({
					type: 'article',
					id: 'html',
					title: 'HTML',
					input_message_content: {
						message_text: htmlMessage,
						parse_mode: 'HTML'
					},
					description: htmlMessage
				});
			}

			answerObject.push({
				type: 'article',
				id: 'me_command',
				title: '/me (HTML)',
				input_message_content: {
					message_text: `<b>* ${getName(ctx.inlineQuery)}</b> ${htmlMessage}`,
					parse_mode: 'HTML'
				},
				description: `<b>* ${getName(ctx.inlineQuery)}</b> ${htmlMessage}`
			});

			answerObject.push({
				type: 'article',
				id: 'vzhuh',
				title: 'Вжух (HTML)',
				input_message_content: {
					message_text: vzhuhResult,
					parse_mode: 'HTML'
				},
				description: vzhuhResult
			});

			await bot.telegram.answerInlineQuery(ctx.inlineQuery.id, answerObject, {
				cache_time: 0
			});
		} catch(e) {
			console.log(e);
		}
	});

	bot.telegram.setWebhook('http://localhost:5000');
	bot.startWebhook('/', null, 5000);
}

void async function getMe() {
	bot.telegram.getMe()
		.then(botAccount => {
			bot.telegram.me = botAccount;

			main()
				.catch(e => {
					console.log(e);
					process.exit(1);
				});
		})
		.catch(e => {
			console.log(e);
			setTimeout(getMe, 5000);
		});
}();
