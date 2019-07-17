'use strict';

////////////////////////////////////////////////////////////////
// システムメッセージ
function Doj_Smpl_Vc_SysMsg(msg, vcIX) {
	const m_vcIX = vcIX;
	this.Get_vcIX = () => m_vcIX;

	const m_e_lump = document.createElement('div');
	m_e_lump.classList.add('vc_sys_msg');
	m_e_lump.textContent = msg;
	this.e_lump = m_e_lump;

	this.Get_e_txtCntnt = () => m_e_lump;
}
Doj_Smpl_Vc_SysMsg.prototype.Get_uID = () => -1;
Doj_Smpl_Vc_SysMsg.prototype.Resize = () => {};
Doj_Smpl_Vc_SysMsg.prototype.Is_umsg = () => false;


////////////////////////////////////////////////////////////////
// 以下の「Doj_Vc_」においては、
// 1. uname, uview が不明な場合、IsComplete() で false が返される
//　　この場合は、後で、Completion() をコールして、処理を完成させる必要がある
// 2. uname, uview が分かり、vc が完全に処理された場合は IsComplete() で true が返される
// 3. Doj_Vc_ 内において、g_Room_Voices.AddVoice() のコールが実行される

// vc_type は IX_VcTYPE_txt 未満
function Doj_Vc_SysMsg(doj_RI, uID, vc_type, vcIX) {
	const m_vcIX = vcIX;
	this.Get_vcIX = () => m_vcIX;

	const m_uID = uID;
	this.Get_uID = () => m_uID;  // incomplete であった場合に、uID が必要となる

	let m_bIsCmplt = false;
	this.IsComplete = () => m_bIsCmplt;

	// Completion() でのみ利用される
	const m_vc_type = vc_type;

	const m_e_lump = document.createElement('div');
	m_e_lump.classList.add('vc_sys_msg');
	this.e_lump = m_e_lump;
	this.Get_e_txtCntnt = () => m_e_lump;


	if (m_vc_type === IX_VcTYPE_chg_fmsg) {
		// この場合は、uname が不要となる
		m_e_lump.textContent = '----- 固定メッセージが変更されました -----';
		m_bIsCmplt = true;

	} else {
		const uname = doj_RI.Get_uname(uID);
		if (uname !== null) {
			Completion(uname);
		}
	}
	g_Room_Voices.AddVoice(this);


	////////////////////////////////////////
	this.Completion = (uname, uview) => { Completion(uname); };
	function Completion(uname) {
		m_bIsCmplt = true;

		switch (m_vc_type) {
			case IX_VcTYPE_enter_usr:
				m_e_lump.textContent = '-----「' + uname + '」さんが入室しました -----';
				break;
			case IX_VcTYPE_exit_usr:
				m_e_lump.textContent = '-----「' + uname + '」さんが退室しました -----';
				break;
			case IX_VcTYPE_chgHst:
				m_e_lump.textContent = '-----「' + uname + '」さんに管理者権限が移りました -----';
				break;
			case IX_VcTYPE_chg_cl:
				m_e_lump.textContent = '-----「' + uname + '」さんが色を変更しました -----';
				break;

			default: alert('エラー : Doj_Vc_SysMsg.Completion()。不明な m_vc_type。');
		}
	}
}
Doj_Vc_SysMsg.prototype.Resize = () => {};
Doj_Vc_SysMsg.prototype.Is_umsg = () => false;


