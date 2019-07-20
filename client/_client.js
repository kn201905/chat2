'use strict';

// 接続が開始される（リロードも含む）と、接続許可の確認 -> init_RI と手続きが進む。
// 'connect' の受信-> g_mng_connect.Rcv_connect ( ＋ 'DN_qry_cnct' の登録 -> g_mng_connect.Rgst_DN_qry_cnct)
// -> g_mng_connect.Start_client_init() で 'UP_qry_cnct' を送信 (接続許可の問い合わせ)
// -> 'DN_qry_cnct' の接続可否の結果を受信
// -> g_mng_client_init.Rcv_DN_qry_cnct ( ＋ window.onload() )
// -> g_mng_client_init.Jdg_Emit_InitRI で 'UP_req_init_RI' を送信
const g_mng_connect = new function() {
	let mb_rcv_connect = false;
	let mb_rgst_DN_qry_cnct = false;

	this.Rcv_connect = () => {
		mb_rcv_connect = true;
		if (mb_rgst_DN_qry_cnct) { Start_client_init(); }
	};

	this.Rgst_DN_qry_cnct = () => {
		mb_rgst_DN_qry_cnct = true;
		if (mb_rcv_connect) { Start_client_init(); }
	};

	function Start_client_init() {
		g_socketio.emit('UP_qry_cnct', null);
	}
};
// socket.io クライアント側の生成
const g_socketio = io(str_serverip);
g_socketio.on('connect', g_mng_connect.Rcv_connect);


// RoomInfo
// [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
const IX_RInfo_topic_id = 0;
const IX_RInfo_capa = 1;
const IX_RInfo_str_room_prof = 2;
const IX_RInfo_uID = 3;
const IX_RInfo_uname = 4;
const IX_RInfo_uview = 5;
const IX_RInfo_roomID = 6;

// サーバーと、同一の値になるように設定
// SVL
// [user_id, type, contents]
const IX_VcTYPE_enter_usr = 1;
const IX_VcTYPE_exit_usr = 2;
const IX_VcTYPE_chgHst = 3;
const IX_VcTYPE_chg_fmsg = 4;
const IX_VcTYPE_chg_cl = 5;

const IX_VcTYPE_umsg = 10;


////////////////////////////////////////////////////////////////

const g_doj_body = new function() {
	this.Append = (doj) => {
		document.body.appendChild(doj.e_lump);
	};
};

// グローバルなステートを管理
const g_stt = new function() {
	this.dsbl_gazou = false;
	let m_room_dsbl_gazou = false;
	this.IsDsbl_Gazou = () => this.dsbl_gazou || m_room_dsbl_gazou;

	this.b_Mobile = false;
	if (window.innerWidth < 500) {
		this.b_Mobile = true;

		// レスポンシブ対応
		document.documentElement.style.setProperty('--uvc_bdr_px', '2px');
		document.documentElement.style.setProperty('--uvc_utxt_bdr_mgn_left', '-2px');
		document.documentElement.style.setProperty('--uvc_utxt_pdng', '0.3em 0.5em');
		document.documentElement.style.setProperty('--uvc_bln1_bdr_px_w', '10px');
		document.documentElement.style.setProperty('--uvc_bln1_bdr_px_h', '5px');
		document.documentElement.style.setProperty('--uvc_bln2_left', '1px');
	}

	// ----------------------------------------
	// ブラウザのフォントサイズの取得（単位：px）
	const m_fontSz_dflt
		= parseFloat(window.getComputedStyle(document.body, null).getPropertyValue('font-size'));
	this.Get_FontSz_dflt = () => m_fontSz_dflt;

	// img 要素の大きさの倍率（1rem に対して）
	const c_scale_icoRm_img = this.b_Mobile ? 2 : 2.5;
	const c_scale_icoLby_img = 1.3;

	let m_fontSz_cur = m_fontSz_dflt;
	this.icoSz_Rm = m_fontSz_dflt * c_scale_icoRm_img;
	this.icoSz_Lby = m_fontSz_dflt * c_scale_icoLby_img;

	// 部屋内で表示される名前の幅の設定（px を文字列で保持する）
	const m_vc_unameSz_margin = this.b_Mobile ? 4 + 8 : 6 + 10;
	this.vc_unameSz_w_px = (this.icoSz_Rm + m_vc_unameSz_margin).toString() + 'px';

	this.Get_FontSz_cur = () => m_fontSz_cur;
	// Chg_FontSz_cur() は、Doj_Body_Setting からのみコールされる
	this.Chg_FontSz_cur = (font_sz_cur) => {
		m_fontSz_cur = font_sz_cur;
		this.icoSz_Rm = font_sz_cur * c_scale_icoRm_img;
		this.icoSz_Lby = font_sz_cur * c_scale_icoLby_img;
		this.vc_unameSz_w_px = (this.icoSz_Rm + m_vc_unameSz_margin).toString() + 'px';
	};
};


