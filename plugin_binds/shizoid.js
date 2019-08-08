let models = require('../plugins/shizoid/models');
let CommandParser = require('../plugins/shizoid/app/commandParser');
let Message = require('../plugins/shizoid/app/message');

let friendlyName = 'Шизик';
let logger = {};
let commandParser = {};

async function init(utils, bot) {
	logger = {
		pluginName: utils.pluginName,
		log: utils.log
	};

	commandParser = new CommandParser(bot, logger);

	try {
		await models.sequelize.sync();
	} catch(e) {
		logger.log(e);
	}
}

async function exitHandler() {
	models.sequelize.close();
}

async function onNewMessage(bot, msg) {
	if(new RegExp(`^/help@${bot.me.username}`, 'i').test(msg.text)) {
		return await bot.sendMessage(msg.chat.id,
			`/shizoid@${bot.me.username} get_gab - Посмотреть частоту написания сообщений
/shizoid@${bot.me.username} set_gab - Установить частоту написания сообщений
/shizoid@${bot.me.username} get_pairs - Посмотреть количество пар слов
/shizoid@${bot.me.username} eightball - Случайный ответ

Этот плагин основан на проекте https://github.com/vlakam/shizoid`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	} else if(commandParser.isCommand(msg)) {
		return await commandParser.process(msg);
	} else {
		return await new Message(bot, msg, logger).process();
	}
}

module.exports = {
	friendlyName,
	init,
	exitHandler,
	onNewMessage
};
