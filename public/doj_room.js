'use strict';

//const c_PCS_dspld_log_dflt = 100;

/*
window.ondragover = function(ev){
	if (g_stt.IsDsbl_Image()) { return; }

	ev.preventDefault();
//	ev.stopPropagation();
	ev.dataTransfer.dropEffect = 'copy';
//	ev.dataTransfer.effectAllowed = 'move';
};

window.ondrop = (ev) => {
	if (g_stt.IsDsbl_Image()) { return; }

	ev.preventDefault();
	ev.stopPropagation();

	const files = ev.dataTransfer.files;
	if (files.length > 1) { return; }
	
	g_DBG(ev);	
};
*/

////////////////////////////////////////////////////////////////

const Doj_Room = function() {
	// .Init() で設定される
	let m_room_ID;
	this.Get_RmID = () => m_room_ID;
	let m_doj_RI;
	this.Get_doj_RI = () => m_doj_RI;
//	this.Get_HostID = () => m_doj_RI.Get_HostID();

	// サーバーに処理を emit した後は、その処理が終わるまで、ユーザーの操作を受け付けないようにする
	// サーバーのキューに処理がたまらないようにするため
	let m_bDsbl_Oprtn = false;

	// 現在の画面が、部屋の中か、ロビーであるか、このフラグで判断（Show() と Hide() で切り替わる）
	let m_bOpen = false;
	this.IsOpen = () => m_bOpen;

	// -------------------------------------
	const m_e_lump = document.createElement('div');
	m_e_lump.style.width = '100%';
	m_e_lump.hidden = true;  // 初期状態は非表示
	this.e_lump = m_e_lump;

	// -------------------------------------
	const m_e_input_voice = document.createElement('textarea');
	m_e_input_voice.classList.add('rm_input_voice');
	m_e_input_voice.placeholder = 'ここに、あなたのメッセージを入力してください（200文字まで）';
	// 漢字変換用のエンターキーの入力判定に適しているのは、keypress時
	m_e_input_voice.onkeypress = (ev) => {
		if (!m_e_btn_issue.disabled) {
			if (ev.key === 'Enter') {
				ev.preventDefault();
				OnClick_Issue.bind(this)();
			}
		}
	};
	m_e_input_voice.onkeyup = () => {
		const len = m_e_input_voice.value.trim().length;
		if (m_bDsbl_Oprtn || len === 0 || len > 200) {
			m_e_btn_issue.disabled = true;
		} else {
			m_e_btn_issue.disabled = false;
		}
	};
	m_e_lump.appendChild(m_e_input_voice);

	// -------------------------------------
	const m_e_area_fn = document.createElement('div');
	m_e_area_fn.classList.add('rm_fn_area');
	m_e_lump.appendChild(m_e_area_fn);

	const m_e_cnctlamp = Create_TxtDiv(m_e_area_fn, '通信中');
	m_e_cnctlamp.classList.add('rm_cnctlamp');

	const m_e_btn_issue = Create_Btn(m_e_area_fn, '発言する');
	m_e_btn_issue.classList.add('rm_btn_left');
	m_e_btn_issue.onclick = OnClick_Issue.bind(this);

	const m_e_btn_fmsg = Create_Btn(m_e_area_fn, '固定メッセージ');
	m_e_btn_fmsg.classList.add('rm_btn_left');
	m_e_btn_fmsg.onclick = g_doj_fixd_msg.Toggle.bind(g_doj_fixd_msg);

	const m_e_btn_etc = Create_Btn(m_e_area_fn, 'その他');
	m_e_btn_etc.classList.add('rm_btn_left');
	m_e_btn_etc.onclick = g_doj_room_etc.Show.bind(g_doj_room_etc);

	const m_e_btn_exit = Create_Btn(m_e_area_fn, '退室する');
	m_e_btn_exit.classList.add('rm_btn_rigth');
	m_e_btn_exit.onclick = Close.bind(this);

	// -------------------------------------
	function OnClick_Issue() {
		const umsg = m_e_input_voice.value.trim();

		// 念の為の確認
		const len = umsg.length;
		if (len === 0 || len > 200) {
			alert('メッセージの長さは 200文字までにしてください。');
			return;
		}

		// ▶ リカバリ関数の実装が必要
		this.Dsbl_Oprtn(null, 0);

		// [uID, str]
		g_socketio.emit('UP_umsg', [g_my_uID, umsg]);

		m_e_input_voice.value = '';

		// サーバーの処理が終了したことを確認した後、ユーザーの次の操作を許可する
		g_Wait_NodeSvr.Set(this, this.Enbl_Oprtn
			, 'Doj_Room.OnClick_Issue ' + g_my_uID + ' ' + g_my_uname);
	}

	////////////////////////////////////////
	// メソッド
	// Show(), Hide() は、入室処理を伴わないもの
	// 入室処理実行前、または、鯖ダウンにより DN_init_RI が発行された場合にのみ利用される
	this.Show = () => {
		m_bOpen = true;
		g_doj_fixd_msg.Hide();
		m_e_lump.hidden = false;
	};
	this.Hide = () => {
		m_bOpen = false;
		g_doj_fixd_msg.Hide();
		g_doj_room_etc.Hide();
		m_e_lump.hidden = true;
	};

	// 処理が失敗した場合にそなえて、コールバック関数を登録できる
	// 現在は未実装
	this.Dsbl_Oprtn = (fn, sec) => {
		// 通信中の表示
		m_e_cnctlamp.classList.add('rm_cnctlamp_on');

		m_bDsbl_Oprtn = true;
		m_e_btn_issue.disabled = true;
		m_e_btn_fmsg.disabled = true;
		m_e_btn_etc.disabled = true;
		m_e_btn_exit.disabled = true;
	}
	this.Enbl_Oprtn = () => {
		// 表示を通信処理終了に戻す
		m_e_cnctlamp.classList.remove('rm_cnctlamp_on');

		m_bDsbl_Oprtn = false;
		if (m_e_input_voice.value.trim().length > 0) {
			m_e_btn_issue.disabled = false;
		} else {
			m_e_btn_issue.disabled = true;
		}
		m_e_btn_fmsg.disabled = false;
		m_e_btn_etc.disabled = false;
		m_e_btn_exit.disabled = false;
	}

	// このメソッドは、入室する前に呼び出されることを想定している。
	// Init() の後に、「さんが入室しました」の処理を行うこと。
	// ary: [vcの配列, m_ix_vc]
	this.Init = (doj_RI, ary) => {
		m_room_ID = doj_RI.Get_RoomID();
		m_doj_RI = doj_RI;

		m_e_input_voice.textContent = '';

		g_doj_room_etc.Init(doj_RI);
		// 戻り値は、true or false
		return g_Room_Voices.Init(doj_RI, ary);
	};


	// -----------------------------------------
	// g_doj_WaitScrn.Show() の状態で、このメソッドがコールされる
	this.Open_AsHost = (doj_RI) => {
		g_doj_fixd_msg.Init_AsHost(doj_RI);
		// Init() は、入室する前に呼び出されることを想定している。
		// ホストで部屋を作ったということは、まだ voice は空ということ。
		this.Init(doj_RI, [[], -1]);
//		g_Ntfr_chg_host.Ntfy_ChgHost(true);

		// SVL は記録済み
		g_Room_Voices.Add_EntVc_uname(g_my_uname, 0);  // vcIX = 0

g_DBG_F('Open_AsHost.g_Wait_NS');

		// サーバーの準備が整ったことを確認した後、this.Enbl_Oprtn() を実行する
		g_Wait_NodeSvr.Set(this, this.Enbl_Oprtn, 'Doj_Room.Open_AsHost()');
	}

	// -----------------------------------------
	// g_doj_WaitScrn.Show() の状態で、このメソッドがコールされる
	// ary: [[vcの配列, m_ix_vc], fmsg_n}
	this.Open_AsGuest = (doj_RI, ary) => {
		g_doj_fixd_msg.Init_AsGuest(doj_RI, ary[1]);  // ary[1]: fmsg_n
//		g_Ntfr_chg_host.Ntfy_ChgHost(false);

		// Init() は、入室する前に呼び出されることを想定している。
		// ary[0]: a_svl には、すでに自分が入室した旨の voice が含まれていることに注意
		if (this.Init(doj_RI, ary[0]) === true) { this.Open_AsGuest_Fnlz(); }
	}

	this.Open_AsGuest_Fnlz = () => {

g_DBG_F('Open_AsGuest.g_Wait_NS');

		// サーバーの準備が整ったことを確認した後、this.Enbl_Oprtn() を実行する
		g_Wait_NodeSvr.Set(this, this.Enbl_Oprtn
			, 'Doj_Room.Open_AsGuest ' + g_my_uID + ' ' + g_my_uname);	
	}

	// ------------------------------------
	this.Close = () => { Close(); }
	function Close() {
		m_bOpen = false;

		// ▶ リカバリ関数の実装が必要
		this.Dsbl_Oprtn(null, 0);

		g_socketio.emit('UP_rmvMe', g_my_uID);
		// 送信者（自分）には、DN_rmvUsr が送信されないため、自分で削除を実行する
		m_doj_RI.RemoveUsr(g_my_uID);

		// 全ユーザに影響を与えるため、まずは、既に発行されている処理を終えてから Close処理を実行する
		g_Wait_NodeSvr.Set(this, this.Close_fnlz
			, 'Doj_Room.Close ' + g_my_uID + ' ' + g_my_uname);
	};

	this.Close_fnlz = () => {
		this.Enbl_Oprtn();

		// doj_room をクローズし、ロビーを表示する
		this.Hide();
		g_Room_Voices.Purge();
		g_doj_fixd_msg.Hide();
		g_doj_room_etc.Hide();

		g_view_Lobby.Show();
	};

	this.FcdOut_Close = () => {
		// 強制退出者には、DN_rmvUsr が送信されないため、自分で削除を実行する
		m_doj_RI.RemoveUsr(g_my_uID);

		// doj_room をクローズし、FcdOut されたことを通知する
		m_bOpen = false;

		this.Hide();
		g_Room_Voices.Purge();
		g_doj_fixd_msg.Hide();
		g_doj_room_etc.Hide();

		g_view_Lobby.Show();

		g_dlg_bx.Close();
		g_dlg_bx.Show_Txt('管理者により、退室が実行されました。');
	};

	this.Clkd_Icon = (uname) => {
		m_e_input_voice.value = m_e_input_voice.value + '@' + uname + ' ';
		m_e_input_voice.focus();
	};
};

//------------------------------------------------
// 強制退室関連
g_socketio.on('DN_FcdOut', () => { g_doj_room.FcdOut_Close(); });