// アイコンの色を変えるときに利用されるクラス
const g_Ntfr_chg_icon_cl = new function() {
	const ma_lstnr = [];

	// obj は、Rcp_ChgIconCl を実装していること 
	this.Append = (lstnr) => {
		ma_lstnr.push(lstnr);
	};

	this.Ntfy_ChgIconCl = () => {
		for (const lstnr of ma_lstnr) { lstnr.Rcp_ChgIconCl(); }
	};
};


// 文字サイズを変えるときに利用されるクラス
const g_Ntfr_resize = new function() {
	const ma_lstnr = [];

	// obj は、Rcp_Resize を実装していること 
	this.Append = (lstnr) => {
		ma_lstnr.push(lstnr);
	};

	this.Ntfy_Resize = () => {
		for (const lstnr of ma_lstnr) { lstnr.Rcp_Resize(); }
	};
};


/*
const g_Ntfr_chg_host = new function() {
	const ma_lstnr = [];

	// obj は、Rcp_ChgHost を実装していること 
	this.Append = (lstnr) => {
		ma_lstnr.push(lstnr);
	};

	this.Ntfy_ChgHost = (b_host) => {
		for (const lstnr of ma_lstnr) { lstnr.Rcp_ChgHost(b_host); }
	};
};
*/


// 画面上部のデバッグ表示部分
const g_doj_dbgcnsl = new function() {
	const m_e_lump = document.createElement('div');
	m_e_lump.style.fontSize = '0.6rem';
	this.e_lump = m_e_lump;

	const e_btn_hide = Create_Btn(m_e_lump, 'デバッグ出力を隠す');
	e_btn_hide.classList.add('dbgcnsl_btn');
	e_btn_hide.style.marginRight = '1em';
	e_btn_hide.onclick = () => {
		m_e_fixd_area.hidden = !m_e_fixd_area.hidden;
		m_e_cnsl_area.hidden = !m_e_cnsl_area.hidden;
	};

	const e_btn_clear = Create_Btn(m_e_lump, 'デバッグ出力クリア');
	e_btn_clear.classList.add('dbgcnsl_btn');
	e_btn_clear.onclick = () => { m_e_cnsl_area.textContent = ''; };

	const e_fixd_area = document.createElement('div');
	const m_e_fixd_txt_1 = document.createTextNode('　→　');
	e_fixd_area.appendChild(m_e_fixd_txt_1);
	const m_e_fixd_txt_2 = document.createTextNode('　→　');
	e_fixd_area.appendChild(m_e_fixd_txt_2);
	const m_e_fixd_txt_3 = document.createTextNode('　→　');
	e_fixd_area.appendChild(m_e_fixd_txt_3);
	const m_e_fixd_txt_4 = document.createTextNode('');
	e_fixd_area.appendChild(m_e_fixd_txt_4);
	m_e_lump.appendChild(e_fixd_area);

	let m_e_cnsl_area = document.createElement('div');
	m_e_lump.appendChild(m_e_cnsl_area);

	const dbgcnsl_hr_btm = document.createElement('hr');
	dbgcnsl_hr_btm.classList.add('dbgcnsl_hr');
	m_e_lump.appendChild(dbgcnsl_hr_btm);

	/////////////////////////////////////////////////
	this.TextOut = (msg) => {
		m_e_cnsl_area.appendChild(document.createTextNode(msg));
		m_e_cnsl_area.appendChild(document.createElement('br'));
	};

	this.TextOut_Fixed = (msg) => {
		m_e_fixd_txt_1.textContent = m_e_fixd_txt_2.textContent;
		m_e_fixd_txt_2.textContent = m_e_fixd_txt_3.textContent;
		m_e_fixd_txt_3.textContent = m_e_fixd_txt_4.textContent + '　→　';
		m_e_fixd_txt_4.textContent = msg; 
	};
};

