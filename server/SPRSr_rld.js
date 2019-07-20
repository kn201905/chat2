'use strict';

const port_server = require('./port_server.js');
const IP_dev_1 = port_server.IP_dev_1;

// DN_qry_cnct で返される値
const c_CNCT_OK = 0;
const c_CNCT_Vltn = 1;
const c_CNCT_Reject = 2;

// Log を受け取るインターフェース
let Log = null
exports.Set_Log = (fn_Log) => { Log = fn_Log; };

// リロード抑制コード
exports.g_SPRSr_rld = new function() {
	const c_msec_EXPD = 600 * 1000;  // 現在は 3回/10分間 までOKとしている
	const c_IV_cnct = 3;  // c_msec_EXPD 内に接続できるのは、初期値 c_IV_reload 回まで
	const c_IV_init_RI = 1;  // 初期値 c_IV_init_RI 回まで、Init_RI 要求を許可する

	const ma_IP = [];
	const ma_sock_id = [];
	const ma_enter_time = [];
	const ma_life = [];
	const ma_life_Init_RI = [];
	const ma_stt_cnct = [];  // DN_qry_cnct で返す戻り値を保持

	// 戻り値: true -> 通常処理、 false -> 抑制処理
	this.Check = (socket) => {
		// 開発者用
		if (socket.handshake.address === IP_dev_1) {
			Log('\n ----- detect IP_dev_1');
			return true;
		}

		const msec_now = Date.now();
		// ma_enter_time が ma_enter_time より前のものは、配列から削除する
		TrimArrays(msec_now);

		const ix = ma_IP.lastIndexOf(socket.handshake.address);
		if (ix < 0) {
			// ma_IP に記録のない IP からの接続処理
			ma_IP.push(socket.handshake.address);
			ma_sock_id.push(socket.id);
			ma_enter_time.push(msec_now);
			ma_life.push(c_IV_cnct - 1);  // 既に１回分の接続は利用している
			ma_life_Init_RI.push(c_IV_init_RI);
			ma_stt_cnct.push(c_CNCT_OK);
			return true;
		}

		// c_msec_EXPD 内での再接続に対する処理
		// socket.id は接続毎に変化するため、再記録しておく
		ma_sock_id[ix] = socket.id;

		const life_remain = --ma_life[ix];
		if (life_remain >= 0) {
			ma_life_Init_RI[ix] = c_IV_init_RI;

			// サイトへの新規接続に関する注意を送信する
			// [警告コード, 接続した回数, 最初の接続からの経過時間]
			ma_stt_cnct[ix] = [c_CNCT_Vltn, c_IV_cnct - life_remain, msec_now - ma_enter_time[ix]];
			return true;
		}

		// life_remain < 0 であった場合は、下り通信を発生させない
		// この場合、UP_qry_cnct 等のイベントをキャッチしなくなるため、以下の２行は本質的に不要
		ma_stt_cnct[ix] = c_CNCT_Reject;
		ma_life_Init_RI[ix] = 0;
		return false;
	};

	// init_RI を受け付けるかどうかの判定
	this.Check_Init_RI = (socket) => {
		// 開発者用
		if (socket.handshake.address === IP_dev_1) { return true; }

		const ix = ma_sock_id.lastIndexOf(socket.id);
		if (ix < 0) { return false; }

		if (ma_life_Init_RI[ix]-- > 0) {
			return true;
		} else {
			return false;
		}
	};

	this.Rcv_UP_qry_cnct = (socket) => {
		// 開発者用
		if (socket.handshake.address === IP_dev_1) {
			socket.emit('DN_qry_cnct', c_CNCT_OK);
			return;
		}

		const ix = ma_sock_id.lastIndexOf(socket.id);
		// 以下のチェックは不要なはず（万一の鯖落ち回避のために、チェックしている）
		if (ix < 0) { return; }

		socket.emit('DN_qry_cnct', ma_stt_cnct[ix]);
	};

	// ----------------------------------------
	// ma_enter_time が ma_enter_time より前のものは、配列から削除する
	function TrimArrays(msec_now) {
		const msec_expd = msec_now - c_msec_EXPD;

		const len = ma_enter_time.length;
		let i = 0;
		for (; i < len; i++) {
			if (msec_expd < ma_enter_time[i]) { break; }
		}
		if (i === 0) { return; }

		ma_IP.splice(0, i);
		ma_sock_id.splice(0, i);
		ma_enter_time.splice(0, i);
		ma_life.splice(0, i);
		ma_life_Init_RI.splice(0, i);
		ma_stt_cnct.splice(0, i);
	}
};