////////////////////////////////////////////////////////////////
// doj_RI は uname と uview を取得するために利用される
function Doj_Vc_umsg(doj_RI, uID, umsg, vcIX) {
	const m_vcIX = vcIX;
	this.Get_vcIX = () => m_vcIX;

	const m_uID = uID;
	this.Get_uID = () => m_uID;

	let m_bIsCmplt = false;
	this.IsComplete = () => m_bIsCmplt;

	const m_e_lump = document.createElement('div');
	this.e_lump = m_e_lump;

	const m_umsg = umsg;
	let m_e_txtCntnt = null;
	this.Get_e_txtCntnt = () => m_e_txtCntnt;

	let m_e_icon_Rm = null;  // Resize() でアクセスする必要がある
	let m_e_bln = null;  // 色を変えるときにアクセスする必要がある

	// uview の生成
	const udata = doj_RI.Get_udata(uID);  // udata: [uname, uview]
	if (udata !== null) {
		Completion(udata[0], udata[1]);
	}
	g_Room_Voices.AddVoice(this);


	////////////////////////////////////////
	this.Completion = (uname, uview) => { Completion(uname, uview); };
	function Completion(uname, uview) {
		// [e_icon, e_bln2, e_utxt]
		const a_ret = Crt_View_vc_umsg(m_e_lump, uname, uview, m_umsg);
		m_e_icon_Rm = a_ret[0];
		m_e_bln = a_ret[1];
		m_e_txtCntnt = a_ret[2];

		m_bIsCmplt = true;
	}

	this.Resize = () => {
		// アイコンサイズの変更
		m_e_icon_Rm.width = g_stt.icoSz_Rm;
		m_e_icon_Rm.height = g_stt.icoSz_Rm;

		// 名前部分の幅を変更
		const e_uname = m_e_icon_Rm.nextSibling;
		e_uname.style.width = g_stt.vc_unameSz_w_px;
	};

	this.ChgCl = (str_S_RGB) => {
		m_e_txtCntnt.style.backgroundColor = str_S_RGB;
		m_e_bln.style.borderRight = '12px solid ' + str_S_RGB;
		m_e_icon_Rm.style.backgroundColor = str_S_RGB;
	};
}
Doj_Vc_umsg.prototype.Is_umsg = () => true;


// 色の変更のため、e_bln2 を返す
function Crt_View_vc_umsg(e_uvc_stg, uname, uview, umsg) {
	e_uvc_stg.classList.add('rm_uvc_stg');

	// uview の生成
	const e_ary = Crt_View_vc_uview(uview, uname);
	const e_uview = e_ary[0];
	const e_icon_Rm = e_ary[1];
	e_icon_Rm.onclick = () => { g_doj_room.Clkd_Icon(uname); }; 
	e_uvc_stg.appendChild(e_uview);

	// umsg の生成
	// e_utxt と e_bln2 で利用
	const str_bg_cl = '#' + ('00' + ((uview & 0xfff00) >>> 8).toString(16)).substr(-3);

	const e_bln1 = document.createElement('div');
	e_bln1.classList.add('rm_uvc_bln1');
	e_bln1.style.marginLeft = '-8px';
	e_uvc_stg.appendChild(e_bln1);

	const e_bln2 = document.createElement('div');
	e_bln2.classList.add('rm_uvc_bln2');
	e_bln2.style.borderRight = '12px solid ' + str_bg_cl;
	e_bln2.style.zIndex = 1;
	e_bln1.appendChild(e_bln2);

	const e_utxt = document.createElement('div');
	e_utxt.classList.add('rm_uvc_utxt');
	e_utxt.textContent = umsg;
	e_utxt.style.backgroundColor = str_bg_cl;

	// flex を用いても、e_wrp_utxt が必要であった（height調整のため）
	const e_wrp_utxt = document.createElement('div');
	e_wrp_utxt.appendChild(e_utxt);
	e_uvc_stg.appendChild(e_wrp_utxt);

	return [e_icon_Rm, e_bln2, e_utxt];
}

