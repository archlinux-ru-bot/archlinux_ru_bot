let util = require('util');
let exec = util.promisify(require('child_process').exec);
let config = require('./config');

let {isChatExists, getChat, addChat,
	updateChat} = require('./chat_tools');

let {listPluginsFromRuntime, getPluginFromRuntime} = require('./runtime_plugin_tools');

const CURRENT_VERSION = 1608469360645;

const UPDATE_TEXT =
`<b>Новое в этой версии:</b>
* Используется кастомный поллинг, чтобы избегать зависаний
* Исправлено определение стикеров суицида
* Добавлен еще один стикер суицида`;

let UpdateNotificationLocks = {};

async function showAbout(bot, msg) {
	let text =
`Этот бот был сделан для внесения разнообразия при общении в арчеконфе.
Вы можете добавить его в свою группу и наслаждаться.
Если возникли какие либо проблемы - пишите @IlyaFedin.
Исходники доступны по адресу https://github.com/archlinux-ru-bot/archlinux_ru_bot.`;

	return await bot.sendMessage(msg.chat.id, text, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function showHelp(bot, msg) {
	let text =
`/F@${bot.me.username} - Отдать честь
/ban@${bot.me.username} - Проголосовать за бан
/voteban@${bot.me.username} - Проголосовать за бан
/voteeban@${bot.me.username} - Проголосовать за eban
/vroteban@${bot.me.username} - Сделать vroteban
/ln@${bot.me.username} - Сделать ссылку на ник пользователя
/unlink@${bot.me.username} - Удалить ссылку на ник пользователя
/mkachivka@${bot.me.username} - Добавить ачивку пользвателю
/rmachivka@${bot.me.username} - Удалить ачивку пользвателю
/profile@${bot.me.username} - Посмотреть свой или чужой профиль
/me@${bot.me.username} - Аналог команды /me из IRC/ICQ/Jabber
/vzhuh@${bot.me.username} - Вжух-кот с опциональным сообщением
/meow@${bot.me.username} - Котики
/ping@${bot.me.username} - Проверка присутствия
/hostinfo@${bot.me.username} - Проверить инстанс на арчерийность
/inlinehelp@${bot.me.username} - Инструкция по использованию бота в inline-режиме
/help@${bot.me.username} - Доступные команды
/about@${bot.me.username} - О боте`;

	for(let pluginName of listPluginsFromRuntime()) {
		text += `\n/${pluginName}@${bot.me.username} - Плагин <b>${getPluginFromRuntime(pluginName).friendlyName}</b>`;
	}

	return await bot.sendMessage(msg.chat.id, text, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function showInlineHelp(bot, msg) {
	let text =
`У бота, на данный момент, есть 4 inline-функции:
* <b>Markdown</b> - отправить сообщение в разметке Markdown (разметка Markdown для ботов отличается от разметки Markdown для клиентов Telegram, см. https://core.telegram.org/bots/api#markdown-style)
* <b>HTML</b> - отправить сообщение в разметке HTML (см. https://core.telegram.org/bots/api#html-style)
* <b>/me (HTML)</b> - отправить сообщение в стиле команды /me из IRC/ICQ/Jabber,  можно использовать HTML
* <b>Вжух (HTML)</b> - рисуется вжух-кот в ASCII, после него - сообщение в разметке HTML

В дополнение к стандартной разметке ботов, в бота встроен парсер для зачеркивания текста, использовать его можно с помощью <code>~~</code> для Markdown и <code>${'<s></s>'.htmlspecialchars()}</code> для HTML, например:
<pre>
Надо было ставить ~FreeBSD~ Linux
Надо было ставить ${'<s>FreeBSD</s>'.htmlspecialchars()} Linux
</pre>

Кроме того, в inline-режиме прилинкованные юзернеймы (см. /ln@${bot.me.username}) ссылаются, собственно, на прилинкованные профили.

Подробнее об inline-режиме: https://core.telegram.org/bots/inline`;

	return await bot.sendMessage(msg.chat.id, text, {
		parse_mode: 'HTML',
		disable_web_page_preview: true,
		reply_to_message_id: msg.message_id
	});
}

async function showAdminHelp(bot, msg) {
	if(!config.admin_ids.includes(msg.from.id)) {
		return;
	}

	let text =
`/realban@${bot.me.username} - Забанить бота для человека`;

	return await bot.sendMessage(msg.chat.id, text, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function showHostInfo(bot, msg) {
	let distroVersion = '';
	let pacmanVersion = '';
	let isHostedOnArch = true;
	let messageText = '';

	try {
		distroVersion = (await exec('lsb_release -a')).stdout;
	} catch(e) {
		isHostedOnArch = false;
	}

	try {
		pacmanVersion = (await exec('pacman -V')).stdout;
	} catch(e) {
		isHostedOnArch = false;
	}

	if(distroVersion.length > 0) {
		messageText += `<pre>${distroVersion.htmlspecialchars()}</pre>`;
	}

	if(pacmanVersion.length > 0) {
		if(messageText.length > 0) {
			messageText += '\n';
		}

		messageText += `<pre>${pacmanVersion.htmlspecialchars()}</pre>`;
	}

	if(distroVersion.length > 0 && !/Arch Linux/.test(distroVersion)) {
		isHostedOnArch = false;
	}

	if(pacmanVersion.length === 0) {
		isHostedOnArch = false;
	}

	if(messageText.length > 0) {
		messageText += '\n';
	}

	if(isHostedOnArch) {
		messageText += '<b>Итог:</b> бот <b>является</b> истинно-арчерийским';
	} else {
		messageText += '<b>Итог:</b> бот <b>не является</b> истинно-арчерийским';
	}

	return await bot.sendMessage(msg.chat.id, messageText, {
		parse_mode: 'HTML',
		reply_to_message_id: msg.message_id
	});
}

async function showUpdateNotification(knex, bot, msg) {
	if(UpdateNotificationLocks[msg.chat.id]) {
		return;
	}

	UpdateNotificationLocks[msg.chat.id] = true;

	let answerMessage = null;
	let chatExists = await isChatExists(knex, msg.chat.id);

	if(!chatExists && msg.chat.type !== 'private') {
		await addChat(knex, msg.chat.id);
	}

	let chat = await getChat(knex, msg.chat.id);

	if(typeof chat.chatid === 'undefined') {
		return;
	}

	if(chat.version < CURRENT_VERSION) {
		await bot.sendMessage(msg.chat.id, UPDATE_TEXT, {
			parse_mode: 'HTML'
		});

		answerMessage = await updateChat(knex, chat.chatid, CURRENT_VERSION);
	}

	delete UpdateNotificationLocks[msg.chat.id];

	return answerMessage;
}

module.exports = {
	showAbout,
	showHelp,
	showInlineHelp,
	showAdminHelp,
	showHostInfo,
	showUpdateNotification
};
