let Plugins = {};
let MessageMonopolyAccess = [];

function listPluginsFromRuntime() {
	return Object.keys(Plugins);
}

function getPluginFromRuntime(pluginName) {
	return Plugins[pluginName];
}

function registerPluginInRuntime(pluginName) {
	Plugins[pluginName] = require(`./plugins/${pluginName}`);
}

function unregisterPluginInRuntime(pluginName) {
	delete Plugins[pluginName];
}

async function accessPluginFunction(pluginName, functionName, ...functionArgs) {
	try {
		return await getPluginFromRuntime(pluginName)[functionName](...functionArgs);
	} catch(e) {
		logForPlugin(pluginName, e);
	}
}

function logForPlugin(pluginName, ...message) {
	let prefixiedMessage = message
		.join(' ')
		.split('\n')
		.map(line => `${pluginName}: ${line}`)
		.join('\n');

	console.log(prefixiedMessage);
}

function getPluginMonopolyAccess(chatId, userId) {
	let thisMonopolyAccess = MessageMonopolyAccess.filter(item =>
		item.chat_id === chatId && item.user_id === userId);

	if(thisMonopolyAccess.length > 0) {
		return thisMonopolyAccess[0].plugin_name;
	} else {
		return null;
	}
}

function registerPluginMonopolyAccess(pluginName, chatId, userId) {
	if(MessageMonopolyAccess.some(item =>
		item.plugin_name === pluginName && item.chat_id === chatId && item.user_id === userId)) {
		throw new Error('Messages of this user is already in monopoly access by this plugin');
	}

	if(MessageMonopolyAccess.some(item =>
		item.chat_id === chatId && item.user_id === userId)) {
		throw new Error('Messages of this user is already in monopoly access');
	}

	MessageMonopolyAccess.push({
		plugin_name: pluginName,
		chat_id: chatId,
		user_id: userId
	});
}

function unregisterPluginMonopolyAccess(pluginName, chatId, userId) {
	if(!MessageMonopolyAccess.some(item =>
		item.chat_id === chatId && item.user_id === userId)) {
		throw new Error('Messages of this user is not in monopoly access');
	}

	let accessIdx = MessageMonopolyAccess.findIndex(item =>
		item.plugin_name === pluginName && item.chat_id === chatId && item.user_id === userId);

	if(accessIdx === -1) {
		throw new Error('Messages of this user is not in monopoly access by this plugin');
	}

	MessageMonopolyAccess.splice(accessIdx, 1);
}

module.exports = {
	listPluginsFromRuntime,
	getPluginFromRuntime,
	registerPluginInRuntime,
	unregisterPluginInRuntime,
	getPluginMonopolyAccess,
	accessPluginFunction,
	logForPlugin,
	registerPluginMonopolyAccess,
	unregisterPluginMonopolyAccess
};
