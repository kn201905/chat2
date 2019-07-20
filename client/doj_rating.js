'use strict';

const Doj_Rating = function() {
	const m_e_raiting = document.createElement('div');
	m_e_raiting.classList.add('rating');
	m_e_raiting.textContent = '▼ 0';
	m_e_raiting.onclick = () => {
		if (g_doj_body_setting.IsVisible()) {
			g_doj_modal_scrn.Hide();
			g_doj_body_setting.Hide();
		} else {
			g_doj_modal_scrn.Show(m_e_raiting.onclick.bind(this), 99);
			g_doj_body_setting.Show();
		}
	};

	this.e_lump = m_e_raiting;
};

const Doj_Body_Setting = function() {
	const m_fontSz_dflt = g_stt.Get_FontSz_dflt();

	// ---------------------------------
	const m_e_lump = document.createElement('div');
	m_e_lump.classList.add('body_setting');
	m_e_lump.hidden = true;
	this.e_lump = m_e_lump;

	const m_e_set_font_sz = document.createElement('div');
	m_e_set_font_sz.textContent = '文字の大きさ ';
	const m_e_slider_font_sz = document.createElement('input');
	m_e_slider_font_sz.type = 'range';
	m_e_slider_font_sz.style.width = '15em';
	m_e_slider_font_sz.min = -4;
	m_e_slider_font_sz.max = 1;
	m_e_slider_font_sz.value = 0;
	m_e_slider_font_sz.onchange = () => {
		const fontSz_cur = m_fontSz_dflt * 0.9 ** (-m_e_slider_font_sz.value);
		g_stt.Chg_FontSz_cur(fontSz_cur);
		
		document.body.style.fontSize = fontSz_cur + 'px';
		// CSSの変更
		document.documentElement.style.setProperty('--btn_font_sz'
			, 0.8 * 0.9 ** (-m_e_slider_font_sz.value));

		// CharPicker、Room、Lobby には先に通知を送っておく
		g_doj_char_pick.Resize(fontSz_cur);

		// その他のリスナに通知を送る
		g_Ntfr_resize.Ntfy_Resize();	
	};
	
	m_e_set_font_sz.appendChild(m_e_slider_font_sz);
	m_e_lump.appendChild(m_e_set_font_sz);

	const m_e_set_LH = document.createElement('div');
	m_e_set_LH.textContent = '１行の高さ　 ';
	const m_e_slider_LH = document.createElement('input');
	m_e_slider_LH.type = 'range';
	m_e_slider_LH.style.width = '15em';
	m_e_slider_LH.min = 1.2;
	m_e_slider_LH.max = 1.8;
	m_e_slider_LH.step = 0.1;
	m_e_slider_LH.value = 1.5;
	m_e_slider_LH.onchange = () => {
		document.body.style.lineHeight = m_e_slider_LH.value;
	};
	m_e_set_LH.appendChild(m_e_slider_LH);
	m_e_lump.appendChild(m_e_set_LH);

	const m_e_btn_crt_room = document.createElement('button');
	m_e_btn_crt_room.classList.add('btn_crt_room');
	m_e_btn_crt_room.textContent = '自分の部屋を作る';
	m_e_btn_crt_room.onclick = () => {
		g_doj_modal_scrn.Hide();
		g_doj_body_setting.Hide();

		g_doj_set_room_prof.Show();
	}
	m_e_lump.appendChild(m_e_btn_crt_room);


	/////////////////////////////////////////////////////////
	this.Show = () => {
		this.Adj_UI();
		m_e_lump.hidden = false;
	}
	this.Hide = () => m_e_lump.hidden = true;
	this.IsVisible = () => !m_e_lump.hidden;

	this.Adj_UI = () => {
		if (g_my_uID < 0 || g_doj_room.IsOpen()) {
			m_e_btn_crt_room.disabled = true;
		} else {
			m_e_btn_crt_room.disabled = false;
		}
	};
};

