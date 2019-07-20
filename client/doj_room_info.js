'use strict';

////////////////////////////////////////////////////////////////
// id、socket、ユーザ画像関連 のデータを実装版を後で作成する
// ▶ uview のインプリメント
const Doj_Member = function(uID, uname, uview) {
//	const m_uID = uID;
	this.Get_uID = () => uID;
	let m_uview = uview;  // uview は、利用者によって変更できるようにした
	this.Get_uview = () => m_uview;
	this.Set_uview = (new_uview) => { m_uview = new_uview; };

//	const m_uname = uname;
	this.Get_uINV = () => [uID, uname, m_uview];

	const m_e_lump = document.createElement('div');
	m_e_lump.classList.add('RI_doj_member');
	this.e_lump = m_e_lump;

	const m_e_icon_Lby = g_doj_char_pick.GetCln_e_icon_Lby(m_uview);
	m_e_lump.appendChild(m_e_icon_Lby);

	const m_e_uname = document.createElement('div');
	m_e_uname.style.paddingTop = '4px';
	m_e_uname.textContent = uname;
	m_e_lump.appendChild(m_e_uname);

	////////////////////////////////////////
	
	this.ResizeIcon = () => {
		m_e_icon_Lby.width = g_stt.icoSz_Lby;
		m_e_icon_Lby.height = g_stt.icoSz_Lby;
	};
}

////////////////////////////////////////////////////////////////

