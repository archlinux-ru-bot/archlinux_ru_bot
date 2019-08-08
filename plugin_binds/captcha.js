let captcha = require('../plugins/captcha/index');

let friendlyName = 'Капча';
let pluginUtils = {};

async function init(utils) {
	pluginUtils = utils;
	await captcha.init(utils);
}

async function exitHandler() {}

async function onNewMessage(bot, msg) {
	try {
		return await captcha.onNewMessage(bot, msg);
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
