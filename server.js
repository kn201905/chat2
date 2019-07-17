'use strict';

const c_MAX_Idx_uview = 6;  // 現在の idx は 0 から 6 ということ

const port_server = require('./port_server.js');
const num_port = port_server.num_port;
const IP_dev_1 = port_server.IP_dev_1;

const c_SU_PASS = 'abcde';

const c_msec_uID_exprd = 1800 * 1000;  // uID が変更可能となるミリ秒数
const c_msec_qry_udata_lmt = 60 * 1000;  // 現在は、制限時間を１分としている
const c_MAX_qry_udata = 29;  // 現在、AsGuest での SVL init 数は５０までと想定している

// 接続状態の IPで、c_msec_uID_exprd 以内に uID を作ろうとした場合
const c_ERR_crt_usr_notDscnct = -1;
// 切断はしているが、c_msec_uID_exprd 以内に、異なる uname, uview で uID を作ろうとした場合
const c_ERR_crt_usr_dfName = -2;



/////////////////////////////////////////////////////////
// RI
// [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
const IX_RI_uID = 3;
const IX_RI_uname = 4;
const IX_RI_uview = 5;

// SVL
// [user_id, type, contents]
const IX_VcTYPE_enter_usr = 1;
const IX_VcTYPE_exit_usr = 2;
const IX_VcTYPE_chgHst = 3;
const IX_VcTYPE_chg_fmsg = 4;
const IX_VcTYPE_chg_cl = 5;

const IX_VcTYPE_umsg = 10;


/////////////////////////////////////////////////////////
// ログの準備
const fs = require('fs');
const fs_ws = fs.createWriteStream('./info.log', {flags: 'a'});
// 本来は、ready イベントを受け取るまで待つべき。
// 'ready' 以前に write を行っていると、恐らく 'drain' イベントが発生していると思われる
const Log = function(str) {
	const date = new Date();
	fs_ws.write(date.getHours() + ':' + date.getMinutes() + ' ' + str + '\n');
};


/////////////////////////////////////////////////////////
// 外部ファイルとの連携
const SPRSr_rld = require('./SPRSr_rld.js');
SPRSr_rld.Set_Log(Log);
const g_SPRSr_rld = SPRSr_rld.g_SPRSr_rld;


/////////////////////////////////////////////////////////
// リソースの準備
const app = require('http').createServer((req, res) => {
	res.writeHead(200);
	res.end();
});
const io = require('socket.io')(app);
app.listen(num_port, () => {
	Log('\n >>>>> listen 開始 / ポート番号：' + num_port + '\n >>>>> IP_dev_1 : ' + IP_dev_1);
});

/////////////////////////////////////////////////////////

// =================================================
// 部屋ログは、C++で実装する予定
// =================================================

function VoiceLog() {
	const ma_voices = [];
	// シーケンシャルにカウントアップする。通信エラーの検出用
	// 0以上の値を取り、最新の voice が ma_voices[m_ix_vc] となる
	// 保存している voice の個数が、m_ix_vc +1 個となる
	let m_ix_vc = -1;

	// [uID, type, contents]
	// 戻り値は、ix_vc
	this.Push = (voice) => {
		m_ix_vc++;
		ma_voices.push(voice);
		return m_ix_vc;  // ≧ 0
	};

	// pcs 個以下の voice の配列が返される
	// [[vc], [vc], ...], ix_vc]
	this.Get = (pcs) => {
		pcs--;
		if (pcs >= m_ix_vc) { return [ma_voices, m_ix_vc]; }

		// [[vc], [vc], ... ,[vc]]
		//                    ↑ m_ix_vc（≧ 0）
		return [ma_voices.slice(m_ix_vc - pcs, m_ix_vc + 1), m_ix_vc];
	};

	this.GetAt = (ix) => ma_voices[ix];
	this.Get_LastIX = () => m_ix_vc;
}


/////////////////////////////////////////////////////////