// 部屋の情報を一度に作成するのは大変であるから、ユーザ情報以外をまず与えて構築する
// その後、ユーザ情報は AddMember で加えていくことにする
const Doj_RoomInfo = function(topic_id, num_capa, str_room_prof, room_id) {

	// 部屋の人数が０人となって、部屋を削除するときに親が分かる必要がある
	const m_topic_ID = topic_id;

	const m_room_ID = room_id;
	this.Get_RoomID = () => m_room_ID;

	// 以下の３つはセットで扱うもの
	// 現在、部屋にいる人を表している訳ではないことに注意。退室した後の人の情報も表示することを考えている
	const ma_uID = [];
	const ma_uname = [];
	const ma_uview = [];
	const mab_uHiddn = [];  // 非表示フラグ
	this.Get_all_udata = () => [ma_uID, ma_uname, ma_uview];
	this.Is_uHiddn = (uID) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return false; }  // この場合はないはずだけど、念の為
		return mab_uHiddn[uIX];
	};

	// [uname, uview]
	this.Get_udata = (uID) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return null; }

		return [ma_uname[uIX], ma_uview[uIX]];
	};

	this.Get_uname = (uID) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return null; }

		return ma_uname[uIX];
	};

	// -------------------------------------
	// 戻り値は、true -> cur color の変更必要、 false -> cur color は変更なし
	this.Chg_RefCl = (uID, val_ref_RGB) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return false; }

		const old_uview = ma_uview[uIX];
		const old_cur_RGB = old_uview & 0xfff00;
		const old_ref_RGB = (old_uview & 0xfff00000) >>> 12;

		let new_uview;
		let ret_val;
		if (old_cur_RGB === old_ref_RGB) {
			// ref, cur 共に変更
			new_uview = (old_uview & 0xffff000000ff) | (val_ref_RGB << 20) | (val_ref_RGB << 8);
			ret_val = true;
		} else {
			// ref のみ変更
			new_uview = (old_uview & 0xffff000fffff) | (val_ref_RGB << 20);
			ret_val = false;
		}
		ma_uview[uIX] = new_uview;

		for (const doj_member of ma_doj_member) {
			if (doj_member.Get_uID() === uID) {
				doj_member.Set_uview(new_uview);
				break;
			}
		}
		return ret_val;
	};

	this.Chg_CurCl = (uID, val_cur_RGB) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return false; }

		const old_uview = ma_uview[uIX];
		const new_uview = (old_uview & 0xfffffff000ff) | (val_cur_RGB << 8);
		ma_uview[uIX] = new_uview;

		for (const doj_member of ma_doj_member) {
			if (doj_member.Get_uID() === uID) {
				doj_member.Set_uview(new_uview);
				break;
			}
		}
	};

	// -------------------------------------
	// b_hiddn_utxt == true のとき、utxt を非表示にする
	this.Hiddn_usr = (uID, b_hiddn_utxt) => {
		const uIX = ma_uID.indexOf(uID);
		if (uIX < 0) { return false; }

		mab_uHiddn[uIX] = b_hiddn_utxt;
	};

	// -------------------------------------
	let m_capa = num_capa;  // capa は後で変更もあることに留意
	this.Get_capa = () => m_capa;
	this.Chg_capa = (new_capa) => {
		m_capa = new_capa;
		m_e_btn_enter.textContent = '入室(' + m_capa + '人まで)';
		this.Adj_UI();
	};

	// ma_doj_member が、部屋にいる人の状態を表す
	const ma_doj_member = [];
	this.Get_a_doj_member = () => ma_doj_member;
	this.Get_num_member = () => ma_doj_member.length;
	this.Get_HostID = () => ma_doj_member[0].Get_uID();

	// -------------------------------------
	const e_lump = document.createElement('div');
	e_lump.style.width = '100%';
	this.e_lump = e_lump;

	const m_e_hr_top = document.createElement("hr");
	m_e_hr_top.classList.add('hr_room_prof');
	e_lump.appendChild(m_e_hr_top);

	const m_e_room_prof = document.createElement('div');
	e_lump.appendChild(m_e_room_prof);

	const m_e_btn_enter = Create_Btn(m_e_room_prof, '入室(' + m_capa + '人まで)');
	m_e_btn_enter.classList.add('RI_btn_entRm');
	m_e_btn_enter.style.marginRight = '10px';
	m_e_btn_enter.onclick = EnterMe.bind(this);

	const m_e_span_prof = document.createElement('span');
	m_e_span_prof.textContent = str_room_prof;
	m_e_room_prof.appendChild(m_e_span_prof);

	const m_e_stg_membs = document.createElement('div');
	m_e_stg_membs.classList.add('RI_stg_member');
	e_lump.appendChild(m_e_stg_membs);

	// ------------------------------------------
	// doj_RI の「入室ボタン」をクリック
	function EnterMe() {
		// Wait 状態に移行
		g_view_Lobby.Hide();
		g_doj_room.Show();
		// ▶　リカバリ関数の実装が必要
		g_doj_room.Dsbl_Oprtn(null, 0);

g_DBG_F('UP_CanEnt_me');

		// タイミングで入室できないときもある
		g_socketio.emit('UP_CanEnt_me', [m_room_ID, g_my_uID]);
		Doj_RoomInfo.ms_dojRI_prsdEnter = this;
	}

	////////////////////////////////////////
	// メソッド
	this.AddMember = (uID, uname, uview, doj_member) => {
		ma_doj_member.push(doj_member);
		m_e_stg_membs.appendChild(doj_member.e_lump);

		// 再入室者である場合は、以前の情報が残っているため、登録の必要がない
		if (ma_uID.indexOf(uID) < 0){

console.log('new user : ' + uname);

			ma_uID.push(uID);
			ma_uname.push(uname);
			ma_uview.push(uview);
			mab_uHiddn.push(false);
		}

		this.Adj_UI();
	}

	// ------------------------------------------
