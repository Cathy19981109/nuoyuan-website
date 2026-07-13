const adminService = require('../services/adminService');
const { success, fail } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const data = await adminService.login(username, password, ip);
    return success(res, data, '登录成功');
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const data = await adminService.getProfile(req.admin.id);
    if (!data) return fail(res, '管理员不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    await adminService.changePassword(req.admin.id, oldPassword, newPassword);
    return success(res, null, '密码修改成功');
  } catch (err) {
    next(err);
  }
}

async function updateProfileBinding(req, res, next) {
  try {
    const { email, phone } = req.body;
    const data = await adminService.updateProfileBinding(req.admin.id, email, phone);
    return success(res, data, '绑定信息已保存');
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getProfile, updateProfileBinding, changePassword };