const ga_uID = [];  // 重複なし　uIX の検索用
// 以下は uIX でアクセスすること
const ga_uname = [];
const ga_uview = [];
const ga_uSockID = [];  // 重複なし
const ga_uSock = [];  // 鯖側から発信を行うため
const ga_uIP = [];  // 重複「あり」
const ga_uRmID = [];  // 未入室の場合は -1
//const ga_uEnt_time = [];  // 入室時刻（未入室の場合は -1）
const ga_uQryUdata_lmttime = [];  // 使用可能でない場合は -1
const ga_uID_crt_time = [];  // 現在の ID を作成した時刻
const ga_uDiscnct_time = [];  // 接続中は -1

const ga_uRt_sockID = [];  // E or R
const ga_uRt_time = [];


// 現時点で存在している部屋の記録
const ga_room_rmID = [];  // rmIX の検索用（情報としては、ga_room_info に含まれている）
// 以下は rmIX でアクセスすること
const ga_room_info = [];  // // [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
const ga_room_VcLog = [];  // 配列の要素は VoiceLog オブジェクト
const ga_room_fmsg_n = [];

// ga_room_VcLog の全情報を保存
// どの部屋で発言を行ったかを追跡できるようにするために、room_id と topic_id だけは保存している
// [[topic_id, room_id, VcLog], ...]
const ga_VcLog_all = [];


//------------------------------------------------
// ▶ 今は ID はシーケンシャルに降り出しているが、将来的には乱数とする（あと、境界チェックも）
// スーパーユーザの ID は 1 から 999
const c_MAX_su_uID = 999;
const Fctry_su_uID = new function() {
	let cnt_uID = 0;
	this.Get_NewID = () => {
		cnt_uID++;
		return cnt_uID;
	};
};

// 一般ユーザの ID は 1000 以上
const Fctry_odnry_uID = new function() {
	let cnt_uID = 999;
	this.Get_NewID = () => {
		cnt_uID++;
		return cnt_uID;
	};
};

let g_cnt_rmID = 0;


