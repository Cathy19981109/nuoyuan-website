const { verifyToken } = require('../utils/jwt');
const { fail } = require('../utils/response');

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, '请先登录', 401, 401);
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    next();
  } catch {
    return fail(res, '登录已过期，请重新登录', 401, 401);
  }
}

module.exports = { authRequired };
