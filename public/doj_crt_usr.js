'use strict';

const str_ver = 'ver 0.6.3';

// js の仮数部は、52bits
// uview： ユーザ設定  反映中設定   id
//　　　　　fff        fff         ff (<-32bits)
// 一応、上位 16bit は、予約領域としておく

const Doj_Char_Pick = function() {
	let m_idx_focus = 0;
	this.Get_idx_focus = () => m_idx_focus;

	const m_e_ico_stg = document.createElement('div');
	m_e_ico_stg.classList.add('chr_pick_stg');
	this.e_lump = m_e_ico_stg;

	// +++++++++++++++++++++++++++
	// イメージ数を増やす場合は、server.js の c_MAX_Idx_uview を変更することを忘れないこと
	const ma_img_fname = [['girl_2', '55e'], ['cat', '7bd'], ['girl','d90']
		, ['cherry', 'c40'], ['tulip', 'ca0'], ['squirrel', 'a50'], ['dog', '390']];
	const m_img_pcs = ma_img_fname.length;

	const ma_e_img = new Array(m_img_pcs);  // リサイズに利用される
	const ma_e_img_raw = new Array(m_img_pcs);  // 2値の img（背景色,border,shadow もない素の状態）
	const ma_e_img_black = new Array(m_img_pcs);
	const ma_color = new Array(m_img_pcs);  // 後で色変更があった場合は、この配列の値を変更する

	for (let idx = 0; idx < m_img_pcs; idx++) {
		// アイコンデータの読み込み
		const e_img = new Image(g_stt.icoSz_Rm, g_stt.icoSz_Rm);
		e_img.src = './_images/' + ma_img_fname[idx][0] + '.png';
		ma_e_img_raw[idx] = e_img.cloneNode(false);  // ma_e_img_raw は img 要素となる

		const str_bg_cl = ma_img_fname[idx][1];;

		// アイコン画像の生成
		const e_ico_div = document.createElement('div');
		e_ico_div.style.margin = '3px 0.4em';
		m_e_ico_stg.appendChild(e_ico_div);

		const e_ico_img_div = document.createElement('div');
		e_ico_div.appendChild(e_ico_img_div);

		e_ico_img_div.style.position = 'relative';
		e_ico_img_div.style.lineHeight = '5px';  // これがないと、div ボックスの下側が少し伸びてしまう

		e_img.classList.add('rm_icon');
		e_img.style.background = '#' + ma_img_fname[idx][1];
		e_ico_img_div.appendChild(e_img);

		const e_img_black = document.createElement('div');
		e_img_black.classList.add('rm_icon_mask__chr_pick');
		e_ico_img_div.appendChild(e_img_black);

		ma_color[idx] = parseInt(ma_img_fname[idx][1], 16);
		ma_e_img[idx] = e_img;
		ma_e_img_black[idx] = e_img_black;

		e_img_black.onclick = () => {
			ma_e_img[m_idx_focus].style.boxShadow
				= '3px 3px 3px rgba(0, 0, 0, 0.5), inset -3px -3px 3px rgba(255, 255, 255, 0.3)';
			ma_e_img_black[m_idx_focus].hidden = false;

			ma_e_img[idx].style.boxShadow = '3px 3px 3px 4px #' + ma_color[idx].toString(16)
											+ ', inset -3px -3px 3px rgba(255,255,255, 0.3)';
			ma_e_img_black[idx].hidden = true;

			m_idx_focus = idx;
			g_doj_crt_usr.Set_uview(ma_color[m_idx_focus] * 256 + m_idx_focus);
		};
	}

	ma_e_img_black[0].hidden = true;
	ma_e_img[0].style.boxShadow
		= '3px 3px 3px 4px #' + ma_color[0].toString(16) + ', inset -3px -3px 3px rgba(255,255,255, 0.3)';
	g_doj_crt_usr.Set_uview(ma_color[0] * 256 + 0);


	/////////////////////////////////////////////////////////
	this.Resize = (font_px) => {
		const new_icoSz_Rm = g_stt.icoSz_Rm;

		if (g_doj_room.IsOpen()) {
			g_Room_Voices.Resize();
		} else {
			g_view_Lobby.Resize();
		}

		// e_img は img 要素
		for (const e_img of ma_e_img) {
			e_img.height = new_icoSz_Rm;
			e_img.width = new_icoSz_Rm;
		}

		// e_img_blk は div 要素
		for (const e_img_blk of ma_e_img_black) {
			e_img_blk.style.height = new_icoSz_Rm.toString() + 'px';
			e_img_blk.style.width = new_icoSz_Rm.toString() + 'px';
		}
	};

	this.Show = () => { m_e_ico_stg.style.display = 'flex'; };
	this.Hide = () => { m_e_ico_stg.style.display = 'none'; };

	// チャット参加前の、アイコン設定時の色変更ハンドラ
	this.RCP_Set_Cl = (val_RGB, str_RGB) => {
		ma_color[m_idx_focus] = val_RGB;

		ma_e_img[m_idx_focus].style.background = '#' + str_RGB;
		ma_e_img[m_idx_focus].style.boxShadow
			= '3px 3px 3px 4px #' + str_RGB + ', inset -3px -3px 3px rgba(255,255,255, 0.3)';
		g_doj_crt_usr.Set_uview(val_RGB * 256 + m_idx_focus);
	};

	// -------------------------------------
	// img 要素を返す
	this.GetCln_e_icon_Lby = (uview) => {
		const ix_icon = uview & 0xff;
		const e_ret = ma_e_img_raw[ix_icon].cloneNode(false);
		e_ret.classList.add('icon_Lobby');  // 白枠 & margin
		
		e_ret.height = g_stt.icoSz_Lby;
		e_ret.width = g_stt.icoSz_Lby;

		const bg_color = (uview & 0xfff00) >>> 8;
		e_ret.style.backgroundColor = '#' + ('00' + bg_color.toString(16)).substr(-3);
		return e_ret;
	};

	// -------------------------------------
	// img 要素を返す
	this.GetCln_e_icon_Rm = (uview) => {
		const ix_icon = uview & 0xff;
		const e_ret = ma_e_img_raw[ix_icon].cloneNode(false);
		e_ret.classList.add('rm_icon');  // 白枠 ＆ 影

		e_ret.height = g_stt.icoSz_Rm;
		e_ret.width = g_stt.icoSz_Rm;

		const bg_color = (uview & 0xfff00) >>> 8;
		e_ret.style.backgroundColor = '#' + ('00' + bg_color.toString(16)).substr(-3);
		return e_ret;
	};
};