//------------------------------------------------
// 接続（組み込み型イベント）
io.on('connection', (socket) => {

	if (!g_SPRSr_rld.Check(socket)) { return; }
	Log('coonection: ' + socket.handshake.address);

	socket.on('UP_qry_cnct', () => { g_SPRSr_rld.Rcv_UP_qry_cnct(socket); });

	//------------------------------------------------
	// [su_pass, uname, uview]
	socket.on('UP_new_usr', (ary) => {
		if (!Array.isArray(ary)) { return; }
		if (ary.length !== 3 || typeof ary[1] !== 'string') { return; }

		const len_uname = ary[1].length;
		if (len_uname === 0 || len_uname > 10) { return; }

		// uview のチェック
		const uview = ary[2];
		if (!Number.isInteger(uview)) { return; }
		if ((uview & 0xff) > c_MAX_Idx_uview) { return; }
		
		// 多重接続のチェック
		let uID;
//		if (ary[0] === c_SU_PASS) {  // ary[0]: su_pass
		if (socket.handshake.address === IP_dev_1) {
			// スーパーユーザは常に uID が発行される
			uID = Fctry_su_uID.Get_NewID();
		} else {
			// 一般ユーザの uID 発行
			const uIX = ga_uIP.lastIndexOf(socket.handshake.address);
			if (uIX >= 0) {
				const elps_msec = Date.now() - ga_uID_crt_time[uIX];

				// 一度ブラウザを閉じて、時間をおいて再接続した場合、ここにくる場合がある
				if (elps_msec < c_msec_uID_exprd) {
					
					// リロードするなどをして、制限時間内に、再度 uID を作ろうとした場合など
					if (ga_uDiscnct_time[uIX] < 0) {
						// 接続状態の IPで、c_msec_uID_exprd 以内に uID を作ろうとした場合
						socket.emit('DN_crtd_usr', [c_ERR_crt_usr_notDscnct, elps_msec]);
						return;
					}

					if (ga_uname[uIX] !== ary[1]) {
						// 制限時間内に、異なる名前で uID を作ろうとしている場合
						socket.emit('DN_crtd_usr', [c_ERR_crt_usr_dfName, elps_msec]);
						return;
					}

					const rgst_uview = ga_uview[uIX];
					const up_uview = ary[2];
					if ((rgst_uview & 0xff) !== (up_uview & 0xff)) {
						// 制限時間内に、異なる uview で uID を作ろうとしている場合
						socket.emit('DN_crtd_usr', [c_ERR_crt_usr_dfName, elps_msec]);
						return;
					}
				}
				// 制限時間内に同一IPから uID を要求された場合でも、
				// disconnect した後で、同じ uname、uview であれば、uID を再発行する
			}
			uID = Fctry_odnry_uID.Get_NewID();
		}

		ga_uID.push(uID);
		ga_uname.push(ary[1]);  // ary[1]: uname
		ga_uview.push(uview);
		ga_uSockID.push(socket.id);
		ga_uSock.push(socket);
		ga_uIP.push(socket.handshake.address);
		ga_uRmID.push(-1);
		ga_uQryUdata_lmttime.push(-1);
		ga_uID_crt_time.push(Date.now());
		ga_uDiscnct_time.push(-1);

		Log('UP_new_usr: ' + uID + ' ' + ary[1]);  // ary[1]: uname

		socket.emit('DN_crtd_usr', uID);
	});

	//------------------------------------------------
	// RI
	// [topic_id, capa, str_room_prof, [uID] (, [uname], [uview], room_id)]
	// init_RI する際に、topic_id が合った方が処理が楽
	socket.on('UP_new_Rm', (ary) => {
		if (!Array.isArray(ary)) { return; }
		if (ary.length !== 4 || typeof ary[2] !== 'string' || !Array.isArray(ary[3])) { return; }

		const len_rm_prof = ary[2].length;
		if (len_rm_prof === 0 || len_rm_prof > 100) { return; }

		// 配列形式であるが、'UP_new_Rm' の時点では要素はホスト１名のみ
		const hst_uID = ary[3][0];  // ary[3]: [uID]
		if (!Number.isInteger(hst_uID) || ary[3].length !== 1) { return; }
	
		const hst_uIX = ga_uID.indexOf(hst_uID);
		if (hst_uIX < 0) { return; }
		const hst_uview = ga_uview[hst_uIX];

		if (socket.id !== ga_uSockID[hst_uIX]) { return; }
		if (ga_uRmID[hst_uIX] >= 0) { return; }

		// -----------------------------
		Log('UP_new_Rm: ' + hst_uID + ' ' + ga_uname[hst_uIX]);

		ary.push([ga_uname[hst_uIX]]);
		ary.push([hst_uview]);
		ary.push(g_cnt_rmID);  // room_id 情報を付加

		ga_room_rmID.push(g_cnt_rmID);
		ga_room_info.push(ary);
		const vc_log = new VoiceLog();
		ga_room_VcLog.push(vc_log);
		ga_room_fmsg_n.push('');

		ga_uRmID[hst_uIX] = g_cnt_rmID;
		ga_uQryUdata_lmttime[hst_uIX] = -1;

		// ##### ここで、サーバー上に部屋が作られる #####
		socket.join(g_cnt_rmID);

		//「入室しました」の SVL を push
		// 新規作成の部屋であるから、hst_uID 以外は誰もいない -> emit する必要はない
		// さらに、この場合の vcIX は、常に 0 となることに留意
		vc_log.Push([hst_uID, IX_VcTYPE_enter_usr]);

		socket.emit('DN_new_RmID', g_cnt_rmID);
		g_cnt_rmID++;

		// 作成者以外の全ユーザに、新しく部屋ができたことを通知（doj_RI の更新）
		socket.broadcast.emit('DN_crtd_new_RI', ary);
	});

	//------------------------------------------------
	socket.on('UP_READY', () => {
		if (ga_uSockID.indexOf(socket.id) < 0) { return; }

		socket.emit('DN_READY', null);
	});

	socket.on('UP_READY_DBG', (str) => {
		if (ga_uSockID.indexOf(socket.id) < 0) { return; }
		Log('UP_READY / ' + str);

		socket.emit('DN_READY', null);
	});

	//------------------------------------------------
	// 部屋からユーザを削除する
	socket.on('UP_rmvMe', (uID) => {
		// 正当性のチェック
		if (!Number.isInteger(uID)) { return; }
		const uIX = ga_uID.indexOf(uID);
		if (uIX < 0) { return; }
		if (socket.id !== ga_uSockID[uIX]) { return; }

		const rmID = ga_uRmID[uIX];
		if (rmID < 0) { return; }
		ga_uRmID[uIX] = -1;

		const rmIX = ga_room_rmID.indexOf(rmID);
		if (rmIX < 0) { return; }

		RemoveUsr(socket, rmIX, uID);
	});

	//------------------------------------------------
	// 指定された部屋に入れるかどうかのチェック
	// [room_ID, uID]
	socket.on('UP_CanEnt_me', (ary) => {
		if (!Array.isArray(ary) || ary.length !== 2) { return; }

		const rmID = ary[0];
		const uID = ary[1];
		if (!Number.isInteger(rmID) || !Number.isInteger(uID)) { return; }

		// uID のチェック
		const uIX = ga_uID.indexOf(uID);
		if (uIX < 0) { return; }
		if (socket.id !== ga_uSockID[uIX]) { return; }
		if (ga_uRmID[uIX] >= 0) { return; }

		// rmID のチェック
		const rmIX = ga_room_rmID.indexOf(rmID);
		if (rmIX < 0) { return; }

		Log('UP_CanEnt_me: ' + uID + ' ' + ga_uname[uIX]);

		// RI [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
		const RI = ga_room_info[rmIX];
		const capa = RI[1];
		const a_uID = RI[IX_RI_uID];
		const a_uname = RI[IX_RI_uname];
		const a_uview = RI[IX_RI_uview];

		if (a_uID.length >= capa) {
			// 恐らくタイミングにより、人数オーバーを起こしている
			// SVL は常に１以上であるため、[] は入室不可であったことを表す
			socket.emit('DN_CanEnt_me', []);
			return;
		}

		// -----------------------------
		// 入室処理を実行
		const join_uview = ga_uview[uIX];
		ga_uRmID[uIX] = rmID;
		ga_uQryUdata_lmttime[uIX] = Date.now() + c_msec_qry_udata_lmt;

		// サーバRI に情報付加

		a_uID.push(uID);
		a_uname.push(ga_uname[uIX]);
		a_uview.push(join_uview);

		// SVL に記録
		const vc_log = ga_room_VcLog[rmIX];
		//「uID さんが入室しました」
		const vcIX = vc_log.Push([uID, IX_VcTYPE_enter_usr]);

		socket.join(rmID);
		// 「送信者以外に」に、RI に変化があったことを通知
		// vcIX を考えても、送信者には送る必要がない。後で、vc_log.Get() で vcIX を込めて送られる
		// 通知を受け取った者が、その部屋にいたら、「uID さんが入室しました」も表示すること
		socket.broadcast.emit('DN_addUser', [rmID, uID, ga_uname[uIX], join_uview, vcIX]);

		// 入室が許可されたことを通知
		// ▶ vc_log.Get() の pcs は、今後設定できるようにすること
		// [[vcの配列, m_ix_vc], fmsg_n}
		socket.emit('DN_CanEnt_me', [vc_log.Get(c_MAX_qry_udata + 1), ga_room_fmsg_n[rmIX]]);
	});

	//------------------------------------------------
	// 切断（組み込み型イベント）
	socket.on('disconnect', () => {
		const uIX = ga_uSockID.lastIndexOf(socket.id);
		if (uIX < 0) {
			// uIX < 0 のままコードを実行するとシステムが落ちるため、それを防ぐ
			Log('disconnect: ユーザ未設定 / ' + socket.handshake.address);
			return;
		}

		const uID = ga_uID[uIX];
		Log('disconnect: ' + uID + ' ' + ga_uname[uIX]);

		// もし入室していたら、退室処理を行う
		const rmID = ga_uRmID[uIX];
		if (rmID >= 0) {
			ga_uRmID[uIX] = -1;
			const rmIX = ga_room_rmID.indexOf(rmID);
			if (rmIX >= 0) {
				RemoveUsr(socket, rmIX, uID);
			}
		}

		ga_uQryUdata_lmttime[uIX] = -1;  // 念のため
		ga_uDiscnct_time[uIX] = Date.now();
	});

	//------------------------------------------------
	// ユーザーテキストメッセージ
	// [uID, umsg]
	socket.on('UP_umsg', (ary) => {
		if (!Array.isArray(ary) || ary.length !== 2) { return; }

		const uID = ary[0];
		if (!Number.isInteger(uID)) { return; }

		// uID のチェック
		const uIX = ga_uID.indexOf(uID);
		if (uIX < 0) { return; }  // 鯖落ち回避
		if (socket.id !== ga_uSockID[uIX]) { return; }

		const rmID = ga_uRmID[uIX];
		if (rmID < 0) { return; }
		const rmIX = ga_room_rmID.indexOf(rmID);
		if (rmIX < 0) {
			// タイミングが悪く、部屋が消滅していた
			ga_uRmID[uIX] = -1;
			socket.emit('DN_umsg', []);
			return;
		}

		Log('UP_umsg : ' + uID + ' ' + ga_uname[uIX]);

		// umsg のチェック
		if (typeof ary[1] !== 'string') { return; }
		const len_umsg = ary[1].length;
		if (len_umsg === 0 || len_umsg > 200) { return; }

		// SVL を記録する
		const vc_log = ga_room_VcLog[rmIX];
		const vcIX = vc_log.Push([uID, IX_VcTYPE_umsg, ary[1]]);  // ary[1]: umsg

		// vcIX の存在のため、rmID の部屋にいる全員に送信する
		io.in(rmID).emit('DN_umsg', [uID, ary[1], vcIX]);  // ary[1]: umsg
	});

	//------------------------------------------------
	// udata の問い合わせ
	// [uID, [id1, id2, ...]]   uID はユーザの正当性のチェックのため
	socket.on('UP_qry_udata', (ary) => {
		if (!Array.isArray(ary) || ary.length !== 2) { return; }

		const my_uID = ary[0];
		if (!Number.isInteger(my_uID)) { return; }

		// my_uID のチェック
		const my_uIX = ga_uID.indexOf(my_uID);
		if (my_uIX < 0) { return; }
		if (socket.id !== ga_uSockID[my_uIX]) { return; }

		// 制限時間のチェック
		const limit_time = ga_uQryUdata_lmttime[my_uIX]
		if (limit_time < 0) { return; }
		if (Date.now() > limit_time) { return; }
		
		// 入室してるかをチェック
		const my_rmID = ga_uRmID[my_uIX];
		if (my_rmID < 0) { return; }
		const my_rmIX = ga_room_rmID.indexOf(my_rmID);
		if (my_rmIX < 0) { return; }

		const a_uID_toAsk = ary[1];
		if (!Array.isArray(a_uID_toAsk) || a_uID_toAsk.length > c_MAX_qry_udata) { return; }

		Log('UP_qry_udata : ' + my_uID + ' ' + ga_uname[my_uIX]);

		const a_uname = [];
		const a_uview = [];

		// for of を使いたいが、念の為 idx でループさせる
		const len = a_uID_toAsk.length;
		for (let idx = 0; idx < len; idx++) {
			const qry_uID = a_uID_toAsk[idx];
			if (!Number.isInteger(qry_uID)) { return; }

			const uIX = ga_uID.indexOf(qry_uID);
			if (uIX < 0) { return; }

			a_uname.push(ga_uname[uIX]);
			a_uview.push(ga_uview[uIX]);
		}

		// [[uname1, uname2, ...], [uview1, uview2, ...]]
		socket.emit('DN_qry_udata', [a_uname, a_uview]);
	});

	//------------------------------------------------
	// 固定メッセージの変更
	socket.on('UP_fmsg', (ary) => { UP_FMsg(socket, ary); });

	//------------------------------------------------
	// 遅延表示の処理
	// 現時点ではサポートを外しておく（不正対策後に、再実装）
//	socket.on('UP_lostvc', (ary) => { UP_LostVc(socket, ary); });

	//------------------------------------------------
	// uview の変更（登録される uview は強制的に ref cl == cur cl となる）
	// [uID, val_RGB]
	socket.on('UP_chgCl', (ary) => {
		if (!Array.isArray(ary) || ary.length !== 2) { return; }

		const uID = ary[0];
		if (!Number.isInteger(uID)) { return; }

		// uID のチェック
		const uIX = ga_uID.indexOf(uID);
		if (uIX < 0) { return; }  // 鯖落ち回避
		if (socket.id !== ga_uSockID[uIX]) { return; }

		const rmID = ga_uRmID[uIX];
		if (rmID < 0) { return; }
		// 「色を変更しました」の SVL追加のため、部屋の存在が必要となる
		const rmIX = ga_room_rmID.indexOf(rmID);
		if (rmIX < 0) {
			// タイミングが悪く、部屋が消滅していた
			ga_uRmID[uIX] = -1;
			socket.emit('DN_chgCl', []);
			return;
		}

		// val_RGB のチェック
		const val_RGB = ary[1];
		if (val_RGB < 0 || val_RGB > 0xfff) { return; }

		let uview_new = ga_uview[uIX] & 0xffff000000ff;
		uview_new |= (val_RGB << 20) | (val_RGB << 8);

		// 情報更新
		ga_uview[uIX] = uview_new;
		// RI の更新（ちょっと面倒、、）
		const RI = ga_room_info[rmIX];
		const uix_tgt = RI[3].indexOf(uID);
		RI[5][uix_tgt] = uview_new;

		// SVL を記録する
		const vc_log = ga_room_VcLog[rmIX];
		const vcIX = vc_log.Push([uID, IX_VcTYPE_chg_cl]);

		// doj_RI の更新をするため、全員に emit する
		io.emit('DN_chgCl', [rmID, uID, uview_new, vcIX]);
	});

	//------------------------------------------------
	// 部屋の人数を変更
	socket.on('UP_chgCapa', (ary) => { UP_ChgCapa(socket, ary); });
	//------------------------------------------------
	// 強制退出処理
	socket.on('UP_membOut', (ary) => { UP_MembOut(socket, ary); });

	//////////////////////////////////////////////////
	socket.on('UP_req_init_RI', () => {
		if (!g_SPRSr_rld.Check_Init_RI(socket)) { return; }

		Log('UP_req_init_RI: ' + socket.handshake.address);

		socket.emit('DN_init_RI', ga_room_info);
	});

//	socket.emit('DN_cnctn', null);
});

