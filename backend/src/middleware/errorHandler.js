const { fail } = require('../utils/response');
const config = require('../config');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.name === 'ValidationError') {
    return fail(res, err.message, 422, 422);
  }

  const status = Number(err.status || err.statusCode || 0);
  if (status >= 400 && status < 600) {
    return fail(res, err.message || '请求失败', status, status);
  }

  const message = config.nodeEnv === 'production' ? '服务器内部错误' : err.message;
  return fail(res, message, 500, 500);
}

function notFoundHandler(req, res) {
  return fail(res, '接口不存在', 404, 404);
}

module.exports = { errorHandler, notFoundHandler };