//「その他」のパネルを表示するときにも利用される
// [e_uview, e_icon_Rm] を返す（e_icon_Rm は resize() で利用される）
// function Crt_View_vc_uview(uview, uname) {
const Crt_View_vc_uview = function(uview, uname) {
	const e_uview = document.createElement('div');
	e_uview.style.lineHeight = '1em';

	const e_icon_Rm = g_doj_char_pick.GetCln_e_icon_Rm(uview);  // img 要素が返さえる
	e_uview.appendChild(e_icon_Rm);

	const e_name = document.createElement('div');
	e_name.style.width = g_stt.vc_unameSz_w_px;
	e_name.style.wordWrap = 'break-word';
	e_name.textContent = uname;

	if (uname.length <= 4) {
		e_name.style.fontSize = '0.8em';
	} else if (uname.length <= 8) {
		e_name.style.fontSize = '0.7em';
		e_name.style.lineHeight = '1em';
	} else {
		e_name.style.fontSize = '0.6em';
		e_name.style.lineHeight = '1.2em';
	}

	if (g_stt.b_Mobile) { e_name.style.marginTop = '-2px'; }
	e_uview.appendChild(e_name);

	return [e_uview, e_icon_Rm];
}


////////////////////////////////////////////////////////////////
// 元は Room_Voices
const Doj_Room_Voices = function() {
	// ログの最大数
	let m_max_pcs_dspld_vc = c_PCS_dspld_log_dflt;  // m_voice_max はユーザーが変更可能にする
	this.Get_max_pcs_dspld_vc = () => m_max_pcs_dspld_vc;
	this.Set_max_pcs_dspld_vc = (pcs) => {
		m_max_pcs_dspld_vc = pcs;
		Chk_PcsDspldVc.bind(this)();
	};

	// .Init() で設定される
	let m_doj_RI;

	let m_doj_top_voice = null;  // insertBefore() でのみ利用
	let m_e_area_voices = document.createElement('div');
	this.e_lump = m_e_area_voices;

	// 現在表示中の vc を記録（Resize や Remove で利用）
	const ma_doj_vc_dspld = [];
	const ma_vcIX_doj_vc_dspld = [];
	// 現在取得できている最大の vcIX を記録
	let m_vcIX_max = null;

	////////////////////////////////////////
	function Chk_PcsDspldVc() {
		const len_pcs_dspld = ma_doj_vc_dspld.length;
		if (len_pcs_dspld <= m_max_pcs_dspld_vc) { return; }

		// まず、e_lump を removeChild する
		const pcs_rmvd = len_pcs_dspld - m_max_pcs_dspld_vc;
		for (let ix = 0; ix < pcs_rmvd; ix++) {
			m_e_area_voices.removeChild(ma_doj_vc_dspld[ix].e_lump);
		}

		ma_doj_vc_dspld.splice(0, pcs_rmvd);
		ma_vcIX_doj_vc_dspld.splice(0, pcs_rmvd);
	}


	// 以下は、Init でのみ利用される配列。 [[doj_vc1, doj_vc2, ...], ... ]
	const ma_doj_vc_to_uID = [];

	// 戻り値が true の場合は、そのまま room の画面へ
	// 戻り値が false の場合は、DN_qry_udata の処理が終わってから room の画面へ
	// ary : [[[vc], [vc], ... [vc]], vcIX]  <- vcIX は最後の vc の vcIX
	// SVL が、空の場合は、vcIX = -1
	this.Init = (doj_RI, ary) => {
		m_doj_RI = doj_RI;

		m_doj_top_voice = null;
		ma_doj_vc_dspld.splice(0);
		ma_vcIX_doj_vc_dspld.splice(0);
		m_vcIX_max = -1;

		m_e_area_voices.textContent = '';

		// vcIX == -1 は、Open_AsHost ということ
		if (ary[1] < 0) { return; }

		// -------------------------------------
		// SVL の処理を行う
		const a_incmplt_doj_Vc = [];

		const a_vc = ary[0];
		const last_vcIX = ary[1];
		let vcIX = last_vcIX - a_vc.length + 1;

		// vcj: [uID, type, contents]
		for (const vcj of a_vc) {
			const uID = vcj[0];
			const vc_type = vcj[1];

			let ret_doj_vc = null;
			if (vc_type < IX_VcTYPE_umsg) {
				ret_doj_vc = new Doj_Vc_SysMsg(doj_RI, uID, vc_type, vcIX);
			} else {
				// ▶ 現時点では、sys_msg でなければ、usr_msg となる（将来的には、画像もあり）
				ret_doj_vc = new Doj_Vc_umsg(doj_RI, uID, vcj[2], vcIX);
			}
			vcIX++;

			if (ret_doj_vc.IsComplete() === false) {
				a_incmplt_doj_Vc.push(ret_doj_vc);
			}
		};

		if (a_incmplt_doj_Vc.length == 0) { return true; }

		// -------------------------------------
		// ここで、ret_doj_vc.IsComplete を解決すること
		const a_uID_toAsk = [];  // [id1, id2, ...]

		for (let doj_vc of a_incmplt_doj_Vc) {
			const uID = doj_vc.Get_uID();
			const idx = a_uID_toAsk.indexOf(uID);

			if (idx < 0) {
				a_uID_toAsk.push(uID);
				ma_doj_vc_to_uID.push([doj_vc]);
			} else {
				ma_doj_vc_to_uID[idx].push(doj_vc);
			}
		}

g_DBG_F('UP_qry_udata');

		g_socketio.emit('UP_qry_udata', [g_my_uID, a_uID_toAsk]);
		return false;
	};

	// ary: [[uname1, uname2, ...], [uview1, uview2, ...]]
	this.Rslv_ma_doj_vc_to_uID = (ary) => {
		const a_uname = ary[0];
		const a_uview = ary[1];

		for (let idx = ma_doj_vc_to_uID.length - 1; idx >= 0; idx--) {
			for (let doj_vc of ma_doj_vc_to_uID[idx]) {
				doj_vc.Completion(a_uname[idx], a_uview[idx]);
			}
		}
		ma_doj_vc_to_uID.splice(0);

		g_doj_room.Open_AsGuest_Fnlz();
	};

	this.Purge = () => { m_e_area_voices.textContent = ''; };

	this.Resize = () => {
		for (const doj_vc of ma_doj_vc_dspld) {
			doj_vc.Resize();
		}
	};

	// -----------------------------------------
	this.AddVoice = (doj_voice) => {
		const vcIX_doj_voice = doj_voice.Get_vcIX();

// デバッグ用コード
if (vcIX_doj_voice === undefined) { alert('AddVoice(): vcIX が undefined となっています。'); return; }

		if (m_doj_top_voice === null) {
			m_vcIX_max = vcIX_doj_voice;
			m_e_area_voices.appendChild(doj_voice.e_lump);

		} else if (vcIX_doj_voice === m_vcIX_max + 1) {
			m_vcIX_max = vcIX_doj_voice;
			m_e_area_voices.insertBefore(doj_voice.e_lump, m_doj_top_voice.e_lump);

		} else if (vcIX_doj_voice > m_vcIX_max) {
			// vcIX_doj_voice >= m_vcIX_max + 2 であるときの処理
			const pcs_lostvc = vcIX_doj_voice - m_vcIX_max - 1;
			e_txtCntnt.textContent = '【通信障害により' + pcs_lostvc
					+ '個のメッセージが抜け落ちました】' + e_txtCntnt.textContent;

			// vcIX_begin, 個数 を渡す
			// 現時点ではサポートを外しておく
//			g_socketio.emit('UP_lostvc', [g_my_uID, m_vcIX_max + 1, pcs_lostvc]);

			m_vcIX_max = vcIX_doj_voice;
			m_e_area_voices.insertBefore(doj_voice.e_lump, m_doj_top_voice.e_lump);
			
		} else {
			// vcIX_doj_voice < m_vcIX_max であるときの処理
			// 通信遅延処理等ですでに表示されている vc は、表示する必要はない
			if(ma_vcIX_doj_vc_dspld.lastIndexOf(vcIX_doj_voice) >= 0) { return; }

			// 遅延表示処理
			const e_txtCntnt = doj_voice.Get_e_txtCntnt();
			e_txtCntnt.textContent = '【遅延表示】' + e_txtCntnt.textContent;
			m_e_area_voices.insertBefore(doj_voice.e_lump, m_doj_top_voice.e_lump);
		}

		// 非表示チェック（VcType と uID をチェックする）
		if (doj_voice.Is_umsg()) {
			if (m_doj_RI.Is_uHiddn(doj_voice.Get_uID())) {
				doj_voice.e_lump.style.display = 'none';
			}
		}

		m_doj_top_voice = doj_voice;
		ma_doj_vc_dspld.push(doj_voice);
		ma_vcIX_doj_vc_dspld.push(vcIX_doj_voice);

		// ログの表示数のチェック
		Chk_PcsDspldVc.bind(this)();
	};

	// [vcIX_begin, svc, svc, ...]  /  svc: [uID, type (, contents)]
	this.Rcv_DN_lostvc = (ary) => {
		let vcIX = ary[0];
		let ix = 1;

		for (let pcs_svc = ary.length - 1; pcs_svc > 0; vcIX++, ix++, pcs_svc--) {
			// 既に表示済みの場合は何もしない
			if (ma_vcIX_doj_vc_dspld.lastIndexOf(vcIX) >= 0) { continue; }

			const svc = ary[ix];
			const vc_uID = svc[0];
			const vc_type = svc[1];

			if (vc_type < IX_VcTYPE_umsg) {
				// new において、g_Room_Voices.AddVoice(this) をコールしてくれる
				new Doj_Vc_SysMsg(m_doj_RI, vc_uID, vc_type, vcIX);
			} else {
				// ▶ 現時点では、sys_msg でなければ、usr_msg となる
				// [uname, uview]
				const udata = m_doj_RI.Get_udata(uID);
				if (udata === null) {
					// 遅延処理において、udata === null となることはないはず
					alert('エラー : Room_Voices.Rcv_DN_lostvc() / udata == null');
					continue;
				}

				// svc[2]: umsg / udata[0]: uname / udata[1]: uview
				this.AddVoice(new Crt_doj_vc_umsg_delayed(vcIX, vc_uID, svc[2], udata[0], udata[1]));
			}
		}
	};

	// -----------------------------------------
	this.Add_EntVc_uID = (uID, vcIX) => { this.Add_EntVc_uname(m_doj_RI.Get_uname(uID), vcIX); };
	this.Add_EntVc_uname = (uname, vcIX) => {
		const doj_vc = new Doj_Smpl_Vc_SysMsg('-----「' + uname + '」さんが入室しました -----', vcIX);
		this.AddVoice(doj_vc);
	};

	this.Add_ChgHstVc_uID = (uID, vcIX) => { this.Add_ChgHstVc_uname(m_doj_RI.Get_uname(uID), vcIX); };
	this.Add_ChgHstVc_uname = (uname, vcIX) => {
		const doj_vc
			= new Doj_Smpl_Vc_SysMsg('-----「' + uname + '」さんに管理者権限が移りました -----', vcIX);
		this.AddVoice(doj_vc);
	};

	this.Add_ExitVc_uID = (uID, vcIX) => { this.Add_ExitVc_uname(m_doj_RI.Get_uname(uID), vcIX); };
	this.Add_ExitVc_uname = (uname, vcIX) => {
		const doj_vc = new Doj_Smpl_Vc_SysMsg('-----「' + uname + '」さんが退室しました -----', vcIX);
		this.AddVoice(doj_vc);
	};

	this.Add_Chg_fmsg = (vcIX) => {
		const doj_vc = new Doj_Smpl_Vc_SysMsg('----- 固定メッセージが変更されました -----', vcIX);
		this.AddVoice(doj_vc);
	};

	this.Add_ChgClVc_uname = (uname, vcIX) => {
		const doj_vc = new Doj_Smpl_Vc_SysMsg('-----「' + uname + '」さんが色を変更しました -----', vcIX);
		this.AddVoice(doj_vc);
	};

	// -----------------------------------------
	// [uID, umsg, vcIX]
	this.Set_Umsg = (ary) => {

		if (ary.length === 0) {
			// 何らかのタイミングにより、部屋が消滅していた
			alert('何らかの理由で部屋が閉じられています。');
			g_doj_room.Close();
			return;
		}

		const uID = ary[0];
		const vcIX = ary[2];

		// Doj_Vc_umsg は、new するだけで、自分で g_Room_Voices.AddVoice() をコールしてくれる
		new Doj_Vc_umsg(g_doj_room.Get_doj_RI(), uID, ary[1], vcIX);  // ary[1]: umsg
	};

	// -----------------------------------------
	// str_S_RGB は #付き、という意味
	this.ChgCl = (uID, str_S_RGB) => {
		for (const doj_vc of ma_doj_vc_dspld) {
			if (doj_vc.Get_uID() !== uID) { continue; }
			if (!doj_vc.Is_umsg()) { continue; }

			doj_vc.ChgCl(str_S_RGB);
		}
	};

	// -----------------------------------------
	// 表示、非表示の操作
	this.Hiddn_utxt = (uID, b_hiddn_utxt) => {
		if (b_hiddn_utxt) {
			// 非表示
			for (const doj_vc of ma_doj_vc_dspld) {
				if (doj_vc.Get_uID() !== uID) { continue; }
				if (!doj_vc.Is_umsg()) { continue; }
				doj_vc.e_lump.style.display = 'none';
			}
		} else {
			// 表示
			for (const doj_vc of ma_doj_vc_dspld) {
				if (doj_vc.Get_uID() !== uID) { continue; }
				if (!doj_vc.Is_umsg()) { continue; }
				doj_vc.e_lump.style.display = 'flex';
			}
		}
	};
}

