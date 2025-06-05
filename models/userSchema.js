const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
	userId: Number, // 使用者ID(自增)
	userName: String, // 使用者名稱
	userPwd: String, // 使用者密碼(md5加密)
	userEmail: String, // 使用者信箱
	mobile: String, // 手機號碼
	sex: Number, // 性別 0:男  1：女
	deptId: [], // 部門
	job: String, // 工作
	state: {
		// 1: 在職 2: 離職 3: 試用期
		type: Number,
		default: 1,
	},
	role: {
		// 使用者角色 0：管理員  1： 一般使用者
		type: Number,
		default: 1,
	},
	roleList: [], // 系統角色
	createTime: {
		// 建立時間
		type: Date,
		default: Date.now(),
	},
	lastLoginTime: {
		// 更新時間
		type: Date,
		default: Date.now(),
	},
	remark: String,
});

module.exports = mongoose.model('users', userSchema, 'users');
