let config = require('./config');

async function isProfileExists(knex, id) {
	let profileCount = Number((await knex('profiles').where('userid', id).count('*'))[0].count);

	if(profileCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function isAchivkaExists(knex, achivka) {
	let achivkaCount = Number((await knex('achivkas').where('achivka', achivka).count('*'))[0].count);

	if(achivkaCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function isAchivkaRelExists(knex, id, achivka) {
	let achivkaRelCount = 0;

	if(typeof id !== 'undefined') {
		achivkaRelCount = Number((await knex('achivkas_rel')
			.leftJoin('profiles', 'achivkas_rel.profile_id', 'profiles.id')
			.leftJoin('achivkas', 'achivkas_rel.achivka_id', 'achivkas.id')
			.where({
				'userid': id,
				'achivka': achivka
			})
			.count('*'))[0].count);
	} else {
		achivkaRelCount = Number((await knex('achivkas_rel')
			.leftJoin('achivkas', 'achivkas_rel.achivka_id', 'achivkas.id')
			.where({
				'achivka': achivka
			})
			.count('*'))[0].count);
	}

	if(achivkaRelCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function isUsernameExists(knex, username) {
	let usernameCount = Number((await knex('usernames').where('username', username).count('*'))[0].count);

	if(usernameCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function isAliasExists(knex, alias) {
	let aliasCount = Number((await knex('aliases').where('alias', alias).count('*'))[0].count);

	if(aliasCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function isAliasRelExists(knex, identifier, alias, mode) {
	let aliasRelCount = 0;

	if(mode === 'userid') {
		let aliasesRel = knex('aliases_rel')
			.leftJoin('profiles', 'aliases_rel.profile_id', 'profiles.id');

		let whereObj = {
			'userid': identifier
		};

		if(typeof alias !== 'undefined') {
			aliasesRel = aliasesRel
				.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id');

			whereObj.alias = alias;
		}

		aliasRelCount = Number((await aliasesRel
			.where(whereObj)
			.count('*'))[0].count);
	} else if(mode === 'username') {
		let aliasesRel = knex('aliases_rel')
			.leftJoin('usernames', 'aliases_rel.username_id', 'usernames.id');

		let whereObj = {
			'username': identifier
		};

		if(typeof alias !== 'undefined') {
			aliasesRel = aliasesRel
				.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id');

			whereObj.alias = alias;
		}

		aliasRelCount = Number((await aliasesRel
			.where(whereObj)
			.count('*'))[0].count);
	} else {
		aliasRelCount = Number((await knex('aliases_rel')
			.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id')
			.where({
				'alias': alias
			})
			.count('*'))[0].count);
	}

	if(aliasRelCount > 0) {
		return true;
	} else {
		return false;
	}
}

async function getProfile(knex, id, create = true) {
	let rows = await knex('profiles').where('userid', id);

	if(rows.length === 0 && create) {
		await addProfile(knex, id);
		rows = await knex('profiles').where('userid', id);
		return rows[0];
	} else if(rows.length === 0) {
		return {};
	} else {
		return rows[0];
	}
}

async function getAchivkas(knex, id) {
	let achivkas = (await knex('achivkas_rel')
		.leftJoin('profiles', 'achivkas_rel.profile_id', 'profiles.id')
		.leftJoin('achivkas', 'achivkas_rel.achivka_id', 'achivkas.id')
		.where('userid', id)
		.select('achivka')).map(row => row.achivka);

	return achivkas;
}

async function getAliases(knex, identifier, mode) {
	let aliasRows = [];

	if(mode === 'userid') {
		aliasRows = await knex('aliases_rel')
			.leftJoin('profiles', 'aliases_rel.profile_id', 'profiles.id')
			.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id')
			.where('userid', identifier)
			.select('alias');
	} else if(mode === 'username') {
		aliasRows = await knex('aliases_rel')
			.leftJoin('usernames', 'aliases_rel.username_id', 'usernames.id')
			.leftJoin('aliases', 'aliases_rel.alias_id', 'aliases.id')
			.where('username', identifier)
			.select('alias');
	}

	let aliases = aliasRows.map(row => row.alias);

	return aliases;
}

async function addProfile(knex, id) {
	await knex('profiles').insert({'userid': id});
}

async function addAchivka(knex, achivka) {
	await knex('achivkas').insert({'achivka': achivka});
}

async function addAchivkaRel(knex, id, achivka) {
	let profileRows = await knex('profiles').where('userid', id).select('id');
	let achivkaRows = await knex('achivkas').where('achivka', achivka).select('id');

	await knex('achivkas_rel').insert({'profile_id': profileRows[0].id, 'achivka_id': achivkaRows[0].id});
}

async function addUsername(knex, username) {
	await knex('usernames').insert({'username': username});
}

async function addAlias(knex, alias) {
	await knex('aliases').insert({'alias': alias});
}

async function addAliasRel(knex, identifier, alias, mode) {
	if(mode === 'userid') {
		let profileRows = await knex('profiles').where('userid', identifier).select('id');
		let aliasRows = await knex('aliases').where('alias', alias).select('id');

		await knex('aliases_rel').insert({'profile_id': profileRows[0].id, 'alias_id': aliasRows[0].id});
	} else if(mode === 'username') {
		let usernameRows = await knex('usernames').where('username', identifier).select('id');
		let aliasRows = await knex('aliases').where('alias', alias).select('id');

		await knex('aliases_rel').insert({'username_id': usernameRows[0].id, 'alias_id': aliasRows[0].id});
	}
}

async function delProfile(knex, id) {
	await knex('profiles').where('userid', id).del();
}

async function delAchivka(knex, achivka) {
	await knex('achivkas').where('achivka', achivka).del();
}

async function delAchivkaRel(knex, id, achivka) {
	let profileRows = await knex('profiles').where('userid', id).select('id');
	let achivkaRows = await knex('achivkas').where('achivka', achivka).select('id');

	await knex('achivkas_rel').where({'profile_id': profileRows[0].id, 'achivka_id': achivkaRows[0].id}).del();
}

async function delUsername(knex, username) {
	await knex('usernames').where('username', username).del();
}

async function delAlias(knex, alias) {
	await knex('aliases').where('alias', alias).del();
}

async function delAliasRel(knex, identifier, alias, mode) {
	if(mode === 'userid') {
		let profileRows = await knex('profiles').where('userid', identifier).select('id');
		let aliasRows = await knex('aliases').where('alias', alias).select('id');

		await knex('aliases_rel').where({'profile_id': profileRows[0].id, 'alias_id': aliasRows[0].id}).del();
	} else if(mode === 'username') {
		let usernameRows = await knex('usernames').where('username', identifier).select('id');
		let aliasRows = await knex('aliases').where('alias', alias).select('id');

		await knex('aliases_rel').where({'username_id': usernameRows[0].id, 'alias_id': aliasRows[0].id}).del();
	}
}

function verifyBalls(msg, num, ignore_self = false) {
	if(!msg.reply_to_message) {
		return '<b>Ошибка:</b> ответьте тому, кому вы хотите это сделать';
	}

	if(!ignore_self) {
		if(msg.from.id === msg.reply_to_message.from.id &&
			!config.admin_ids.includes(msg.from.id)) {
			return '<b>Ошибка:</b> самому себе нельзя';
		}
	}

	if(isNaN(num)) {
		return '<b>Ошибка:</b> кажется, вы мне суёте <b>NaN</b>, но я не употребляю';
	}

	if(!Number.isSafeInteger(num)) {
		return '<b>Ошибка:</b> головонька от числа опухла';
	}

	if(num === 0) {
		return '<b>Ошибка:</b> <b>0</b> нельзя, в нем нет палочки';
	}

	return;
}

module.exports = {
	isProfileExists,
	isAchivkaExists,
	isAchivkaRelExists,
	isUsernameExists,
	isAliasExists,
	isAliasRelExists,
	getProfile,
	getAchivkas,
	getAliases,
	addProfile,
	addAchivka,
	addAchivkaRel,
	addUsername,
	addAlias,
	addAliasRel,
	delProfile,
	delAchivka,
	delAchivkaRel,
	delUsername,
	delAlias,
	delAliasRel,
	verifyBalls
};
