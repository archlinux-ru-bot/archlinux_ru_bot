const config = require('../config/config.js');
const models = require('../models');

function Message(bot, msg, logger) {
	this.bot = bot;
	this.message = msg;
	this.logger = logger;
	this.text = this.message.text;
	this.words = this.get_words();
}

Message.prototype.has_text = function () {
	return this.message.text;
};

Message.prototype.get_words = function () {
	let text = this.getTextWithoutEntities();

	if (typeof text === 'undefined') {
		text = '';
	}

	return text.split(/\s+|\\n/).map(word => {
		return word.toLowerCase();
	});
};


Message.prototype.getTextWithoutEntities = function () {
	if (!this.message.entities) {
		return this.text;
	}

	let self = this;
	let text = this.text;
	this.message.entities.forEach((entity) => {
		text = text.replace(self.text.substr(entity.offset, entity.length), '');
	});
	return text;
};

Message.prototype.isReplyToBot = function () {
	return this.message.reply_to_message && this.message.reply_to_message.from.id === this.bot.me.id;
};

Message.prototype.hasAnchors = function () {
	return this.has_text() && !config.triggers.every((trigger) => 
		!trigger.test(this.text));
};

Message.prototype.answer = async function (msg) {
	return await this.bot.sendMessage(this.message.chat.id, msg);
};

Message.prototype.reply = async function (msg) {
	return await this.bot.sendMessage(this.message.chat.id, msg, {
		reply_to_message_id: this.message.message_id
	});
};

Message.prototype.process = async function () {
	let chat = await models.Chat.getChat(this.message);

	this.chat = chat;
	if (this.message.migrate_to_chat_id) {
		await chat.migration(this.logger, this.message.migrate_to_chat_id);
	}

	if (this.has_text()) {
		if (Math.abs(this.message.date - Math.floor(Date.now() / 1000)) > 20) {
			return;
		}
		await models.Pair.learn(this);

		if (this.hasAnchors() || this.isReplyToBot() || this.randomAnswer() || config.debug) {
			this.bot.sendChatAction(this.message.chat.id, 'typing');
			let replyArray = await this.generateAnswer();
			if (!replyArray.length || !replyArray[0].length) {
				return;
			}

			let reply = replyArray.join(' ');

			if (reply) {
				return config.debug ? await this.reply(reply) : await this.answer(reply);
			}
		}
	}
};

Message.prototype.generateAnswer = async function () {
	if (!this.chat) {
		this.chat = await models.Chat.getChat(this.message);
	}
	return await models.Pair.generate(this);
};

Message.prototype.randomAnswer = function () {
	return Math.floor(Math.random() * 100) <= this.chat.get('random_chance');
};

module.exports = Message;
