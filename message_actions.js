let {getMessageText} = require('./util');

let {payRespect, voteBan} = require('./profile_actions');

const SUICIDE_STICKERS = [
	'AgADYgIAAubOVgw', // https://t.me/addstickers/doyouknowdewey
	'AgADJwADqialFg' // https://t.me/addstickers/alienyum
];

const ORU_ANSWERS = [
	'Не ори, денег не будет',
	'Прекрати, соседей разбудишь!',
	'Предъявите карточку на ор',
	'Карточку на ор предъявите',
	'Карточку на ор предъявляем, очередь не задерживаем!',
	'Ор у нас только по карточкам!',
	'Ор у нас по карточкам, карточки по талонам, а за талонами в электронную очередь к бабе Зине по билетам из терминала.',
	'Нелицензионный ор. Штраф 5000 рублей.',
	'Нелицензионный ор. Штраф 5000 рублей 30 копеек.',
	'DRM Error: No license for this OR',
	'Ты у меня допрыгаешься, по краю ходишь. Еще один ор и по этапу пойдешь.',
	'Нарушение 282 УК РФ: 5 лет строгача за ор.',
	'10 лет строгача за рецидив',
	'Полный хохотач. Ставим классы!'
];

let RespectPreviousMessage = {};
let BanPreviousMessage = {};

async function payRespectByKeyword(knex, bot, ctx, msg, next) {
	if((typeof msg.text !== 'undefined' && /^(?:F|Ф)$/i.test(msg.text)) ||
	(typeof msg.sticker !== 'undefined' && msg.sticker.set_name === 'FforRespect')) {
		if(!msg.reply_to_message) {
			msg.reply_to_message = RespectPreviousMessage[msg.chat.id];
		}

		if(!msg.reply_to_message ||
			msg.from.id === msg.reply_to_message.from.id) {
			next(ctx);
			return;
		}

		await payRespect(knex, bot, msg, 1);
	} else {
		next(ctx);
		RespectPreviousMessage[msg.chat.id] = msg;
	}
}

async function voteBanByKeyword(knex, bot, ctx, msg, next) {
	let test_regex_full = new RegExp(
		'^(?:[^A-Za-zА-Яа-яЁё0-9_]*(?:(?:раз|анти)?банб?|(?:un|anti)?banb?)[^A-Za-zА-Яа-яЁё0-9_]*)+$',
		'i');

	let test_regex = new RegExp(
		'(?<=[^A-Za-zА-Яа-яЁё0-9_]|^)(?:это?(?: сразу)? |(?:я ?)?за ?)(?:(?:раз|анти)?банб?|(?:un|anti)?banb?)(?=[^A-Za-zА-Яа-яЁё0-9_]|$)',
		'i');

	let test_regex_for = new RegExp(
		'(?<=[^A-Za-zА-Яа-яЁё0-9_]|^)(?:(?:раз|анти)?банб?|(?:un|anti)?banb?) (?:за|по причине)(?=[^A-Za-zА-Яа-яЁё0-9_]|$)',
		'i');

	let ban_regex = new RegExp(
		'(?<=[^A-Za-zА-Яа-яЁё0-9_]|^)(?:я?за)?(?:банб?|banb?)(?=[^A-Za-zА-Яа-яЁё0-9_]|$)',
		'gi');

	let unban_regex = new RegExp(
		'(?<=[^A-Za-zА-Яа-яЁё0-9_]|^)(?:я?за)?(?:(?:раз|анти)банб?|(?:un|anti)banb?)(?=[^A-Za-zА-Яа-яЁё0-9_]|$)',
		'gi');

	let ban_match = null;
	let unban_match = null;

	if(typeof msg.text !== 'undefined') {
		ban_match = msg.text.match(ban_regex);
		unban_match = msg.text.match(unban_regex);
	}

	if(typeof msg.text !== 'undefined' &&
	(test_regex_full.test(msg.text) || test_regex.test(msg.text)
	|| test_regex_for.test(msg.text)) && (ban_match || unban_match)) {
		if(!msg.reply_to_message) {
			msg.reply_to_message = BanPreviousMessage[msg.chat.id];
			msg.previous_message = true;
		}

		if(!msg.reply_to_message ||
			(msg.previous_message &&
				msg.from.id === msg.reply_to_message.from.id)) {
			next(ctx);
			return;
		}

		let ban_number = (ban_match || []).length;
		let unban_number = (unban_match || []).length;

		await voteBan(knex, bot, msg, ban_number - unban_number);
	} else if(typeof msg.sticker !== 'undefined' && SUICIDE_STICKERS.includes(msg.sticker.file_unique_id)) {
		msg.reply_to_message = msg;
		await voteBan(knex, bot, msg, 1);
	} else {
		next(ctx);
		BanPreviousMessage[msg.chat.id] = msg;
	}
}

async function orReaction(bot, msg) {
	if(new RegExp(
		'(?:[^A-Za-zА-Яа-яЁё0-9_]|^)(?:о+р+у*|орнул)(?:[^A-Za-zА-Яа-яЁё0-9_]|$)',
		'i').test(getMessageText(msg))) {
		return await bot.sendMessage(msg.chat.id, Array.random(ORU_ANSWERS) , {
			parse_mode: 'HTML',
			reply_to_message_id: msg.message_id
		});
	}
}

module.exports = {
	payRespectByKeyword,
	voteBanByKeyword,
	orReaction
};
