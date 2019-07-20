'use strict';

// ロビーに表示されている RI を全て保持するクラス
// rmID と doj_RI との変換を担う
// Doj_Topic.Regist() で push される
const ga_mng_doj_RI = new function() {
	const ma_RmID = [];
	const ma_doj_RI = [];

	this.push = (doj_RI) => {
		ma_RmID.push(doj_RI.Get_RoomID());
		ma_doj_RI.push(doj_RI);
	};

	// doj_room_info が返される
	this.Search_byRmID = (rmID) => {
		const idx = ma_RmID.indexOf(rmID);
		if (idx < 0) {
			alert('該当 rmID なし : ga_mng_doj_RI.Search_byRmID()');
			return null;
		}

		return ma_doj_RI[idx];
	};

	this.Remove_byRmID = (rmID) => {
		const idx = ma_RmID.indexOf(rmID);
		if (idx < 0) {
			alert('該当 rmID なし : ga_mng_doj_RI.Remove_byRmID()');
			return;
		}

		ma_RmID.splice(idx, 1);
		ma_doj_RI.splice(idx, 1);
	};

	this.Clear = () => {
		ma_RmID.splice(0);
		ma_doj_RI.splice(0);
	};
};


// 将来的に、g_doj_modal_scrn の利用は停止する
const g_doj_modal_scrn = new function() {
	const m_e_scrn_mask = document.createElement('div');
	m_e_scrn_mask.style.position = 'fixed';
	m_e_scrn_mask.style.left = 0;
	m_e_scrn_mask.style.top = 0;
	m_e_scrn_mask.style.right = 0;
	m_e_scrn_mask.style.bottom = 0;

	m_e_scrn_mask.style.zIndex = 10;
	m_e_scrn_mask.hidden = true;

	this.e_lump = m_e_scrn_mask;

	this.Show = (fn_CB = null, z_idx = 10) => {
		m_e_scrn_mask.onclick = fn_CB;
		m_e_scrn_mask.style.zIndex = z_idx;
		m_e_scrn_mask.hidden = false
	}
	this.Hide = () => { m_e_scrn_mask.hidden = true; }
};


////////////////////////////////////////////////////////////////

let g_my_uID = -1;
let g_my_uname = null;
// uview は、今後仕様が変更されれる可能性が高いため、doj_crt_usr で管理する

const g_doj_color = new Doj_Color();
const g_doj_rating = new Doj_Rating();
const g_doj_body_setting = new Doj_Body_Setting();

const g_doj_crt_usr = new Doj_CreateUser();
const g_doj_char_pick = new Doj_Char_Pick();
g_doj_crt_usr.Apnd_CharPick(g_doj_char_pick);

const g_Room_Voices = new Doj_Room_Voices();
const g_doj_fixd_msg = new Doj_Fmsg();
g_doj_fixd_msg.Hide();  // Edge に対応するため、ここで Hide() をコールしている
const g_doj_room_etc = new Doj_Room_etc();
g_doj_room_etc.Hide();  // Edge に対応するため、ここで Hide() をコールしている
const g_doj_room = new Doj_Room();
g_doj_room.e_lump.appendChild(g_Room_Voices.e_lump);

// ---------------------------------------------
// 以下の２つの変数は、new Doj_Topic() で更新される
let g_nextID_doj_topic = 0;
const ga_doj_topic = [];  // Doj_Topic の array


// 現時点では、Doj_TopicBindr は１つしかないから、拡張する場合は気をつけること
const g_doj_topic_bindr = new Doj_TopicBindr();
// 本来は、変数を用意しなくてもよい（サンプル作成のため）
g_doj_topic_bindr.Regist(new Doj_Topic('雑談'));
g_doj_topic_bindr.Regist(new Doj_Topic('スポーツ'));
g_doj_topic_bindr.Regist(new Doj_Topic('料理'));
g_doj_topic_bindr.Regist(new Doj_Topic('プログラミング'));
g_doj_topic_bindr.Regist(new Doj_Topic('ブロックＥ'));
// ---------------------------------------------

const g_doj_set_room_prof = new Doj_SetRoomProf();
const g_doj_set_room_capa = new Doj_SetRoomCapa();
// トピックが生成された後でないと、トピックセレクタは生成できない。
const g_doj_topic_slctr = new Doj_TopicSlctr();
g_doj_set_room_prof.Apnd_CapaSlctr(g_doj_set_room_capa);
g_doj_set_room_prof.Apnd_TopicSlctr(g_doj_topic_slctr);


// ---------------------------------------------
g_doj_body.Append(g_doj_crt_usr);
g_doj_body.Append(g_doj_set_room_prof);
g_doj_body.Append(g_doj_color);

// デバッグコンソール。不必要になればコメントアウトすること
g_doj_body.Append(g_doj_dbgcnsl);

g_doj_body.Append(g_doj_topic_bindr);
g_doj_body.Append(g_doj_room);
g_doj_body.Append(g_doj_fixd_msg);
g_doj_body.Append(g_doj_room_etc);

