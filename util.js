String.prototype.toTitleCase = function() {
	return this
		.split(' ')
		.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
		.join(' ');
};

String.prototype.htmlspecialchars = function() {
	return this
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
};

String.prototype.extendFormatting = function(mode) {
	let result = this;
	let match = result.match(/.*/i);

	if(mode === 'html') {
		match = result.match(/<s>.*?<\/s>/i);
	} else if(mode === 'markdown') {
		match = result.match(/~.*?~/i);
	}

	while(match !== null) {
		let startIndex = match.index;
		let endIndex = startIndex + match[0].length;

		let replaced = '';
		if(mode === 'html') {
			replaced = result.substring(startIndex, endIndex)
				.replace(/<s>(.*?)<\/s>/i, '$1')
				.replace(/./g, '$&\u0336');
		} else if(mode === 'markdown') {
			replaced = result.substring(startIndex, endIndex)
				.replace(/~(.*?)~/i, '$1')
				.replace(/./g, '$&\u0336');
		}

		result = result.substring(0, startIndex) + replaced + result.substring(endIndex, result.length);

		if(mode === 'html') {
			match = result.match(/<s>.*?<\/s>/i);
		} else if(mode === 'markdown') {
			match = result.match(/~.*?~/i);
		}
	}
	return result;
};

RegExp.quote = function(str) {
	return str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
};

Array.random = function(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
};

function getArgs(text, num) {
	let argSplit = text.split(' ');
	argSplit.splice(0, 1);

	argSplit = argSplit.map(item => item.trim());
	argSplit = argSplit.filter(item => item.length !== 0);

	let argSplice = argSplit.splice(0, num-1);
	return argSplice.concat(argSplit.join(' '));
}

function getName(msg) {
	if(msg.from.last_name) {
		return `${msg.from.first_name} ${msg.from.last_name}`.htmlspecialchars();
	} else {
		return msg.from.first_name.htmlspecialchars();
	}
}

function getMessageText(msg) {
	if(typeof msg.text !== 'undefined') {
		return msg.text;
	} else if(typeof msg.caption !== 'undefined') {
		return msg.caption;
	} else {
		return '';
	}
}

module.exports = {
	getArgs,
	getName,
	getMessageText
};