var g_DBG = g_doj_dbgcnsl.TextOut;
var g_DBG_F = g_doj_dbgcnsl.TextOut_Fixed;


////////////////////////////////////////////////////////////////

// node鯖に、次の処理を依頼してよいかを確認するクラス
const g_Wait_NodeSvr = new function() {
	let m_obj = null;
	let m_fn = null;

	this.Set = (obj, fn, str_DBG = null) => {
		if (m_fn !== null) {
			alert('エラー ; g_Wait_NodeSvr.Set()');
			return;
		}

		m_obj = obj;
		m_fn = fn;

		if (str_DBG === null) {
			g_socketio.emit('UP_READY', null);
		} else {
			g_socketio.emit('UP_READY_DBG'
				, g_my_uID + ' ' + g_my_uname + ' ' + str_DBG);
		}
	};

	this.Resume = () => {
		const fn = m_fn;
		m_fn = null;

		if (m_obj === null) {
			fn();
		} else {
			fn.bind(m_obj)();
		}
	};

	this.Reset = () => {
		m_obj == null;
		m_fn ==  null;
	};
};

g_socketio.on('DN_READY', () => {
	g_Wait_NodeSvr.Resume()
});


////////////////////////////////////////////////////////////////

// メッセージディスパッチ用に、'\n' が改行コードとなった string が戻り値として返される
// CRLF を LF に書き換え、さらに dst_div に <BR> に書き換えたものを設定する
function TxtArea_toDiv(src_txtarea, dst_div) {
	const txt_n = src_txtarea.value.replace(/\r\n/g, '\n');
	NTxt_toDiv(txt_n, dst_div);
	return txt_n;
}

function NTxt_toDiv(txt_n, dst_div) {
	const a_line = txt_n.split('\n');

	let bfirst = true;
	for (const line of a_line) {
		if (bfirst) {
			dst_div.appendChild(document.createTextNode(line));
			bfirst = false;
		} else {
			dst_div.appendChild(document.createElement('br'));
			dst_div.appendChild(document.createTextNode(line));
		}
	}
}


// 以下の３つは、createElement を書く手間を減らすだけの関数
function Create_TxtDiv(parent, txt) {
	const e_div_txt = document.createElement('div');
	e_div_txt.textContent = txt;
	parent.appendChild(e_div_txt);

	return e_div_txt;
}

function Create_Btn(parent, txt) {
	const e_btn = document.createElement('button');
	e_btn.textContent = txt;
	parent.appendChild(e_btn);

	return e_btn;
}

function Create_FlexStg(parent) {
	const e_stg = document.createElement('div');
	e_stg.style.display = 'flex';
	e_stg.style.flexWrap = 'wrap';
	parent.appendChild(e_stg);

	return e_stg;
}


////////////////////////////////////////////////////////////////

