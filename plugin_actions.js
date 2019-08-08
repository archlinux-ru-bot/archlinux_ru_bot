let {isPluginAllowed, allowPlugin, denyPlugin} = require('./plugin_tools');
let {listPluginsFromRuntime, getPluginFromRuntime, accessPluginFunction, getPluginMonopolyAccess} = require('./runtime_plugin_tools');
let config = require('./config');

function transformPluginCommand(msg, botUsername, pluginName) {
	let message = Object.assign({}, msg);

	if(message.text) {
		message.text = message.text.replace(new RegExp(`^/${pluginName}@${botUsername} `, 'i'), '');
		message.text = `/${message.text}`;

		let spaceIndex = message.text.indexOf(' ');

		if(spaceIndex === -1) {
			message.entities[0].length = `${message.text}@${botUsername}`.length;
			message.text = `${message.text}@${botUsername}`;
		} else {
			message.entities[0].length = `${message.text.substring(0, spaceIndex)}@${botUsername}`.length;
			message.text = `${message.text.substring(0, spaceIndex)}@${botUsername}${message.text.substring(spaceIndex, message.text.length)}`;
		}
	}

	return message;
}

async function showPluginStatus(knex, bot, msg, pluginName) {
	let pluginObj = getPluginFromRuntime(pluginName);
	let allowed = await isPluginAllowed(knex, pluginName, msg.chat.id);

	if(allowed) {
		return await bot.sendMessage(msg.chat.id,
			`Плагин <b>${pluginObj.friendlyName}</b> активирован в этой группе.

Для деактивации дайте команду <code>/${pluginName}@${bot.me.username} disable</code>.
Также, вы можете запросить справку плагина по <code>/${pluginName}@${bot.me.username} help</code>.

Учтите, для того, чтобы команда дошла до плагина, необходимо отправлять команды как аргумент команды <code>/${pluginName}@${bot.me.username}</code>, выше дан пример с <code>/help</code>, остальные - по аналогии.`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	} else {
		return await bot.sendMessage(msg.chat.id,
			`Плагин <b>${pluginObj.friendlyName}</b> не активирован в этой группе

Для активации дайте команду <code>/${pluginName}@${bot.me.username} enable</code>.`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
	}
}

async function changePluginStatus(knex, bot, msg, pluginName, action) {
	let pluginObj = getPluginFromRuntime(pluginName);
	let admins = await bot.getChatAdministrators(msg.chat.id);
	let isChatAdmin = admins.filter((admin) =>
		admin.user.id === msg.from.id).length > 0;

	if(!isChatAdmin && !config.admin_ids.includes(msg.from.id)) {
		return await bot.sendMessage(msg.chat.id, '<b>Ошибка:</b> недостаточно прав', {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}

	if(action === 'enable') {
		try {
			await allowPlugin(knex, pluginName, msg.chat.id);

			return await bot.sendMessage(msg.chat.id,
				`Плагин <b>${pluginObj.friendlyName}</b> успешно активирован в этой группе.

Вы можете запросить справку плагина по <code>/${pluginName}@${bot.me.username} help</code>.

Учтите, для того, чтобы команда дошла до плагина, необходимо отправлять команды как аргумент команды <code>/${pluginName}@${bot.me.username}</code>, выше дан пример с <code>/help</code>, остальные - по аналогии.`, {
					parse_mode: 'HTML',
					reply_to_message_id: msg.message_id
				});
		} catch(e) {
			if(e.message === 'Already allowed') {
				return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> плагин <b>${pluginObj.friendlyName}</b> уже активирован в этой группе`, {
					parse_mode: 'HTML',
					reply_to_message_id: msg.message_id
				});
			} else {
				throw e;
			}
		}
	} else if(action === 'disable') {
		try {
			await denyPlugin(knex, pluginName, msg.chat.id);
			return await bot.sendMessage(msg.chat.id, `Плагин <b>${pluginObj.friendlyName}</b> успешно деактивирован в этой группе`, {
				parse_mode: 'HTML',
				reply_to_message_id: msg.message_id
			});
		} catch (e) {
			if(e.message === 'Already denied') {
				return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> плагин <b>${pluginObj.friendlyName}</b> уже деактивирован в этой группе`, {
					parse_mode: 'HTML',
					reply_to_message_id: msg.message_id
				});
			} else {
				throw e;
			}
		}
	}
}

async function sendToPlugins(knex, bot, msg, definedPlugins) {
	let sendPlugins = [];

	if(definedPlugins) {
		sendPlugins = definedPlugins;
	} else {
		sendPlugins = listPluginsFromRuntime();
	}

	for(let pluginIterator in sendPlugins) {
		void async function() {
			let pluginName = sendPlugins[pluginIterator];
			let pluginObj = getPluginFromRuntime(pluginName);
			let monopolyAccess = getPluginMonopolyAccess(msg.chat.id, msg.from.id);

			if(monopolyAccess !== pluginName && monopolyAccess !== null) {
				return;
			} else if(monopolyAccess === pluginName) {
				return await accessPluginFunction(pluginName, 'onNewMessage', bot, msg);
			}

			if(new RegExp(`^/${pluginName}@${bot.me.username} (enable|disable)$`, 'i').test(msg.text)) {
				let action = msg.text.replace(new RegExp(`^/${pluginName}@${bot.me.username} (enable|disable)$`, 'i'), '$1').toLowerCase();

				return await changePluginStatus(knex, bot, msg, pluginName, action);
			} else if(new RegExp(`^/${pluginName}@${bot.me.username}$`, 'i').test(msg.text)) {
				return await showPluginStatus(knex, bot, msg, pluginName);
			} else if(new RegExp(`^/${pluginName}@${bot.me.username}`, 'i').test(msg.text)) {
				let allowed = await isPluginAllowed(knex, pluginName, msg.chat.id);

				if(allowed) {
					return await accessPluginFunction(pluginName, 'onNewMessage', bot, transformPluginCommand(msg, bot.me.username, pluginName));
				} else {
					return await bot.sendMessage(msg.chat.id, `<b>Ошибка:</b> плагин <b>${pluginObj.friendlyName}</b> не активирован в этой группе`, {
						parse_mode: 'HTML',
						reply_to_message_id: msg.message_id
					});
				}
			} else if(/^\//.test(msg.text)) {
				return;
			} else {
				let allowed = await isPluginAllowed(knex, pluginName, msg.chat.id);

				if(allowed) {
					return await accessPluginFunction(pluginName, 'onNewMessage', bot, msg);
				}
			}
		}();
	}
}

module.exports = {
	transformPluginCommand,
	showPluginStatus,
	changePluginStatus,
	sendToPlugins
};
