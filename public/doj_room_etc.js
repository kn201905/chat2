'use strict';

const c_PCS_dspld_log_dflt = 100;

const Doj_Room_etc = function() {
	let m_doj_RI = null;
	this.Init = (doj_RI) => {
		m_doj_RI = doj_RI;
	};

	const m_e_frm_rm_etc = document.createElement('div');
	m_e_frm_rm_etc.classList.add('rm_etc_frm');
//		m_e_frm_rm_etc.hidden = true;  // ここで hidden にしておくと、Edge で不具合が発生する
	this.e_lump = m_e_frm_rm_etc;

	// メンバーリスト（e_memb_stg_ttl + m_e_icon_stg）
	const m_e_memb_stg = Create_FlexStg(m_e_frm_rm_etc);
	m_e_memb_stg.style.marginBottom = '1em';

	const e_memb_stg_ttl = Create_TxtDiv(m_e_memb_stg, '参加者：');
	e_memb_stg_ttl.appendChild(document.createElement('br'));
	const m_e_tnd_num_memb = document.createTextNode('');
	e_memb_stg_ttl.appendChild(m_e_tnd_num_memb);

	const m_e_icon_stg = Create_FlexStg(m_e_memb_stg);
	m_e_icon_stg.style.fontSize = '1rem';

	// 色を変える
	const e_btn_chg_cl = Create_Btn(m_e_frm_rm_etc, '色を変える');
	e_btn_chg_cl.onclick = () => {
		g_doj_color.Set_uview(m_doj_memb_fcsd.Get_uview());
		g_doj_color.Show(RCP_Set_Cl, m_e_uname_fcsd + ' さんが指定している色');
	};

	// 非表示切替
	const m_e_btn_hiddn_memb = Create_Btn(m_e_frm_rm_etc, '非表示切替');
	m_e_btn_hiddn_memb.style.marginLeft = '2em';
	m_e_btn_hiddn_memb.onclick = OnClkBtn_HiddnMemb;

	// 退室させる
	const m_e_btn_memb_out = Create_Btn(m_e_frm_rm_etc, '退室させる');
	m_e_btn_memb_out.style.marginLeft = '1em';
	m_e_btn_memb_out.onclick = OnClkBtn_MembOut;

	// 部屋の人数
	const m_e_zn_capa = Create_FlexStg(m_e_frm_rm_etc);
	m_e_zn_capa.style.borderTop = '1px dotted #999';
	m_e_zn_capa.style.marginTop = '1em';
	m_e_zn_capa.style.paddingTop = '1em';

	const e_ttl_capa = Create_TxtDiv(m_e_zn_capa, '部屋の人数の変更 :');
	e_ttl_capa.style.padding = '0.4em 1em 0 0';

	const m_e_select_capa = document.createElement('select');
	for (let i = 2; i <= 15; i++) {
		const e_optn = document.createElement('option');
		e_optn.textContent = i;
		e_optn.value = i;
		m_e_select_capa.appendChild(e_optn);
	}
	m_e_zn_capa.appendChild(m_e_select_capa);

	const m_e_btn_capa = Create_Btn(m_e_zn_capa, '人数を変更する');
	m_e_btn_capa.style.marginLeft = '1em';
	m_e_btn_capa.onclick = Chg_Capa;

	// ログの表示数
	const m_e_zn_pcs_log = Create_FlexStg(m_e_frm_rm_etc);
	m_e_zn_pcs_log.style.marginTop = '1em';

	const e_ttl_pcs_log = Create_TxtDiv(m_e_zn_pcs_log, 'ログの表示数 :');
	e_ttl_pcs_log.style.paddingTop = '0.4em';

	const m_e_ipt_pcs_log = document.createElement('input');
	m_e_ipt_pcs_log.style.width = '4em';
	m_e_ipt_pcs_log.style.textAlign = 'center';
	m_e_ipt_pcs_log.type = 'number';
	m_e_ipt_pcs_log.value = c_PCS_dspld_log_dflt;
	m_e_ipt_pcs_log.style.margin = '0 1em';
	m_e_zn_pcs_log.appendChild(m_e_ipt_pcs_log);

	const e_btn_pcs_log = Create_Btn(m_e_zn_pcs_log, '表示数を変更する');
	e_btn_pcs_log.onclick = Set_pcs_dspld_log;

	// 閉じるボタン
	// Edge の場合、wrapper の div をつけておかないと、再表示時にボタンが非表示となる。原因不明
	const e_wrp_btn_close = document.createElement('div');
	e_wrp_btn_close.style.textAlign = 'right';
	m_e_frm_rm_etc.appendChild(e_wrp_btn_close);

	const m_e_btn_close = Create_Btn(e_wrp_btn_close, '閉じる');
	m_e_btn_close.onclick = Hide;


	///////////////////////////////////////////////
	function Set_pcs_dspld_log() {
		const pcs_log = m_e_ipt_pcs_log.value;
		if (pcs_log < 10) {
			m_e_ipt_pcs_log.value = g_Room_Voices.Get_max_pcs_dspld_vc();
			return;
		}
		g_Room_Voices.Set_max_pcs_dspld_vc(pcs_log);
	}

	this.Hide = () => { Hide(); }
	function Hide() {
		m_e_frm_rm_etc.hidden = true;
	}
	
	// フォーカスされたアイテムの情報を保持する変数
	let m_e_uview_fcsd;
	let m_e_icon_fcsd;
	let m_e_icon_mask_fcsd;
	let m_e_uname_fcsd;
	let m_doj_memb_fcsd;

	this.Show = () => { Show(); }
	function Show() {
		m_e_tnd_num_memb.nodeValue
			= '(' + m_doj_RI.Get_num_member() + '/' + m_doj_RI.Get_capa() + ')';

		// アイコンステージの生成
		m_e_icon_stg.textContent = '';

		m_e_uview_fcsd = null;
		const a_doj_member = m_doj_RI.Get_a_doj_member();
		for (const doj_member of a_doj_member) {
			// [uID, uname, uview]
			const uINV = doj_member.Get_uINV();
			const uview = uINV[2];

			// a_uview: [e_uview, e_icon_Rm]
			const a_uview = Crt_View_vc_uview(uview, uINV[1]);  // uINV[1]: name
			const e_uview = a_uview[0];  // e_uview は div
			e_uview.classList.add('rm_etc_uview');
			if (g_stt.b_Mobile) {
				e_uview.style.marginRight = '0.5em';
			} else {
				e_uview.style.marginRight = '1em';
			}
			m_e_icon_stg.appendChild(e_uview);

			const e_img_mask = document.createElement('div');
			e_img_mask.classList.add('rm_etc_uview_mask');
			e_img_mask.hidden = true;
			e_uview.appendChild(e_img_mask);

			const str_S_RGB = '#' + ('00' + ((uview & 0xfff00) >>> 8).toString(16)).substr(-3);
			if (m_e_uview_fcsd == null) {
				m_e_uview_fcsd = e_uview;
				m_e_icon_fcsd = a_uview[1];  // a_uview[1]: e_icon_Rm
				m_e_icon_mask_fcsd = e_img_mask;
				m_e_uname_fcsd = uINV[1];  // uINV[1]: name
				m_doj_memb_fcsd = doj_member;

				e_uview.style.borderColor = str_S_RGB;
				e_uview.style.boxShadow = '2px 2px 2px' + str_S_RGB;
			}

			e_uview.onclick = () => {
				m_e_uview_fcsd.style.borderColor = 'transparent';
				m_e_uview_fcsd.style.boxShadow = '';

				e_uview.style.borderColor = str_S_RGB;
				e_uview.style.boxShadow = '2px 2px 2px' + str_S_RGB;

				m_e_uview_fcsd = e_uview;
				m_e_icon_fcsd = a_uview[1];  // a_uview[1]: e_icon_Rm
				m_e_icon_mask_fcsd = e_img_mask;
				m_e_uname_fcsd = uINV[1];  // uINV[1]: name
				m_doj_memb_fcsd = doj_member;
			};

			// mask の設定
			if (m_doj_RI.Is_uHiddn(uINV[0])) { e_img_mask.hidden = false; }
		}

		// セレクトボックスの初期化
		m_e_select_capa.value = m_doj_RI.Get_capa();

		// 管理者権限のエレメントのチェック
		if (m_doj_RI.Get_HostID() === g_my_uID) {
			m_e_btn_memb_out.disabled = false;
			m_e_select_capa.disabled = false;
			m_e_btn_capa.disabled = false;
		} else {
			m_e_btn_memb_out.disabled = true;
			m_e_select_capa.disabled = true;
			m_e_btn_capa.disabled = true;
		}

		m_e_frm_rm_etc.hidden = false;
	}

	// frm_etc 上の「色の変更を確定する」に対する RCP
	function RCP_Set_Cl(val_RGB, str_RGB) {
		const uID_fcsd = m_doj_memb_fcsd.Get_uID();
		const str_S_RGB = '#' + str_RGB;

		// まず、room 内の表示を変更（room_voices に対する更新）
		if (uID_fcsd == g_my_uID) {
			// 自分の色の変更は、他のユーザに配信する（登録される uview は強制的に ref cl == cur cl となる）
			g_socketio.emit('UP_chgCl', [uID_fcsd, val_RGB]);  // -> room_room_info.js で受ける
		} else {
			// 他ユーザの色は、cur 部分のみを変更（doj_RI と doj_member の両方とも更新する）
			m_doj_RI.Chg_CurCl(uID_fcsd, val_RGB);
			g_Room_Voices.ChgCl(uID_fcsd, str_S_RGB);
		}

		// 次に、frm_etc の表示を更新
		m_e_icon_fcsd.style.backgroundColor = str_S_RGB;
		m_e_uview_fcsd.style.borderColor = str_S_RGB;
		m_e_uview_fcsd.style.boxShadow = '2px 2px 2px' + str_S_RGB;
	}

	this.Rcp_Resize = () => {
		if (m_e_frm_rm_etc.hidden) { return; }
		this.Show();
	};
	g_Ntfr_resize.Append(this);

	// -----------------------------------------
	// 人数変更
	let m_e_txt_1, m_e_txt_2;
	function Chg_Capa() {
		g_socketio.emit('UP_chgCapa', [g_my_uID, Number(m_e_select_capa.value)]);

		m_e_txt_1 = g_dlg_bx.Crt_Div();
		m_e_txt_1.textContent = '部屋の人数を変更中です。';

		m_e_txt_2 = g_dlg_bx.Crt_Div();
		m_e_txt_2.style.color = '#ccc';
		m_e_txt_2.textContent = '▶▶▶ 変更を完了しました。';

		g_dlg_bx.Dsbl_1st_Btn();
		g_dlg_bx.Show();
	}

	this.Rcv_DN_chgCapa_ChgSttDLG = (new_capa) => {
		m_e_txt_2.style.color = '#000';
		if (new_capa === 0) {
			m_e_txt_2.textContent = '▶▶▶ 変更に失敗しました。';
		} else {
			m_e_tnd_num_memb.nodeValue
				= '(' + m_doj_RI.Get_num_member() + '/' + new_capa + ')';
		}

		g_dlg_bx.Enbl_1st_Btn();
		g_dlg_bx.Enbl_Close_outFrm();
	};

	this.Chg_capa = (new_capa) => {
		if (!m_e_frm_rm_etc.hidden) {
			m_e_tnd_num_memb.nodeValue = '(' + m_doj_RI.Get_num_member() + '/' + new_capa + ')';
			m_e_select_capa.value = new_capa;
		}
	};

	//------------------------------------------------
	// 非表示切替
	function OnClkBtn_HiddnMemb() {
		const uID = m_doj_memb_fcsd.Get_uID();

		if (uID === g_my_uID) {
			g_dlg_bx.Show_Txt('自分自身を非表示にすることはできません。', true);
			return;
		}

		//「その他」画面の表示変更
		const b_hiddn_utxt = m_e_icon_mask_fcsd.hidden;
		m_e_icon_mask_fcsd.hidden = !b_hiddn_utxt;

		// 今後の設定を登録する
		m_doj_RI.Hiddn_usr(uID, b_hiddn_utxt);
		// 現在表示されているのものについて、操作を行う
		g_Room_Voices.Hiddn_utxt(uID, b_hiddn_utxt);
	}

	//------------------------------------------------
	// 強制退室
	function OnClkBtn_MembOut() {
		if (m_doj_memb_fcsd.Get_uID() === g_my_uID) {
			g_dlg_bx.Show_Txt('自分自身を退室させることはできません。', true);
			return;
		}

		const e_div = g_dlg_bx.Crt_Div();
		e_div.style.display = 'flex';

		const e_txt_1 = Create_TxtDiv(e_div, '本当に');
		e_txt_1.style.margin = '1em 1em 0 0';

		const e_uview_clnd = m_e_uview_fcsd.cloneNode(true);
		e_uview_clnd.style.margin = 0;
		e_div.appendChild(e_uview_clnd);

		const e_txt_2 = Create_TxtDiv(e_div, '　さんを退室させますか？');
		e_txt_2.style.margin = '1em 0 0 0.5em';

		// 第１ボタンをクリックしたら、Emit_MembOut へ
		g_dlg_bx.Set_2Btns(null, Emit_MembOut);
		g_dlg_bx.Show();
	}

	function Emit_MembOut() {
		g_socketio.emit('UP_membOut', [g_my_uID, m_doj_memb_fcsd.Get_uID()]);

		g_dlg_bx.Close();
		// その他パネルを閉じておく（「...さんが退室しました」のメッセージで確認可能）
		Hide();

		m_e_txt_1 = g_dlg_bx.Crt_Div();
		m_e_txt_1.textContent = '退室処理中です。';

		m_e_txt_2 = g_dlg_bx.Crt_Div();
		m_e_txt_2.style.color = '#ccc';
		m_e_txt_2.textContent = '▶▶▶ 退室処理を完了しました。';

		g_dlg_bx.Dsbl_1st_Btn();
		g_dlg_bx.Show();
	}

	this.Rcv_DN_membOut = (b_success) => {
		if (!b_success) {
			m_e_txt_2.textContent = '▶▶▶ スーパーユーザに退室指示はできません。';
		}
		m_e_txt_2.style.color = '#000';

		g_dlg_bx.Enbl_1st_Btn();
		g_dlg_bx.Enbl_Close_outFrm();
	};
}; // Doj_Room_etc


	//------------------------------------------------
// ary: [rmID, new_capa]
g_socketio.on('DN_chgCapa', (ary) => {
	const rmID = ary[0];
	const new_capa = ary[1];
	const rm_doj_RI = ga_mng_doj_RI.Search_byRmID(rmID);

	// 何らかのタイミングで部屋が消滅していることもある
	if (rm_doj_RI === null) { return; }

	if (g_my_uID === rm_doj_RI.Get_HostID()) {
		// 自分が、変更された部屋のホストであった場合
		g_doj_room_etc.Rcv_DN_chgCapa_ChgSttDLG(new_capa);
	}

	// 自分がいる部屋の人数が変更された場合（その他パネルを開いてる場合に備えて）
	if (g_doj_room.IsOpen() && g_doj_room.Get_RmID() == rmID) {
		g_doj_room_etc.Chg_capa(new_capa);
	}

	// Lobby RI の更新
	rm_doj_RI.Chg_capa(new_capa);
});

//------------------------------------------------
// 強制退室関連
// g_socketio.on('DN_FcdOut', () => { g_doj_room.FcdOut_Close(); });
g_socketio.on('DN_membOut', (b_success) => { g_doj_room_etc.Rcv_DN_membOut(b_success); });