function Crt_doj_vc_umsg_delayed(vcIX, uID, umsg, uname, uview) {
	const m_vcIX = vcIX;
	this.Get_vcIX = () => m_vcIX;

	const m_uID = uID;
	this.Get_uID = () => m_uID;

	const m_e_lump = document.createElement('div');
	this.e_lump = m_e_lump;

	const a_ret = Crt_View_vc_umsg(m_e_lump, uname, uview, umsg);
	const m_e_icon_Rm = a_ret[0];
	const m_e_bln = a_ret[1];
	const m_e_txtCntnt = a_ret[2];
	this.Get_e_txtCntnt = () => m_e_txtCntnt;

	this.Resize = () => {
		// アイコンサイズの変更
		m_e_icon_Rm.width = g_stt.icoSz_Rm;
		m_e_icon_Rm.height = g_stt.icoSz_Rm;

		// 名前部分の幅を変更
		const e_uname = m_e_icon_Rm.nextSibling;
		e_uname.style.width = g_stt.vc_unameSz_w_px;
	};

	this.ChgCl = (str_S_RGB) => {
		m_e_txtCntnt.style.backgroundColor = str_S_RGB;
		m_e_bln.style.borderRight = '12px solid ' + str_S_RGB;
		m_e_icon_Rm.style.backgroundColor = str_S_RGB;
	};
}
Crt_doj_vc_umsg_delayed.prototype.Is_umsg = () => true;


// [uID, umsg, vcIX]
// ix_vc は、SVL における idx となる
g_socketio.on('DN_umsg', (ary) => { g_Room_Voices.Set_Umsg(ary); });

// [[uname1, uname2, ...], [uview1, uview2, ...]]
g_socketio.on('DN_qry_udata', (ary) => { g_Room_Voices.Rslv_ma_doj_vc_to_uID(ary); });

// [vcIX, vc]
g_socketio.on('DN_lostvc', (ary) => { g_Room_Voices.Rcv_DN_lostvc(ary); });