g_doj_body.Append(g_doj_rating);
g_doj_body.Append(g_doj_body_setting);

g_doj_body.Append(g_doj_modal_scrn);



// 全ての UI が完成してから、以下のコードが走るようにすること
const g_view_Lobby = new function() {
	let m_bShow = true;
	let m_iconSz_Showed = g_stt.icoSz_Lby;

	this.Show = () => {
		if (m_iconSz_Showed !== g_stt.icoSz_Lby) { this.Resize(); }

		// トピックバインダが増えた場合は、以下のコードの訂正に注意
		g_doj_topic_bindr.Show();

		m_bShow = true;
	};

	this.Hide = () => {
		if (g_doj_body_setting.IsVisible()) {
			g_doj_rating.onclick();
		}
		// トピックバインダが増えた場合は、以下のコードの訂正に注意
		g_doj_topic_bindr.Hide();

		m_bShow = false;
	}

	// g_stt.icoSz_Lby にサイズを合わせるメソッド
	this.Resize = () => {
		if (m_iconSz_Showed === g_stt.icoSz_Lby) { return; }

		for (let doj_topic of ga_doj_topic) { doj_topic.Resize(); }
		m_iconSz_Showed = g_stt.icoSz_Lby;
	};
};


////////////////////////////////////////////////////////////////

// 接続許可に関する情報 'DN_qry_cnct' を受け取ってから、init_RI を処理するまでを担当するクラス
const g_mng_client_init = new function() {
//	const c_CNCT_OK = 0;
//	const c_CNCT_Vltn = 1;
	const c_CNCT_Reject = 2;

	let m_bOnLoad = false;
	let m_bRcv_DN_qry_cnct = false;

	this.WindowOnload = () => {
		m_bOnLoad = true;
		if (m_bRcv_DN_qry_cnct) { Jdg_Emit_InitRI(); }
	};

	let m_rslt_DN_qry_cnct = null;
	this.Rcv_DN_qry_cnct= (rslt) => {
		m_bRcv_DN_qry_cnct = true;
		m_rslt_DN_qry_cnct = rslt;  // 'DN_qry_cnct' の結果を保存
		if (m_bOnLoad) { Jdg_Emit_InitRI(); }
	};

//	let mb_crtd_uID = false;
	function Jdg_Emit_InitRI() {
	// c_CNCT_Reject の場合は、'DN_qry_cnct' が発生しないため、以下のチェックは不要なはず
	if (m_rslt_DN_qry_cnct === c_CNCT_Reject) {
		alert('c_CNCT_Reject を受け取りました。（c_CNCT_Reject は送られてこないはず）');
		return;
	}

	if (Array.isArray(m_rslt_DN_qry_cnct)) {
			// この場合は、c_CNCT_Vltn  [c_CNCT_Vltn, life_cur, elps_time]
			const cnt_cnct = m_rslt_DN_qry_cnct[1];
			const elps_time = m_rslt_DN_qry_cnct[2];

			g_dlg_bx.Show_Txt('同一IPアドレスから、チャットサーバへの接続（リロードも含む）は、10分間で３回までです。\n現在、接続回数が '
				+ cnt_cnct + '回目となっています。\n最初の接続は ' + Math.floor(elps_time / 1000)
				+ '秒前にありました。');
		}

		// init_RI の処理を進める
		g_socketio.emit('UP_req_init_RI', null);
		g_DBG_F('UP_req_init_RI');
	}

	// サーバーにリセットが掛かった場合も、Rcv_DN_init_RI() が呼び出されることに留意すること
	this.Rcv_DN_init_RI = (a_RI) => {
		g_DBG('receive DN_init_RI');

		g_Wait_NodeSvr.Reset();

		// 現時点では、Doj_TopicBindr は１つしかないから、拡張する場合は気をつけること
		g_doj_topic_bindr.UnRegist_all_doj_RI();

		ga_mng_doj_RI.Clear();

		g_doj_set_room_prof.Hide();
		g_doj_body_setting.Hide();

		for (let RI of a_RI) {
			Doj_RoomInfo.prototype.Create_byRI(RI);
		}

		g_doj_crt_usr.Show();
		g_doj_crt_usr.Focused();
		// 現時点では、Doj_TopicBindr は１つしかないから、拡張する場合は気をつけること
		g_doj_topic_bindr.Disabled();
		g_view_Lobby.Show();

		g_doj_room.Hide();
	};
};


window.onload = () => {
	setTimeout(() => { g_mng_client_init.WindowOnload(); }, 500);
};

g_socketio.on('DN_init_RI', (a_RI) => { g_mng_client_init.Rcv_DN_init_RI(a_RI); });

g_socketio.on('DN_qry_cnct', (rslt) => { g_mng_client_init.Rcv_DN_qry_cnct(rslt); });
g_mng_connect.Rgst_DN_qry_cnct();