//------------------------------------------------
const c_ERR_RmClosed = -2;

function ChkVld_HOST_uID(hst_socket, hst_uID) {
	// hst_uID のチェック
	if (!Number.isInteger(hst_uID)) { return -1; }

	const hst_uIX = ga_uID.indexOf(hst_uID);
	if (hst_uIX < 0) { return -1; }
	if (hst_socket.id !== ga_uSockID[hst_uIX]) { return -1; }

	const rmID = ga_uRmID[hst_uIX];
	if (rmID < 0) { return -1; }

	const rmIX = ga_room_rmID.indexOf(rmID);
	if (rmIX < 0) {
		// 部屋が消滅していた（ないはずだけど、鯖落ち回避）
		ga_uRmID[hst_uIX] = -1;
		return c_ERR_RmClosed;
	}

	// ホストであることをチェック
	if (ga_room_info[rmIX][3][0] !== hst_uID) { return -1; }

	return rmIX;
}

function ChkVld_uID(socket, uID) {
	if (!Number.isInteger(uID)) { return -1; }

	const uIX = ga_uID.indexOf(uID);
	if (uIX < 0) { return -1; }
	if (socket.id !== ga_uSockID[uIX]) { return -1; }

	const rmID = ga_uRmID[uIX];
	if (rmID < 0) { return -1; }

	const rmIX = ga_room_rmID.indexOf(rmID);
	if (rmIX < 0) {
		// 部屋が消滅していた（ないはずだけど、鯖落ち回避）
		ga_uRmID[hst_uIX] = -1;
		return c_ERR_RmClosed;
	}
	return rmIX;
}

