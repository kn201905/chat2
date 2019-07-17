'use strict';

const Doj_Fmsg = function() {
	// Init_AsHost()、Init_AsGuest() で設定される
	let m_doj_RI;

	const m_e_lump = document.createElement('div');
	m_e_lump.classList.add('fmsg_frm');
	this.e_lump = m_e_lump;

	// -------------------------------------
	const m_e_zn_btn = document.createElement('div');
	m_e_zn_btn.style.marginBottom = '1em';
	m_e_lump.appendChild(m_e_zn_btn);

	const m_e_title = document.createElement('span');
	m_e_title.textContent = '部屋主からの固定メッセージ';
	m_e_title.style.padding ='0 0.5em';
	m_e_title.style.borderBottom = 'solid 2px #99f';
	m_e_zn_btn.appendChild(m_e_title);
	
	const m_e_btn_minz = Create_Btn(m_e_zn_btn, '最小化');
	m_e_btn_minz.classList.add('fmsg_btn');
	m_e_btn_minz.onclick = OnClkBtn_minz;

	const m_e_btn_close = Create_Btn(m_e_zn_btn, '閉じる');
	m_e_btn_close.classList.add('fmsg_btn');
	m_e_btn_close.onclick = Hide;

	const m_e_btn_mv = Create_Btn(m_e_zn_btn, '上に移動');
	m_e_btn_mv.classList.add('fmsg_btn_mv');
	m_e_btn_mv.onclick = OnClkBtn_mv;

	const m_e_btn_edt = Create_Btn(m_e_zn_btn, '編集');
	m_e_btn_edt.classList.add('fmsg_btn_mv');
	m_e_btn_edt.onclick = Show_frm_edt;

	const m_e_fxd_msg = document.createElement('div');
	m_e_lump.appendChild(m_e_fxd_msg);


	// -------------------------------------
	const m_e_edt_frm = document.createElement('div');
	m_e_edt_frm.classList.add('fmsg_frm');
	m_e_edt_frm.style.fontSize = '1em';
	m_e_edt_frm.style.zIndex = 105;
	m_e_edt_frm.textContent = '固定メッセージの編集（300文字まで）';
	m_e_lump.appendChild(m_e_edt_frm);
	m_e_edt_frm.hidden = true;

	const m_e_btn_edt_close = Create_Btn(m_e_edt_frm, '閉じる');
	m_e_btn_edt_close.classList.add('fmsg_btn');
	m_e_btn_edt_close.onclick = () => { m_e_edt_frm.hidden = true; }

	const m_e_btn_edt_OK = Create_Btn(m_e_edt_frm, '編集確定');
	m_e_btn_edt_OK.classList.add('fmsg_btn');
	m_e_btn_edt_OK.onclick = OnClkBtn_edt_OK;

	const m_e_txtarea = document.createElement('textarea');
	m_e_txtarea.classList.add('fmsg_edt_txtarea');
	m_e_edt_frm.appendChild(m_e_txtarea);


	// -------------------------------------
	let b_minz = false;
	function OnClkBtn_minz() {
		if (b_minz) {
			// 元に戻す処理
			m_e_title.hidden = false;
			m_e_btn_edt.hidden = false;
			if (g_my_uID === m_doj_RI.Get_HostID()) {
				m_e_btn_edt.disabled = false;
			} else {
				m_e_btn_edt.disabled = true;
			}
			m_e_btn_close.hidden = false;
			m_e_btn_mv.hidden = false;
			m_e_fxd_msg.hidden = false;
			m_e_btn_minz.textContent = '最小化';
			m_e_btn_minz.style.marginLeft = '1em';

			m_e_lump.style.left = '1em';
			b_minz = false;
		} else {
			// 最小化の処理
			m_e_title.hidden = true;
			m_e_btn_edt.hidden = true;
			m_e_btn_close.hidden = true;
			m_e_btn_mv.hidden = true;
			m_e_fxd_msg.hidden = true;
			m_e_btn_minz.textContent = '元に戻す';
			m_e_btn_minz.style.marginLeft = 0;

			m_e_lump.style.left = 'auto';
			b_minz = true;
		}
	}

	// 固定メッセージの変更
	function OnClkBtn_edt_OK() {
		const new_msg = m_e_txtarea.value;
		if (new_msg.length > 300) {
			alert('固定メッセージが300文字を超えています。');
			return;
		}

		const fmsg_n = m_e_txtarea.value.replace(/\r\n/g, '\n');
		g_socketio.emit('UP_fmsg', [g_my_uID, fmsg_n]);
		m_e_edt_frm.hidden = true;
	}

	let mb_pos_down = true;
	function OnClkBtn_mv() {
		if (mb_pos_down) {
			// 上に移動させる
			m_e_lump.style.top = '2em';
			m_e_lump.style.bottom = 'auto';
			m_e_btn_mv.textContent = '下に移動';
			mb_pos_down = false;
		} else {
			// 下に移動させる
			m_e_lump.style.top = 'auto';
			m_e_lump.style.bottom = '2em';
			m_e_btn_mv.textContent = '上に移動';
			mb_pos_down = true;
		}
	}

	function Show_frm_edt() {
		if (mb_pos_down) {
			m_e_edt_frm.style.top = 'auto';
			m_e_edt_frm.style.bottom = '2em';
		} else {
			m_e_edt_frm.style.top = '2em';
			m_e_edt_frm.style.bottom = 'auto';
		}
		m_e_edt_frm.hidden = false;
		m_e_txtarea.focus();
	}

	// -------------------------------------
	this.Init_AsHost = (doj_RI) => {
		m_doj_RI = doj_RI;
		m_e_txtarea.value = '';
		m_e_fxd_msg.textContent = '';
	};

	this.Init_AsGuest = (doj_RI, fmsg_n) => {
		m_doj_RI = doj_RI;
		m_e_txtarea.value = '';
		m_e_fxd_msg.textContent = '';
		NTxt_toDiv(fmsg_n, m_e_fxd_msg);
	};

	// [fmsg_n, vcIX]
	this.Rcv_DN_fmsg = (ary) => {
		m_e_txtarea.value = '';
		m_e_fxd_msg.textContent = '';
		NTxt_toDiv(ary[0], m_e_fxd_msg);  // ary[0]: fmsg_n
		g_Room_Voices.Add_Chg_fmsg(ary[1]);  // ary[1]: vcIX
	};

	// -------------------------------------
	this.Toggle = () => {
		if (m_e_lump.hidden) {
			this.Show();
		} else {
			this.Hide();
		}
	};

	this.Show = () => {
		if (g_my_uID === m_doj_RI.Get_HostID()) {
			m_e_btn_edt.disabled = false;
		} else {
			m_e_btn_edt.disabled = true;
		}
		m_e_lump.hidden = false;
	};

	this.Hide = () => { Hide(); };
	function Hide() {
		if (m_e_lump.hidden) { return; }

		m_e_edt_frm.hidden = true;
		m_e_lump.hidden = true;
	};
};

g_socketio.on('DN_fmsg', (ary) => { g_doj_fixd_msg.Rcv_DN_fmsg(ary); });