// モーダルダイアログボックス
const g_dlg_bx = new function() {
	const m_e_dlg_frm = document.createElement('div');
	m_e_dlg_frm.classList.add('frm');
	m_e_dlg_frm.style.position = 'fixed';
	m_e_dlg_frm.style.left = '2em';
	m_e_dlg_frm.style.top = '2em';
	m_e_dlg_frm.hidden = true;
	document.body.appendChild(m_e_dlg_frm);

	const m_modal_scrn = new Modal_Scrn();

	const m_e_div_cnts = document.createElement('div');
	m_e_dlg_frm.appendChild(m_e_div_cnts);

	const m_e_btn_wrp = document.createElement('div');
	m_e_btn_wrp.style.textAlign = 'center';
	m_e_dlg_frm.appendChild(m_e_btn_wrp);

	const m_e_btn_1st = Create_Btn(m_e_btn_wrp, '閉じる');
	m_e_btn_1st.style.marginTop = '0.5em';
	m_e_btn_1st.onclick = Close;

	const m_e_btn_2nd = Create_Btn(m_e_btn_wrp, 'いいえ');
	m_e_btn_2nd.style.margin = '0.5em 0 0 2em';
//	m_e_btn_2nd.onclick = null;
	m_e_btn_2nd.hidden = true;

	this.Show_Txt = (msg, b_close_out_frm = false, z_idx = 901) => {
		m_e_div_cnts.textContent = msg;
		this.Show(b_close_out_frm, z_idx);
	};

	this.Show = (b_close_out_frm = false, z_idx = 901) => {
		m_e_dlg_frm.style.zIndex = z_idx;

		if (b_close_out_frm) {
			m_modal_scrn.Show(Close, z_idx - 1, 0.3);
		} else {
			m_modal_scrn.Show(null, z_idx - 1, 0.3);
		}
		m_e_dlg_frm.hidden = false;
	};

	this.Close = Close;
	function Close() {
		if (m_e_dlg_frm.hidden) { return; }

		m_e_dlg_frm.hidden = true;
		m_modal_scrn.Hide();

		m_e_div_cnts.textContent = '';  // 全ての子要素も削除される

		// ボタンをデフォルトに戻しておく
		if (!m_e_btn_2nd.hidden) {
			m_e_btn_2nd.hidden = true;
		}
		m_e_btn_1st.textContent = '閉じる';
		m_e_btn_1st.onclick = Close;
	}

//	this.Get_div_cnts = () => m_e_div_cnts;
	this.Crt_Div = () => {
		const e_div = document.createElement('div');
		m_e_div_cnts.appendChild(e_div);
		return e_div;
	};

	this.Enbl_1st_Btn = () => { m_e_btn_1st.disabled = false; };
	this.Dsbl_1st_Btn = () => { m_e_btn_1st.disabled = true; };

	this.Enbl_Close_outFrm = () => { m_modal_scrn.Rgst_CB_onclick(Close); };

	// txt が null の場合、btn1 が 'はい'、btn2 が 'いいえ' となる
	// fn に null を指定すると、Close が設定される
	this.Set_2Btns = (txt_btn1 = null, fn_btn1 = null, txt_btn2 = null, fn_btn2 = null) => {
		if (txt_btn1 === null) {
			m_e_btn_1st.textContent = 'はい';
		} else {
			m_e_btn_1st.textContent = txt_btn1;
		}

		if (fn_btn1 === null) {
			m_e_btn_1st.onclick = Close;
		} else {
			m_e_btn_1st.onclick = fn_btn1;
		}

		if (txt_btn2 === null) {
			m_e_btn_2nd.textContent = 'いいえ';
		} else {
			m_e_btn_2nd.textContent = txt_btn2;
		}

		if (fn_btn2 === null) {
			m_e_btn_2nd.onclick = Close;
		} else {
			m_e_btn_2nd.onclick = fn_btn2;
		}

		m_e_btn_2nd.hidden = false;
	};
};

function Modal_Scrn() {
	const m_e_scrn_mask = document.createElement('div');
	m_e_scrn_mask.style.position = 'fixed';
	m_e_scrn_mask.style.left = 0;
	m_e_scrn_mask.style.top = 0;
	m_e_scrn_mask.style.right = 0;
	m_e_scrn_mask.style.bottom = 0;
	m_e_scrn_mask.hidden = true;
	document.body.appendChild(m_e_scrn_mask);

	this.Show = (fn_CB = null, z_idx = 10, alpha = 0) => {
		m_e_scrn_mask.onclick = fn_CB;
		m_e_scrn_mask.style.zIndex = z_idx;
		m_e_scrn_mask.style.background = 'rgba(0,0,0,' + alpha + ')';
		m_e_scrn_mask.hidden = false
	};
	this.Hide = () => { m_e_scrn_mask.hidden = true; };

	this.Rgst_CB_onclick = (fn_CB) => { m_e_scrn_mask.onclick = fn_CB; };
};
