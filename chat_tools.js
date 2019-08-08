async function isChatExists(knex, chatId) {
	let count = Number((await knex('chats').where('chatid', chatId).count('*'))[0].count);

	if(count > 0) {
		return true;
	} else {
		return false;
	}
}

async function getChat(knex, chatId) {
	let rows = await knex('chats').where('chatid', chatId);

	if(rows.length > 0) {
		return rows[0];
	} else {
		return {};
	}
}

async function addChat(knex, chatId) {
	await knex('chats').insert({'chatid': chatId});
}

async function delChat(knex, chatId) {
	await knex('chats').where('chatid', chatId).del();
}

async function migrateChat(knex, chatId, newId) {
	await knex('chats').where('chatid', chatId).update('chatid', newId);
}

async function updateChat(knex, chatId, newVersion) {
	await knex('chats').where('chatid', chatId).update('version', newVersion);
}

module.exports = {
	isChatExists,
	getChat,
	addChat,
	delChat,
	migrateChat,
	updateChat
};
