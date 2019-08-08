const models = require('../models');
const Message = require('./message.js');

const eightballAnswer = [
	'Бесспорно.',
	'Предрешено.',
	'Никаких сомнений.',
	'Определённо да.',
	'Можешь быть уверен в этом.',
	'Мне кажется — «да»',
	'Вероятнее всего.',
	'Хорошие перспективы.',
	'Знаки говорят — «да».',
	'Да.',
	'Пока не ясно.',
	'Cпроси завтра.',
	'Лучше не рассказывать.',
	'Сегодня нельзя предсказать.',
	'Сконцентрируйся и спроси опять.',
	'Даже не думай.',
	'Мой ответ — «нет».',
	'По моим данным — «нет».',
	'Перспективы не очень хорошие.',
	'Весьма сомнительно.'
];

function CommandParser(bot, logger) {
	this.bot = bot;
	this.logger = logger;
}

CommandParser.prototype.isCommand = function (msg) {
	return msg.entities && msg.entities.filter((item) => {
		return item.type === 'bot_command' && item.offset === 0;
	})[0];
};

CommandParser.prototype.process = async function (msg) {
	let commandEntity = msg.entities.filter((item) => {
		return item.type === 'bot_command' && item.offset === 0;
	})[0];
	let command = msg.text.substr(commandEntity.offset, commandEntity.length);
	msg.text = msg.text.substr(commandEntity.length + 1);
	msg.entities = msg.entities.filter((entity) => {
		return entity.type !== 'bot_command';
	});

	if (command.includes('isCommand') || command.includes('process')) {
		return;
	}

	if (msg.chat.type === 'supergroup' || msg.chat.type === 'group') {
		if (!command.includes(this.bot.me.username)) {
			return;
		}
	}

	command = command.split('@')[0].substr(1).trim();

	if (this[command]) {
		await this[command](msg);
	}
};

CommandParser.prototype.get_gab = async function (msg) {
	let self = this;
	let chat = await models.Chat.getChat(msg);

	return await self.bot.sendMessage(msg.chat.id, chat.get('random_chance'), {
		reply_to_message_id: msg.message_id
	});
};

CommandParser.prototype.set_gab = async function (msg) {
	let self = this;
	let chance = parseInt(msg.text) || 0;
	if ((msg.chat.type === 'supergroup' || msg.chat.type === 'group')) {
		let admins = await this.bot.getChatAdministrators(msg.chat.id);
		let user = admins.filter((admin) => {
			return admin.user.id === msg.from.id;
		})[0];

		if (!user) {
			return await self.bot.sendMessage(msg.chat.id, 'Not allowed', {
				reply_to_message_id: msg.message_id
			});
		}
	}

	let chat = await models.Chat.getChat(msg);
	chat.set('random_chance', chance);
	chat.save();
	return await self.bot.sendMessage(msg.chat.id, 'Setting gab to ' + chance, {
		reply_to_message_id: msg.message_id
	});
};

CommandParser.prototype.get_pairs = async function (msg) {
	let chat = await models.Chat.getChat(msg);
	let counter = await models.Pair.count({where: {ChatId: chat.get('id')}});

	return await this.bot.sendMessage(msg.chat.id, 'Known pairs for this chat ' + counter, {
		reply_to_message_id: msg.message_id
	});
};

CommandParser.prototype.eightball = async function (msg) {
	let mm = new Message(this.bot, msg, this.logger);
	await this.bot.sendChatAction(msg.chat.id, 'typing');
	let additionalAnswer = await mm.generateAnswer();
	return await mm.reply(eightballAnswer[Math.floor(Math.random() * eightballAnswer.length)] +
        ' ' + additionalAnswer.join(' '));
};

module.exports = CommandParser;