const Doj_CreateUser = function() {
	// m_uID は将来的に削除する
//	let m_uID = -1;  // 'DN_crtd_usr' にて、サーバーから割り当てられる
//	this.Get_uID = () => m_uID;  // deprecated

	// m_uname は内部処理用にのみに利用することに変更した
	let m_uname = null;
//	this.Get_uname = () => m_uname;  // deprecated

	let m_uview = 0;
	this.Get_uview = () => m_uview;
	// この Set_uview は、自分の uview を変更するという意味
	// そのため、常に ref_cl == cur_cl となるように cur_cl を ref_cl にコピーする
	this.Set_uview = (uview) => {
		const val_ref_RGB = (uview & 0xfff00) << 12;
		uview &= 0xffff000fffff;  // 送られてきた uview の ref_cl 部分をクリア
		m_uview = (m_uview & 0xffff00000000) | val_ref_RGB | uview;
	};

	// -------------------------------------
	const m_e_frm = document.createElement('div');
	m_e_frm.classList.add('crt_usr_frm');
	this.e_lump = m_e_frm;

	const m_e_frm_ttl = Create_TxtDiv(m_e_frm, 'アイコンと名前を決めてチャットに参加！　');
	m_e_frm_ttl.style.marginBottom = '0.8em';

	// 最小化ボタン
	const m_e_btn_minz = Create_Btn(m_e_frm_ttl, '最小化');
	m_e_btn_minz.style.cssFloat = 'right';
	m_e_btn_minz.onclick = OnClickBtn_minz;

	// 色の変更
	const m_e_btn_chg_cl = Create_Btn(m_e_frm_ttl, '色の変更');
	m_e_btn_chg_cl.style.cssFloat = 'right';
	m_e_btn_chg_cl.style.marginRight = '1em';
	m_e_btn_chg_cl.onclick = () => {
		g_doj_color.Set_uview(m_uview);
		g_doj_color.Show(m_doj_char_pick.RCP_Set_Cl, '　現在の色');
	};

	// 名前入力欄
	const m_e_zn_name_ipt = document.createElement('div');
	m_e_zn_name_ipt.style.margin = '1em 0px';
	m_e_frm.appendChild(m_e_zn_name_ipt);

	const m_e_btn = Create_Btn(m_e_zn_name_ipt, 'チャットに参加！');
	m_e_btn.onclick = CreateUser;
	m_e_btn.disabled = true;
	m_e_btn.style.marginRight = '15px';

	const m_e_input = document.createElement('input');
	m_e_input.classList.add('crt_usr_ipt_uname');
	m_e_input.placeholder = '名前を入れてね（10文字まで）';
	m_e_input.value = '';
	m_e_input.onkeyup = OnKeyUp_uname;
	m_e_zn_name_ipt.appendChild(m_e_input);

	// version 表示
	const m_e_zn_ver = document.createElement('div');
	m_e_zn_ver.style.cssFloat = 'right';
	m_e_zn_ver.style.fontSize = '0.8em';
	m_e_zn_name_ipt.appendChild(m_e_zn_ver);

	m_e_zn_ver.appendChild(document.createTextNode(str_ver));
	m_e_zn_ver.appendChild(document.createElement('br'));
	const m_e_ipt_supass = document.createElement('input');
	m_e_ipt_supass.placeholder = '管理用PW';
	m_e_ipt_supass.style.width = '8em';
	m_e_zn_ver.appendChild(m_e_ipt_supass);

	m_e_ipt_supass.value = 'abcde';


	// サイトディスクリプション
	const m_e_description = Create_e_str_div(a_str_crt_usr);
	m_e_description.classList.add('site_description');
	m_e_frm.appendChild(m_e_description);

	// -------------------------------------
	function OnKeyUp_uname() {
		const len = m_e_input.value.trim().length;
		if (len == 0 || len > 10) {
			m_e_btn.disabled = true;
		} else {
			m_e_btn.disabled = false;
		}
	}

	let b_minz = false;
	let m_doj_char_pick = null;
	function OnClickBtn_minz() {
		if (b_minz) {
			// 元に戻す処理
//			m_e_frm_ttl.hidden = false;
			m_e_btn_chg_cl.hidden = false;
			m_doj_char_pick.Show();
			m_e_zn_name_ipt.hidden = false;
			m_e_description.hidden = false;
			m_e_btn_minz.textContent = '最小化';

			m_e_frm.style.left = '1em';
			b_minz = false;
		} else {
			// 最小化の処理
//			m_e_frm_ttl.hidden = true;
			m_e_btn_chg_cl.hidden = true;
			m_doj_char_pick.Hide();
			m_e_zn_name_ipt.hidden = true;
			m_e_description.hidden = true;
			m_e_btn_minz.textContent = '元に戻す';

			m_e_frm.style.left = 'auto';
			b_minz = true;
		}
	}

	////////////////////////////////////////
	// メソッド
	this.Focused = () => { m_e_input.focus(); };

	this.Show = () => { m_e_frm.hidden = false; }
	this.Hide = () => { Hide(); }
	function Hide() {
		m_e_frm.hidden = true;
	}

	this.Apnd_CharPick = (doj) => {
		m_doj_char_pick = doj;
		m_e_frm.insertBefore(doj.e_lump, m_e_zn_name_ipt)
	};

	// -------------------------------------
	function CreateUser() {
		m_uname = m_e_input.value.trim();
		const len = m_uname.length;
		if (len === 0 || len > 10) { return; }

		Hide();

g_DBG_F('UP_new_usr');

		g_socketio.emit('UP_new_usr', [m_e_ipt_supass.value, m_uname, m_uview]);
	}
	
	this.Rcv_DN_Crtd_Usr = (new_uID) => {
//		m_uID = new_uID;

		g_my_uID = new_uID;
		g_my_uname = m_uname;

		// トピックバインダが複数個になったときには注意
		g_doj_topic_bindr.Enabled();
	}
}


