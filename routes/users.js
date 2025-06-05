const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const User = require('./../models/userSchema');
const util = require('./../utils/util');
router.prefix('/users');

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
module.exports = router;