//------------------------------------------------
// [uID, vcIX_begin, pcs_lostvc]
// ▶ 不正な情報を取得することを防ぐコードを入れること
function UP_LostVc(socket, ary) {
	if (!Array.isArray(ary) || ary.length !== 3) { return; }

	const uID = ary[0];
	const rmIX = ChkVld_uID(socket, uID);
	if (rmIX < 0) { return; }

	let vcIX = ary[1];
	let pcs_lostvc = ary[2];
	if (!Number.isInteger(vcIX_begin) || !Number.isInteger(pcs_lostvc)) { return; }
	if (vcIX < 0 || pcs_lostvc < 1) { return; }

	const vc_log = ga_room_VcLog[rmIX];
	if (vcIX + pcs_lostvc > vc_log.Get_LastIX()) { return; }

	const a_ret = [];
	a_ret.push(vcIX);
//	a_ret.push(pcs_lostvc);  // 個数は、a_ret.length で取得できる

	for (; pcs_lostvc > 0; pcs_lostvc--) {
		a_ret.push(vc_log.GetAt(vcIX));
		vcIX++;
	}
	// a_ret: [vcIX, svc, svc, ... ]
	socket.emit('DN_lostvc', a_ret);
}

//------------------------------------------------
// [hst_uID, fmsg_n]
function UP_FMsg(socket, ary) {
	if (!Array.isArray(ary) || ary.length !== 2) { return; }

	const hst_uID = ary[0];
	const rmIX = ChkVld_HOST_uID(socket, hst_uID);  // ary[0]: hst_uID
	if (rmIX < 0) { return; }

	// fmsg_n のチェック
	if (typeof ary[1] !== 'string') { return; }
	// 300文字までであるが、改行コードの変換で、文字列の長さが多少変わっていると思われる
	if (ary[1].length > 350) { return; }

	ga_room_fmsg_n[rmIX] = ary[1];

	// SVLの記録「固定メッセージが変更されました」
	const vcIX = ga_room_VcLog[rmIX].Push([hst_uID, IX_VcTYPE_chg_fmsg]);

	// vcIX の存在のため、rmID の部屋にいる全員に送信する
	// [fmsg, vcIX]
	const rmID = ga_room_rmID[rmIX];
	io.in(rmID).emit('DN_fmsg', [ary[1], vcIX]);  // ary[1]: fmsg_n
}