//	this.Enabled = () => {
	this.Adj_UI = () => {
		if (g_my_uID >= 0 && ma_doj_member.length < m_capa) {
			m_e_btn_enter.disabled = false;
		} else {
			m_e_btn_enter.disabled = true;
		}
	}	
	this.Disabled = () => {
		m_e_btn_enter.disabled = true;
	}

	// 現時点では、アイコンのリサイズを行うのみ
	this.Resize = () => {
		for (const doj_member of ma_doj_member) {
			doj_member.ResizeIcon();
		}
	};

	// ------------------------------------------
	//「サーバー側で削除された後」にコールされる
	// ロビーの表示を更新する
	this.RemoveUsr = (uID) => {
		// ユーザが１人しかいない場合は、ロビーから doj_RI を削除するだけ
		if (ma_doj_member.length === 1) {
			ga_doj_topic[m_topic_ID].UnRegist_dojRI(this);  // topic から removeChilde() も実行される
			ga_mng_doj_RI.Remove_byRmID(m_room_ID);
			return;
		}

		// doj_member は削除するが、再入室時に voice を表示するために、ma_uID 等の削除は行わない
		for (let ix = ma_doj_member.length - 1; ix >= 0; ix--) {
			const doj_member = ma_doj_member[ix];
			if (doj_member.Get_uID() === uID) {
				m_e_stg_membs.removeChild(doj_member.e_lump);
				ma_doj_member.splice(ix, 1);
				break;
			}

			if (ix === 0) {
				alert('エラー : Doj_RoomInfo.RemoveUsr()');
				return;
			}
		}

		// 部屋にゲストとして入ったとき、ログvoice を表示する際、
		// なるべくサーバーへの問い合わせをなくすために、以下の情報は残しておく。
		// Doj_RoomInfo.Get_udata() で利用される。
/*
		ma_uID.splice(idx, 1);
		ma_uname.splice(idx, 1);
		ma_uview.splice(idx, 1);
*/
		this.Adj_UI();
	}

	// ------------------------------------------
	// ここは「自分以外の誰か」が退室したときに、コールされるということに留意
	// [roomID, uID, vcIX]
	this.Rcv_DN_rmvUsr = (ary) => {
		const rmID = ary[0];
		const uID = ary[1];
		const vcIX = ary[2];

		// rmvUsr する前の状態のホストuID を記録しておく
		const pre_hst_uID = ma_doj_member[0].Get_uID();

		// ロビーの表示を更新する。RemoveUsr() は、removeChild も実行してくれる
		this.RemoveUsr(uID);

		// 削除されたのが、自分が所属する部屋であれば、「～さんが退室しました」を表示
		// さらに、ホストの交代があった場合、「管理者権限」の移動についても表示
		if (g_doj_room.IsOpen() && g_doj_room.Get_RmID() === rmID) {
			const rmv_uIX = ma_uID.indexOf(uID);
			// 退室した人が、元ホストであれば、管理者権限の移動も表示する
			if (uID === pre_hst_uID) {
				g_Room_Voices.Add_ExitVc_uname(ma_uname[rmv_uIX], vcIX - 1);

				const new_hst_uIX = ma_uID.indexOf(this.Get_HostID());
				g_Room_Voices.Add_ChgHstVc_uname(ma_uname[new_hst_uIX], vcIX);
			} else {
				g_Room_Voices.Add_ExitVc_uname(ma_uname[rmv_uIX], vcIX);
			}
		}
	};
}
Doj_RoomInfo.ms_dojRI_prsdEnter = null;


// [rmID, uID, uview_new, vcIX]
// 新たに入室したときに、各ユーザが設定した色が表示されるように、RI を更新しておく
g_socketio.on('DN_chgCl', (ary) => {

	if (ary.length === 0) {
		// 何らかのタイミングにより、部屋が消滅していた（これは UP_chgCl を送った本人にしかこない通知形態）
		alert('何らかの理由で部屋が閉じられています。');
		g_doj_room.Close();
		return;
	}

	const rmID = ary[0];
	const uID = ary[1];
	const uview = ary[2];
	const vcIX = ary[3];

	const doj_RI = ga_mng_doj_RI.Search_byRmID(rmID);
	if (doj_RI === null) { return; }  // 何らかのタイミングで部屋が消滅していた

	// ref_color を取り出す
	const val_ref_RGB = (uview & 0xfff00000) >>> 20;
	// 戻り値は、true -> cur_color の変更必要、 false -> cur_color は変更なし
	const b_chg_curCl = doj_RI.Chg_RefCl(uID, val_ref_RGB);

	// -------------------------------
	// もし、rmID に自分が入室していた場合、room 内の表示も変更する
	if (!g_doj_room.IsOpen()) { return; }
	if (g_doj_room.Get_RmID() !== rmID) { return; }

	g_Room_Voices.Add_ChgClVc_uname(doj_RI.Get_uname(uID), vcIX);

	if (b_chg_curCl) {
		g_Room_Voices.ChgCl(uID, '#' + ('00' + val_ref_RGB.toString(16)).substr(-3));
	}
	// 自分の色の変更であれば、自分の設定情報を更新しておく
	if (uID == g_my_uID) { g_doj_crt_usr.Set_uview(uview) }
});


// DN_rmvUsr : 自分以外の誰かが退室したとき受信する
// [roomID, uID, vcIX]
g_socketio.on('DN_rmvUsr', (ary) => {
	const doj_RI = ga_mng_doj_RI.Search_byRmID(ary[0]);
	doj_RI.Rcv_DN_rmvUsr(ary);
});