// 接続状態の IPで、c_msec_uID_exprd 以内に uID を作ろうとした場合
const c_ERR_crt_usr_notDscnct = -1;
// 切断はしているが、c_msec_uID_exprd 以内に、異なる uname, uview で uID を作ろうとした場合
const c_ERR_crt_usr_dfName = -2;

g_socketio.on('DN_crtd_usr', (new_uID) => {
	if (Number.isInteger(new_uID)) {
		g_doj_crt_usr.Rcv_DN_Crtd_Usr(new_uID)
		return;
	}

	// new_uID が整数でなかった場合は、エラーが発生している（以下はエラー処理）
	const err_code = new_uID[0];
	const elps_msec = new_uID[1];

	const e_txt_1 = g_dlg_bx.Crt_Div();
	e_txt_1.textContent = Math.trunc(elps_msec / 60000) + '分前に、現在接続中のIPと同じIPで、ユーザーが作成されました。';

	const e_txt_2 = g_dlg_bx.Crt_Div();
	if (err_code ===c_ERR_crt_usr_notDscnct) {
		// 接続状態の IPで、c_msec_uID_exprd 以内に uID を作ろうとした場合
		e_txt_2.textContent = '現在接続中のブラウザで、チャットを利用してください。';
	} else {
		// 切断はしているが、c_msec_uID_exprd 以内に、異なる uname, uview で uID を作ろうとした場合
		e_txt_2.textContent = '以前に利用していた同じ名前、同じアイコンでチャットを利用してください。';
	}

	const e_txt_3 = g_dlg_bx.Crt_Div();
	e_txt_3.textContent = 'または、30分以上時間を空けてからユーザーを作成してみてください。';

	g_dlg_bx.Show();
	g_doj_crt_usr.Show();
});