//------------------------------------------------
// [hst_uID, capa]
function UP_ChgCapa(socket, ary) {
	if (!Array.isArray(ary) || ary.length !== 2) { return; }

	const rmIX = ChkVld_HOST_uID(socket, ary[0]);  // ary[0]: hst_uID
	if (rmIX < 0) { return; }
/*
	if (rmIX < 0) {
		// タイミングが悪く、部屋が消滅していた
		ga_uRmID[uIX] = -1;
		socket.emit('DN_chgCapa', [rmID, 0]);
		return;
	}
*/
	// capa のチェック
	const new_capa = ary[1];
	if (!Number.isInteger(new_capa)) { return; }
	if (new_capa < 2 || new_capa > 15) { return; }

	// 情報更新
	const RI = ga_room_info[rmIX];
	RI[1] = new_capa;

	// 人数変更については、vc は発行しない
	// doj_RI の更新をするため、全員に emit する
	const rmID = ga_room_rmID[rmIX];
	io.emit('DN_chgCapa', [rmID, new_capa]);
}

//------------------------------------------------
// ary: [hst_uID, out_uID]
function UP_MembOut(socket, ary) {
	if (!Array.isArray(ary) || ary.length !== 2) { return; }

	const rmIX = ChkVld_HOST_uID(socket, ary[0]);  // ary[0]: hst_uID
	if (rmIX < 0) { return; }

	// out_uID のチェック
	const out_uID = ary[1];
	if (!Number.isInteger(out_uID)) { return; }

	// スーパユーザのチェック
	if (out_uID <= c_MAX_su_uID) {
		socket.emit('DN_membOut', false);
		return;
	}

	const out_uIX = ga_uID.indexOf(out_uID);
	if (out_uIX < 0) { return; }
	const rmID = ga_room_rmID[rmIX];
	if (ga_uRmID[out_uIX] !== rmID) {
		// ga_uRmID[out_uIX] == -1 と考えて、とりあえず退室処理が完了したということにする（手抜き）
		socket.emit('DN_membOut', true);
		return;
	}

	const out_uSocket = ga_uSock[out_uIX];
	RemoveUsr(out_uSocket, rmIX, out_uID);

	// 退室されたユーザに通知を送る
	ga_uRmID[out_uIX] = -1;
	out_uSocket.emit('DN_FcdOut', null);

	// ホストに退室処理完了の通知を送る
	socket.emit('DN_membOut', true);
}

