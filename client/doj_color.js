'use strict';

const Doj_Slider = function(ttl, RCP_chg_cl) {
	const m_e_frm = document.createElement('div');
	this.e_lump = m_e_frm;

	const e_fbx_ttl = document.createElement('div');
	m_e_frm.appendChild(e_fbx_ttl);

	e_fbx_ttl.appendChild(document.createTextNode(ttl));

	const m_e_ipt_num = document.createElement('input');
	m_e_ipt_num.style.width = '2em';
	m_e_ipt_num.style.textAlign = 'center';
	m_e_ipt_num.disabled = true;
	m_e_ipt_num.value = 0;
	e_fbx_ttl.appendChild(m_e_ipt_num);
	

	const e_fbx_bar = document.createElement('div');
	m_e_frm.appendChild(e_fbx_bar);

	const m_e_ipt_bar = document.createElement('input');
	m_e_ipt_bar.type = 'range';
	if (g_stt.b_Mobile) {
		m_e_ipt_bar.style.width = '100%';
	} else {
		m_e_frm.style.display = 'flex';
		e_fbx_ttl.style.marginRight = '1em';
		e_fbx_bar.style.flexGrow = 5;
		m_e_ipt_bar.style.width = '100%';
	}
	m_e_ipt_bar.min = 0;
	m_e_ipt_bar.max = 15;
	m_e_ipt_bar.step = 1;
	if (RCP_chg_cl === null) {
		m_e_ipt_bar.disabled = true;
	} else {
		m_e_ipt_bar.onchange = () => {
			const val = Number(m_e_ipt_bar.value);
			m_e_ipt_num.value = val;
			RCP_chg_cl(val);
		};
	}
	e_fbx_bar.appendChild(m_e_ipt_bar);

	this.Set_val = (val) => {
		m_e_ipt_num.value = val;
		m_e_ipt_bar.value = val;
	};
};


