let {logForPlugin, registerPluginMonopolyAccess, unregisterPluginMonopolyAccess} = require('./runtime_plugin_tools');

class PluginUtils {
	constructor(pluginName) {
		this.pluginName = pluginName;
	}

	log(...message) {
		logForPlugin(this.pluginName, ...message);
	}

	addMonopolyAccess(chatId, userId, waitForFree) {
		if(waitForFree === true) {
			return new Promise((resolve, reject) => {
				void async function waitForMonopolyAccess(pluginName, chatId, userId, resolve, reject) {
					try {
						registerPluginMonopolyAccess(pluginName, chatId, userId);
						resolve();
					} catch(e) {
						if(e.message === 'Messages of this user is already in monopoly access') {
							waitForMonopolyAccess(pluginName, chatId, userId, resolve, reject);
						} else {
							reject(e);
						}
					}
				}(this.pluginName, chatId, userId, resolve, reject);
			});
		} else {
			registerPluginMonopolyAccess(this.pluginName, chatId, userId);
		}
	}

	delMonopolyAccess(chatId, userId) {
		unregisterPluginMonopolyAccess(this.pluginName, chatId, userId);
	}
}

module.exports = PluginUtils;
