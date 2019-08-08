let archcaptcha = require('../plugins/archcaptcha/index');

let friendlyName = 'Арчекапча';
let pluginUtils = {};

async function init(utils) {
	pluginUtils = utils;
	await archcaptcha.init(utils);
}

async function exitHandler() {}

async function onNewMessage(bot, msg) {
	try {
		return await archcaptcha.onNewMessage(bot, msg);
	} catch(e) {
		pluginUtils.log(e);
	}
}

module.exports = {
	friendlyName,
	init,
	exitHandler,
	onNewMessage
};
