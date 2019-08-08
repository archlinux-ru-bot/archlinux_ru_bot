let {listRegisteredPlugins, addAllPlugins} = require('./plugin_tools');

let {listPluginsFromRuntime, registerPluginInRuntime,
	unregisterPluginInRuntime, accessPluginFunction} = require('./runtime_plugin_tools');

let PluginUtils = require('./plugin_utils');

async function createTables(knex) {
	let chatsExists = await knex.schema.hasTable('chats');
	if(!chatsExists) {
		await knex.schema.createTable('chats', table => {
			table.increments('id').primary();
			table.bigInteger('chatid').unique();
			table.bigInteger('version').defaultTo(0);
		});
	}

	let profilesExists = await knex.schema.hasTable('profiles');
	if(!profilesExists) {
		await knex.schema.createTable('profiles', table => {
			table.increments('id').primary();
			table.bigInteger('userid').unique();
			table.bigInteger('respects').defaultTo(0);
			table.bigInteger('bans').defaultTo(0);
			table.bigInteger('ibans').defaultTo(0);
			table.bigInteger('suicides').defaultTo(0);
			table.bigInteger('ebans').defaultTo(0);
			table.bigInteger('iebans').defaultTo(0);
			table.bigInteger('rotebans').defaultTo(0);
			table.bigInteger('irotebans').defaultTo(0);
			table.boolean('banned').defaultTo(false);
		});
	}

	let achivkasExists = await knex.schema.hasTable('achivkas');
	if(!achivkasExists) {
		await knex.schema.createTable('achivkas', table => {
			table.increments('id').primary();
			table.text('achivka').unique();
		});
	}

	let achivkasRelExists = await knex.schema.hasTable('achivkas_rel');
	if(!achivkasRelExists) {
		await knex.schema.createTable('achivkas_rel', table => {
			table.integer('profile_id');
			table.integer('achivka_id');
		});
	}

	let usernamesExists = await knex.schema.hasTable('usernames');
	if(!usernamesExists) {
		await knex.schema.createTable('usernames', table => {
			table.increments('id').primary();
			table.text('username').unique();
		});
	}

	let aliasesExists = await knex.schema.hasTable('aliases');
	if(!aliasesExists) {
		await knex.schema.createTable('aliases', table => {
			table.increments('id').primary();
			table.text('alias').unique();
		});
	}

	let aliasesRelExists = await knex.schema.hasTable('aliases_rel');
	if(!aliasesRelExists) {
		await knex.schema.createTable('aliases_rel', table => {
			table.integer('profile_id');
			table.integer('username_id');
			table.integer('alias_id');
		});
	}

	let pluginsExists = await knex.schema.hasTable('plugins');
	if(!pluginsExists) {
		await knex.schema.createTable('plugins', table => {
			table.increments('id').primary();
			table.text('name').unique();
		});
	}

	let pluginsRelExists = await knex.schema.hasTable('plugins_rel');
	if(!pluginsRelExists) {
		await knex.schema.createTable('plugins_rel', table => {
			table.integer('chat_id');
			table.integer('plugin_id');
		});
	}
}

async function initializePlugins(knex, bot) {
	await addAllPlugins(knex);
	let regPlugins = await listRegisteredPlugins(knex);
	for(let pluginNode of regPlugins) {
		try {
			registerPluginInRuntime(pluginNode.name);
			let pluginUtils = new PluginUtils(pluginNode.name);
			await accessPluginFunction(pluginNode.name, 'init', pluginUtils, bot);
		} catch(e) {
			console.log(e);
		}
	}
}

async function uninitializePlugins() {
	for(let pluginName of listPluginsFromRuntime()) {
		try {
			await accessPluginFunction(pluginName, 'exitHandler');
			unregisterPluginInRuntime(pluginName);
		} catch(e) {
			console.log(e);
		}
	}
}

module.exports = {
	createTables,
	initializePlugins,
	uninitializePlugins
};
