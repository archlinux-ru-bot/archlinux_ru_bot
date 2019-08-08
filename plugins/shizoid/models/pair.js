'use strict';

const config = require('../config/config.js');

module.exports = function (sequelize) {
	let Pair = sequelize.define('Pair', {}, {
		indexes: [
			{
				fields: ['ChatId']
			},
			{
				fields: ['firstId']
			},
			{
				fields: ['secondId']
			}
		],
		classMethods: {
			associate: function (models) {
				Pair.belongsTo(models.Chat);
				Pair.belongsTo(models.Word, {as: 'first'});
				Pair.belongsTo(models.Word, {as: 'second'});
				Pair.hasMany(models.Reply);
			},
			learn: async function (message) {
				let self = this;
				let Word = sequelize.import('./word');
				let Reply = sequelize.import('./reply');
				let response = await Word.learn(message.words);
				let words = [null];

				message.words.forEach((word) => {
					words.push(response.filter((el) => el.get('word') === word)[0].get('id'));
					if (config.punctuation.endSentence.indexOf(word[word.length - 1]) >= 0) {
						words.push(null);
					}
				});

				if (words[words.length - 1] !== null) {
					words.push(null);
				}

				while (words.length) {
					let triplet = words.slice(0, 3);
					words.shift();
					try {
						let pair = (await self.findOrCreate({
							where: {
								ChatId: message.chat.get('id'),
								firstId: triplet[0],
								secondId: triplet[1]
							},
							include: [{model: Reply, all: true}]
						}))[0];

						let reply = undefined;

						if (typeof pair.Replies !== 'undefined') {
							reply = pair.Replies.filter((reply) => {
								return reply.get('WordId') === triplet[2];
							})[0];
						}

						if (!reply) {
							pair.createReply({
								PairId: pair.get('id'),
								WordId: triplet[2]
							});
						} else {
							reply.increment('counter');
						}
					} catch (e) {
						message.logger.log(e);
					}
				}
			},
			getPair: async function (chatId, firstId, secondId) {
				let self = this;
				let pair = null;
				pair = await self.findAll({
					where: {
						ChatId: chatId,
						firstId: firstId,
						secondId: secondId,
						createdAt: {
							$lt: new Date((!config.debug) ? new Date() - 10 * 60 * 1000 : new Date())
						}
					},
					include: [
						{
							model: sequelize.import('./reply'),
							all: true,
							nested: true,
							limit: 3,
							separate: false
						}
					],
					order: [
						[sequelize.import('./reply'), 'counter', 'DESC']
					],
					limit: 3
				});


				return pair[Math.floor(Math.random() * pair.length)];
			},
			generate: async function (message) {
				let self = this;
				let Word = sequelize.import('./word');
				let endSentences = config.punctuation.endSentence.split('');
				let usingWords = message.words.filter(word => !endSentences.includes(word));

				let response = await Word.findAll({
					where: {
						word: usingWords
					}
				});

				let wordIds = response.map((result) => {
					return result.get('id');
				});

				let sentences = Math.floor(Math.random() * 3) + 1;
				let result = [];

				let generateSentence = async function (message) {
					let sentence = '';
					let safety_counter = 50;
					let safeGetter = {get: () => null};
					let firstWord = null;
					let secondWord = wordIds;
					let pair = await self.getPair(message.chat.get('id').toString(), firstWord, secondWord);
					while (pair && safety_counter) {
						safety_counter--;
						let reply = pair.Replies[Math.floor(Math.random() * pair.Replies.length)];
						firstWord = (pair.get('second') || safeGetter).get('id');
						secondWord = (reply.get('Word') || safeGetter).get('id');

						if (!sentence.length) {
							sentence = (pair.get('second') || safeGetter).get('word') + ' ';
							sentence = sentence.charAt(0).toUpperCase() + sentence.substring(1);
							wordIds = wordIds.filter(wordId => wordId !== firstWord);
						}

						if ((reply.get('Word') || safeGetter).get('word')) {
							sentence = sentence + reply.get('Word').get('word') + ' ';
						} else {
							break;
						}

						pair = await self.getPair(message.chat.id.toString(), firstWord, secondWord);
					}

					if (sentence.length) {
						sentence = sentence.trim();
						if (config.punctuation.endSentence.indexOf(sentence[sentence.length - 1]) < 0) {
							sentence += endSentences[Math.floor(Math.random() * endSentences.length)];
						}
					}

					return sentence;
				};

				for (let i = 0; i < sentences; i++) {
					let tempSentence = await generateSentence(message);
					result.push(tempSentence);
				}

				return result;
			}
		}
	}
	);
	return Pair;
};