const Doj_Color = function() {
	const m_e_frm = document.createElement('div');
	m_e_frm.classList.add('frm_cl');
	m_e_frm.hidden = true;
	this.e_lump = m_e_frm;

	const e_div_ttl = document.createElement('div');
	m_e_frm.appendChild(e_div_ttl);

	const m_e_btn_set_cl = document.createElement('button');
	m_e_btn_set_cl.classList.add('btn_cl');
	m_e_btn_set_cl.textContent = '色の変更を確定する';
	m_e_btn_set_cl.onclick = OnClk_SetCl;
	e_div_ttl.appendChild(m_e_btn_set_cl);

	const m_e_btn_close = document.createElement('button');
	m_e_btn_close.classList.add('btn_cl');
	m_e_btn_close.style.cssFloat = 'right';
	m_e_btn_close.textContent = '閉じる';
	m_e_btn_close.onclick = Hide;
	e_div_ttl.appendChild(m_e_btn_close);


	const m_e_uvc_stg = document.createElement('div');
	m_e_uvc_stg.classList.add('rm_uvc_stg');
	m_e_uvc_stg.style.marginTop = '1em';
//	m_e_uvc_stg.style.margin = '1em';
	m_e_frm.appendChild(m_e_uvc_stg);

	const m_e_uview = document.createElement('div');
	m_e_uvc_stg.appendChild(m_e_uview);
	let m_e_img_uview = null;  // m_e_uview に appendChild される e_img
	let m_uview_cur = -1;

	const m_e_bln1 = document.createElement('div');
	m_e_bln1.classList.add('rm_uvc_bln1');
	m_e_uvc_stg.appendChild(m_e_bln1);

	const m_e_bln2 = document.createElement('div');
	m_e_bln2.classList.add('rm_uvc_bln2');
	m_e_bln2.style.borderRight = '12px solid #000';
	m_e_bln2.style.zIndex = 56;
	m_e_bln1.appendChild(m_e_bln2);

	const m_e_utxt = document.createElement('div');
	m_e_utxt.classList.add('rm_uvc_utxt');
	m_e_utxt.style.backgroundColor = '#000';
	m_e_utxt.textContent = 'あいうえお　かきくけこ　さしすせそ　たちつてと';

	// flex を用いても、e_out_txt が必要であった（height調整のため）
	const e_out_txt = document.createElement('div');
	e_out_txt.appendChild(m_e_utxt);
	m_e_uvc_stg.appendChild(e_out_txt);


	const m_doj_sldr_red = new Doj_Slider('赤　', RCP_Chg_R);
	m_e_frm.appendChild(m_doj_sldr_red.e_lump);

	const m_doj_sldr_green = new Doj_Slider('緑　', RCP_Chg_G);
	m_e_frm.appendChild(m_doj_sldr_green.e_lump);

	const m_doj_sldr_blue = new Doj_Slider('青　', RCP_Chg_B);
	m_e_frm.appendChild(m_doj_sldr_blue.e_lump);

	// refernce 部分
	const m_e_ttl_ref = document.createElement('div');
	m_e_ttl_ref.style.margin = '1em 0 0.5em';
	m_e_ttl_ref.style.paddingTop = '0.5em';
	m_e_ttl_ref.style.borderTop = '2px dotted #888';
	m_e_frm.appendChild(m_e_ttl_ref);

	const m_tnd_ttl_ref = document.createTextNode('');
	m_e_ttl_ref.appendChild(m_tnd_ttl_ref);

	const e_btn_cpy_ref = document.createElement('button');
	e_btn_cpy_ref.classList.add('btn_cl');
	e_btn_cpy_ref.style.marginLeft = '1em';
	e_btn_cpy_ref.textContent = '下の色を上にコピーする';
	e_btn_cpy_ref.onclick = Set_RefColor;
	m_e_ttl_ref.appendChild(e_btn_cpy_ref);

	const m_doj_sldr_ref_R = new Doj_Slider('赤　', null);
	m_e_frm.appendChild(m_doj_sldr_ref_R.e_lump);

	const m_doj_sldr_ref_G = new Doj_Slider('緑　', null);
	m_e_frm.appendChild(m_doj_sldr_ref_G.e_lump);

	const m_doj_sldr_ref_B = new Doj_Slider('青　', null);
	m_e_frm.appendChild(m_doj_sldr_ref_B.e_lump);


	////////////////////////////////////////
	let m_val_R, m_val_G, m_val_B;
	let m_str_R, m_str_G, m_str_B;
	let m_RCP_Set_Cl ;

	let m_val_ref_R, m_val_ref_G, m_val_ref_B;
	let m_str_ref_R, m_str_ref_G, m_str_ref_B;

	// Set_uview() で、表示画像を指定した後、Show() をコールする
	// 結果は、RCP_Set_Cl(val_RGB, str_RGB) で受ける
	this.Show = (RCP_Set_Cl, str_ref) => {
		m_RCP_Set_Cl = RCP_Set_Cl;
		m_tnd_ttl_ref.nodeValue = str_ref;
		m_e_frm.hidden = false;
	}
	this.Hide = () => { Hide(); };
	function Hide() { m_e_frm.hidden = true; }

	this.Set_uview = (uview) => {
		if (uview === m_uview_cur) { return; }
		if (m_e_img_uview !== null) { m_e_uview.removeChild(m_e_img_uview); }

		m_e_img_uview = g_doj_char_pick.GetCln_e_icon_Rm(uview);
		m_e_uview.appendChild(m_e_img_uview);
		m_uview_cur = uview;

		m_val_R = (uview & 0xf0000) >>> 16;
		m_val_G = (uview & 0xf000) >>> 12;
		m_val_B = (uview & 0xf00) >>> 8;

		m_str_R = m_val_R.toString(16);
		m_str_G = m_val_G.toString(16);
		m_str_B = m_val_B.toString(16);

		m_doj_sldr_red.Set_val(m_val_R);
		m_doj_sldr_green.Set_val(m_val_G);
		m_doj_sldr_blue.Set_val(m_val_B);

		const bg_cl = '#' + m_str_R + m_str_G + m_str_B;
		m_e_utxt.style.backgroundColor = bg_cl;
		m_e_bln2.style.borderRight = '12px solid ' + bg_cl;

		m_val_ref_R = (uview & 0xf0000000) >>> 28;
		m_val_ref_G = (uview & 0xf000000) >>> 24;
		m_val_ref_B = (uview & 0xf00000) >>> 20;

		m_str_ref_R = m_val_ref_R.toString(16);
		m_str_ref_G = m_val_ref_G.toString(16);
		m_str_ref_B = m_val_ref_B.toString(16);

		m_doj_sldr_ref_R.Set_val(m_val_ref_R);
		m_doj_sldr_ref_G.Set_val(m_val_ref_G);
		m_doj_sldr_ref_B.Set_val(m_val_ref_B);
	};

	function RCP_Chg_R(val) {
		m_val_R = val;
		m_str_R = val.toString(16);
		Change_Color();
	}

	function RCP_Chg_G(val) {
		m_val_G = val;
		m_str_G = val.toString(16);
		Change_Color();
	}

	function RCP_Chg_B(val) {
		m_val_B = val;
		m_str_B = val.toString(16);
		Change_Color();
	}

	function Set_RefColor() {
		m_doj_sldr_red.Set_val(m_val_ref_R);
		m_doj_sldr_green.Set_val(m_val_ref_G);
		m_doj_sldr_blue.Set_val(m_val_ref_B);

		m_val_R = m_val_ref_R;  m_val_G = m_val_ref_G;  m_val_B = m_val_ref_B;
		m_str_R = m_str_ref_R;  m_str_G = m_str_ref_G;  m_str_B = m_str_ref_B;

		Change_Color();
	}

	function Change_Color() {
		const bg_cl = '#' + m_str_R + m_str_G + m_str_B;
		m_e_utxt.style.backgroundColor = bg_cl;
		m_e_bln2.style.borderRight = '12px solid ' + bg_cl;
		m_e_img_uview.style.backgroundColor = bg_cl;
	}

	function OnClk_SetCl() {
		Hide();
		m_RCP_Set_Cl((m_val_R << 8) + (m_val_G << 4) + m_val_B, m_str_R + m_str_G + m_str_B);
	}
};

