'use strict';

////////////////////////////////////////////////////////////////
const Doj_SetRoomProf = function() {
	const m_e_lump = document.createElement('div');
	m_e_lump.hidden = true;
	m_e_lump.classList.add('frm_set_room_prof');

	const m_e_input_msg = document.createElement('textarea');
	m_e_input_msg.classList.add('input_room_prof');
	m_e_input_msg.placeholder = 'ここに部屋のプロフィールを入力してください（100文字まで）';
	m_e_input_msg.onkeyup = () => {
		const len = m_e_input_msg.value.trim().length;
		if (len === 0 || len > 100) {
			m_e_btn_OK.disabled = true;
		} else {
			m_e_btn_OK.disabled = false;
		}
	};
	m_e_lump.appendChild(m_e_input_msg);

	const m_e_btn_area = document.createElement('div');
	m_e_btn_area.style.display = 'table';
	m_e_btn_area.style.width = '100%';
	m_e_btn_area.style.marginTop = '1em';

	const m_e_btn_OK = document.createElement('button');
	m_e_btn_OK.style.cssFloat = 'left';
	m_e_btn_OK.style.padding = '3px 1em';
	m_e_btn_OK.textContent = '部屋を作る';
	m_e_btn_OK.onclick = () => {
		const len = m_e_input_msg.value.trim().length;
		if (len === 0 || len > 100) { return; }

		this.Hide();
		ga_doj_topic[g_doj_topic_slctr.Get_SlctID()].CreateRoom();
	};
	m_e_btn_area.appendChild(m_e_btn_OK);

	const m_e_btn_cancel = document.createElement('button');
	m_e_btn_cancel.style.cssFloat = 'right';
//	m_e_btn_cancel.style.marginRight = '2em';
	m_e_btn_cancel.style.padding = '3px 1em';
	m_e_btn_cancel.textContent = 'キャンセル';
	m_e_btn_cancel.onclick = () => { this.Hide() };
	m_e_btn_area.appendChild(m_e_btn_cancel);
	m_e_lump.appendChild(m_e_btn_area);

	this.e_lump = m_e_lump;

	////////////////////////////////////////
	// メソッド
	this.GetRoomProf = () => m_e_input_msg.value;
/*
	this.Enabled = function() {
		m_e_input_msg.disabled = false;
	};
	this.Disabled = function() {
		m_e_input_msg.disabled = true;
	};
*/
	this.Show = () => {
		if (m_e_input_msg.value.trim().length == 0) {
			m_e_btn_OK.disabled = true;
		} else {
			m_e_btn_OK.disabled = false;
		}

		g_doj_modal_scrn.Show(m_e_btn_cancel.onclick.bind(this));
		m_e_lump.hidden = false
		m_e_input_msg.focus();
	};
	this.Hide = () => {
		g_doj_modal_scrn.Hide();
		m_e_lump.hidden = true
	};

	this.Apnd_CapaSlctr = (doj) => { m_e_lump.insertBefore(doj.e_lump, m_e_btn_area) };
	this.Apnd_TopicSlctr = (doj) => { m_e_lump.insertBefore(doj.e_lump, m_e_btn_area) };
}


////////////////////////////////////////////////////////////////
const Doj_SetRoomCapa = function() {

	const e_span = document.createElement('span');
	e_span.textContent = '部屋の人数を決めて下さい ▶ ';
	e_span.style.fontSize = '0.8em';

	const m_e_select_capa = document.createElement('select');
	for (let i = 2; i <= 15; i++) {
		const e_optn = document.createElement('option');
		e_optn.textContent = i;
		e_optn.value = i;
		m_e_select_capa.appendChild(e_optn);
	}
//	m_e_select_capa.disabled = true;

	const e_lump = document.createElement('div');
	e_lump.appendChild(e_span);
	e_lump.appendChild(m_e_select_capa);
//	e_lump.style.marginTop = '5px';

	this.e_lump = e_lump;

	////////////////////////////////////////
	// メソッド
	this.GetCapa = () => Number(m_e_select_capa.value);
/*
	this.Enabled = function() {
		m_e_select_capa.disabled = false;
	};
	this.Disabled = function() {
		m_e_select_capa.disabled = true;
	};
*/
//	this.Show = () => this.e_lump.hidden = false;
//	this.Hide = () => this.e_lump.hidden = true;
};


////////////////////////////////////////////////////////////////
const Doj_TopicSlctr = function() {
	const m_e_lump = document.createElement('div');
	m_e_lump.style.margin = '0.5em 0 0';
	m_e_lump.style.fontSize = '0.9em';

	const m_e_txt = document.createElement('div');
	m_e_txt.style.marginBottom = '5px';
	m_e_txt.style.fontSize = '0.8em';
	m_e_txt.textContent = '部屋を作る場所を選んで下さい';
	m_e_lump.appendChild(m_e_txt);

	const m_e_table = document.createElement('div');
	m_e_table.style.display = 'table';
	m_e_table.style.cursor = 'default';

	let m_e_topic_focus = null;
	let m_topic_id_focus = 0;
	this.Get_SlctID = () => m_topic_id_focus;

	const len = ga_doj_topic.length;
	for (let idx = 0; idx < len; idx++) {
		const e_topic = document.createElement('div');
		e_topic.classList.add('tbl_cell_topic');
		e_topic.textContent = ga_doj_topic[idx].Get_StrTopic();

		e_topic.onclick = () => {
			m_topic_id_focus = idx;
			m_e_topic_focus.classList.remove('tbl_cell_topic_focus');
			e_topic.classList.add('tbl_cell_topic_focus');
			m_e_topic_focus = e_topic;
		};

		m_e_table.appendChild(e_topic);
	}
	m_e_lump.appendChild(m_e_table);

	m_e_topic_focus = m_e_table.firstChild;
	m_e_topic_focus.classList.add('tbl_cell_topic_focus');

	this.e_lump = m_e_lump;
};
