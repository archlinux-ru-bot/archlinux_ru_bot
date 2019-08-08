'use strict';

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('Word', {
		word: DataTypes.STRING
	}, {
		indexes: [
			{
				unique: true,
				fields: ['word'],
				operator: 'varchar_pattern_ops'
			}
		],
		classMethods: {
			learn: async function (array) {
				let uniqWords = array.filter((item, index, arr) =>
					arr.indexOf(item) === index);

				let oldWords = (await this.findAll({
					where: {
						word: uniqWords
					}
				})).map(oldWord => oldWord.get('word'));

				let newWords = uniqWords.filter(word => !oldWords.includes(word));

				try {
					await this.bulkCreate(newWords.map(newWord => ({word: newWord})));
				} catch(e) {
					if(e.name === 'SequelizeUniqueConstraintError') {
						return await this.learn(array);
					} else {
						throw e;
					}
				}

				return await this.findAll({
					where: {
						word: uniqWords
					}
				});
			}
		}
	});
};