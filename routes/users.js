const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const User = require('./../models/userSchema');
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

module.exports = router;
