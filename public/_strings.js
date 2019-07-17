'use strict';

const a_str_crt_usr = [
	'※ まだ開発途中であるため、未実装の機能が多いです！',
	'・「ユーザー名」は右側のメニュー「▼」で変更可能です。',
	'・ユーザー名は決定後、30分間変更できません。',
	'・このサイトは点数制で、メニュー上に点数が表示されています。',
	'・言動が良くない人には「-1点」を付与することができます。その場合、自分にも「-1点」が付与されます。',
	'・逆に言動が良い人には「+1点」を付与することができます。この場合も、自分に「-1点」が付与されます。',
	'・点数は０点より増えることはありません。',
	'・点数を付与できるのは１分につき１回です。同じユーザーに対しては5分につき１回です。',
	'・点数は10分毎に１点ずつ回復します。',
	'・点数が-5点に達したら、２時間だけアクセス禁止とします。イライラするのは辛いことだと思いますので、しばらくゆっくりして欲しい、という願いです。'
];

function Create_e_str_div(a_str) {
	const e_str_div = document.createElement('div');

	let b_1st_str = true;
	for (let str of a_str) {
		if (b_1st_str) {
			b_1st_str = false;
		} else {
			e_str_div.appendChild(document.createElement('br'));
		}
		e_str_div.appendChild(document.createTextNode(str));
	}
	return e_str_div;
}

