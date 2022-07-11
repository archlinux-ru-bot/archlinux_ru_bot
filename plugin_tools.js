let fs = require('fs');
let path = require('path');

async function isPluginExists(knex, pluginName) {
	let count = Number((await knex('plugins').where('name', pluginName).count('*'))[0].count);

	if(count > 0) {
		return true;
	} else {
		return false;
	}
}

async function isPluginAllowed(knex, pluginName, pluginGroup) {
	let pluginRelCount = Number((await knex('plugins_rel')
		.leftJoin('chats', 'plugins_rel.chat_id', 'chats.id')
		.leftJoin('plugins', 'plugins_rel.plugin_id', 'plugins.id')
		.where({
			'name': pluginName,
			'chatid': pluginGroup
		})
		.count('*'))[0].count);

	if(pluginRelCount > 0) {
		return true;
	} else {
		return false;
	}
}

function listAllPlugins() {
	return new Promise((resolve, reject) => {
		fs.readdir(path.join(__dirname, 'plugins'), (err, files) => {
			if(err) {
				reject(err);
			}

			if(typeof files === 'undefined') {
				files = [];
			}

			resolve(files.filter((file) => file.indexOf('.') !== 0));
		});
	});
}

async function listRegisteredPlugins(knex) {
	let rows = await knex('plugins');
	return rows;
}

async function addPlugin(knex, pluginName) {
	await knex('plugins').insert({'name': pluginName});
}

async function addAllPlugins(knex) {
	let allPlugins = await listAllPlugins(knex);
	for(let plugin in allPlugins) {
		let thisPlugin = await isPluginExists(knex, allPlugins[plugin]);

		if(!thisPlugin) {
			await addPlugin(knex, allPlugins[plugin]);
		}
	}
}

async function delPlugin(knex, pluginName) {
	await knex('plugins').where('name', pluginName).del();
}

async function delAllPlugins(knex) {
	await knex('plugins').del();
}

async function allowPlugin(knex, pluginName, pluginGroup) {
	let chatRows = await knex('chats').where('chatid', pluginGroup).select('id');
	let pluginRows = await knex('plugins').where('name', pluginName).select('id');

	await knex('plugins_rel').insert({'plugin_id': pluginRows[0].id, 'chat_id': chatRows[0].id});
}

async function denyPlugin(knex, pluginName, pluginGroup) {
	let chatRows = await knex('chats').where('chatid', pluginGroup).select('id');
	let pluginRows = await knex('plugins').where('name', pluginName).select('id');

	await knex('plugins_rel').where({'plugin_id': pluginRows[0].id, 'chat_id': chatRows[0].id}).del();
}

module.exports = {
	isPluginExists,
	isPluginAllowed,
	listAllPlugins,
	listRegisteredPlugins,
	addPlugin,
	addAllPlugins,
	delPlugin,
	delAllPlugins,
	allowPlugin,
	denyPlugin
};