//------------------------------------------------
// RI に関する処理を行うだけの関数
// socket には、退室する人の socket を渡すこと
function RemoveUsr(socket, rmIX, uID) {
	const RI = ga_room_info[rmIX];
	const a_uID = RI[IX_RI_uID];
	const a_uname = RI[IX_RI_uname];
	const a_uview = RI[IX_RI_uview];

	// idx == 0 となった場合、ホストが削除されることになる
	const idx = a_uID.indexOf(uID);
	a_uID.splice(idx, 1);
	a_uname.splice(idx, 1);
	a_uview.splice(idx, 1);

	const rmID = ga_room_rmID[rmIX];  // rmID を記録しておく（ga_room_rmID が splice される可能性に注意）
	let vcIX = -1;
	if (a_uID.length === 0) {
		// 部屋が無人になった場合、部屋の情報を削除する
		// 削除される [topic_id, room_id, room_prof, VcLog] を記録しておく
		// RI [topic_id, capa, str_room_prof, [uID], [uname], [uview], room_id]
		ga_VcLog_all.push([RI[0], RI[6], RI[2], ga_room_VcLog[rmIX]]);

		ga_room_rmID.splice(rmIX, 1);
		ga_room_info.splice(rmIX, 1);
		ga_room_VcLog.splice(rmIX, 1);
		ga_room_fmsg_n.splice(rmIX, 1);

	} else {
		//「退室しました」メッセージの emit
		const vc_log = ga_room_VcLog[rmIX];
		// uID さんが退室しました
		vcIX = vc_log.Push([uID, IX_VcTYPE_exit_usr]);

		// ホストが削除された場合、ホストが交代したメッセージを送る
		if (idx === 0) {
			const uID_nextHst = a_uID[0];
			// uID_nextHst さんに管理者権限が移りました
			vcIX = vc_log.Push([uID_nextHst, IX_VcTYPE_chgHst]);
		}
	}

	//「送信者以外」の全ユーザに送信（RI の更新）
	socket.broadcast.emit('DN_rmvUsr', [rmID, uID, vcIX]);
	// socket.io の room から外す
	socket.leave(rmID);
}
