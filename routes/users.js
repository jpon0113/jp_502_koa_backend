const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const md5 = require('md5');

const User = require('./../models/userSchema');
const Counter = require('./../models/counterSchema');
const util = require('./../utils/util');

router.prefix('/users');

// 登入
router.post('/login', async (ctx) => {
	try {
		const { userName, userPwd } = ctx.request.body;
		const res = await User.findOne(
			{
				userName,
				userPwd,
			},
			'userId userName userEmail state role deptId roleList'
		);
		const data = res._doc;

		const token = jwt.sign(
			{
				data,
			},
			'502_manager',
			{ expiresIn: '1h' }
		);
		console.log('data', data);
		if (res) {
			data.token = token;
			ctx.body = util.success(data);
		} else {
			ctx.body = util.fail('帳號或密碼不正確');
		}
	} catch (error) {
		ctx.body = util.fail(error.msg);
	}
});

// 使用者列表
router.get('/list', async (ctx) => {
	const { userName, state } = ctx.request.query;
	const { page, skipIndex } = util.pager(ctx.request.query);
	let params = {};
	// if (userId) params.userId = userId;
	if (userName) params.userName = userName;
	if (state && state != '0') params.state = state;
	try {
		// 根據條件查詢所有使用者
		const query = User.find(params, { _id: 0, userPwd: 0 });
		const list = await query.skip(skipIndex).limit(page.pageSize);
		const total = await User.countDocuments(params);

		ctx.body = util.success({
			page: {
				...page,
				total,
			},
			list,
		});
	} catch (error) {
		ctx.body = util.fail(`查詢出現異常:${error.stack}`);
	}
});

// 删除|批量刪除
router.post('/delete', async (ctx) => {
	// 待删除的用户Id数组
	const { userIds } = ctx.request.body;
	// User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
	const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
	if (res.nModified) {
		ctx.body = util.success(res, `共刪除成功${res.nModified}條`);
		return;
	}
	ctx.body = util.fail('刪除失敗');
});

// 新增|編輯
router.post('/operate', async (ctx) => {
	const {
		userId,
		userName,
		userEmail,
		mobile,
		job,
		state,
		roleList,
		deptId,
		action,
	} = ctx.request.body;
	if (action == 'add') {
		if (!userName || !userEmail || !deptId) {
			ctx.body = util.fail('參數錯誤', util.CODE.PARAM_ERROR);
			return;
		}
		const res = await User.findOne(
			{ $or: [{ userName }, { userEmail }] },
			'_id userName userEmail'
		);
		console.log('rrr', res);
		if (res) {
			ctx.body = util.fail(
				`監測到為重複用戶，資訊如下：${res.userName} - ${res.userEmail}`
			);
		} else {
			const doc = await Counter.findOneAndUpdate(
				{ _id: 'userId' },
				{ $inc: { sequence_value: 1 } },
				{ new: true }
			);
			try {
				const user = new User({
					userId: doc.sequence_value,
					userName,
					userPwd: md5('123456'),
					userEmail,
					role: 1, //默认普通用户
					roleList,
					job,
					state,
					deptId,
					mobile,
				});
				user.save();
				ctx.body = util.success('', '使用者新增成功');
			} catch (error) {
				ctx.body = util.fail(error.stack, '使用者新增失敗');
			}
		}
	} else {
		if (!deptId) {
			ctx.body = util.fail('部門不能為空', util.CODE.PARAM_ERROR);
			return;
		}
		try {
			const res = await User.findOneAndUpdate(
				{ userId },
				{ mobile, job, state, roleList, deptId }
			);
			ctx.body = util.success({}, '更新成功');
		} catch (error) {
			ctx.body = util.fail(error.stack, '更新失敗');
		}
	}
});

module.exports = router;
