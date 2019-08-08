let axios = require('axios');

function doVzhuh(input) {
	let vzhuh = `<pre> ∧＿∧
( ･ω･｡)つ━☆・*。
⊂  ノ    ・゜+.
しーＪ   °。+ *´¨)
         .· ´¸.·*´¨) ¸.·*¨)
          (¸.·´ (¸.·'* ☆</pre>
${input}`;

	return vzhuh;
}

async function getCat() {
	let response = await axios('http://thecatapi.com/api/images/get?format=src&type=gif', {
		responseType: 'stream'
	});

	return response.data;
}

module.exports = {
	doVzhuh,
	getCat
};