// DN_addUser : 自分以外の誰かが入室したときに受信する
// [RmID, uID, uname, uview, vcIX]
g_socketio.on('DN_addUser', (ary) => {
	const rmID = ary[0];
	const uID = ary[1];
	const uname = ary[2];
	const uview = ary[3];
	const vcIX = ary[4];

	// doj_RI の更新
	const doj_RI = ga_mng_doj_RI.Search_byRmID(rmID);
	const add_doj_member = new Doj_Member(uID, uname, uview);
	// AddMember() は doj の変更も行ってくれる
	doj_RI.AddMember(uID, uname, uview, add_doj_member);

	// 追加されたのが、自分が所属する部屋であれば、「～さんが入室しました」を表示
	if (g_doj_room.IsOpen() && g_doj_room.Get_RmID() == rmID) {
		// doj_room を表示する処理に移る
		g_Room_Voices.Add_EntVc_uname(uname, vcIX);
	}
});

// UP_CanEnt_me に対する応答
// [[vcの配列, m_ix_vc], fmsg_n}
g_socketio.on('DN_CanEnt_me', (ary) => {

	if (ary.length === 0) {
		g_doj_room.Enbl_Oprtn();
		g_doj_room.Hide();
		g_view_Lobby.Show();

		alert('人数制限により、入室できませんでした。');
		return;
	}

	// CanEnt_me の発信者のところには、DN_addUser が送信されないため、
	// doj_RI の更新を自分で行う
//	const uID = g_doj_crt_usr.Get_uID();
//	const uname = g_doj_crt_usr.Get_uname();
	const uview = g_doj_crt_usr.Get_uview();
	const doj_RI = Doj_RoomInfo.ms_dojRI_prsdEnter;
	const add_doj_member = new Doj_Member(g_my_uID, g_my_uname, uview);

	// AddMember() は doj の変更も行ってくれる
	doj_RI.AddMember(g_my_uID, g_my_uname, uview, add_doj_member);

	// ary[0] には、「～さんが入室しました」のメッセージも含まれていることに留意
	g_doj_room.Open_AsGuest(doj_RI, ary);
});

// 他のユーザに作成された部屋を登録
g_socketio.on('DN_crtd_new_RI', (RI) => Doj_RoomInfo.prototype.Create_byRI(RI));


////////////////////////////////////////////////////////////////

// [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
Doj_RoomInfo.prototype.Create_byRI = function(ary) {
	const topic_id = ary[0];
	if (!Number.isInteger(topic_id) || topic_id < 0 || topic_id >= ga_doj_topic.length) { return; }

	const capa = ary[1];
	if (!Number.isInteger(capa) || capa < 2 || capa > 15) { return; }

	const doj_room_info = new Doj_RoomInfo(
		topic_id, capa,
		ary[IX_RInfo_str_room_prof],
		ary[IX_RInfo_roomID]
	);

	// メンバ登録
	const a_uID = ary[IX_RInfo_uID];
	const a_uname = ary[IX_RInfo_uname];
	const a_uview = ary[IX_RInfo_uview];
	const len = a_uID.length;
	
	for (let idx = 0; idx < len; idx++) {
		const uID = a_uID[idx];
		const uname = a_uname[idx];
		const uview = a_uview[idx];

		const doj_member = new Doj_Member(uID, uname, uview);
		// AddMember() において、Adj_UI() がコールされる
		doj_room_info.AddMember(uID, uname, uview, doj_member);
	}

	ga_doj_topic[topic_id].Regist(doj_room_info);

	return doj_room_info;
};


// [topic_id, capa, str_room_prof, [uname]]
Doj_RoomInfo.prototype.CreateSample = function(ary) {
	const topic_id = ary[0];
	const capa = ary[1];
	const str_room_prof = ary[2];
	const a_uname = ary[3];

	// room_id = -1 は、サンプルルームであることを表す
	const doj_room_info = new Doj_RoomInfo(topic_id, capa, str_room_prof, -1);

	// メンバ登録
	// CreateSample() がコールされる場合、a_roominfo[IX_RInfo_usr_infos] は、uname の配列となっている
	for (let uname of a_uname) {
		// uID = -1 はサンプルユーザであることを表す
		// uview = -1 は、サンプルuview を表す
		const uID = -1;
		const uview = -1;
		const doj_member = new Doj_Member(uID, uname, uview);
		doj_room_info.AddMember(uID, uname, uview, doj_member);
	}

	ga_doj_topic[topic_id].Regist(doj_room_info);
};
