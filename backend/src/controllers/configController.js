const inquiryService = require('../services/inquiryService');
const { success, fail } = require('../utils/response');

async function getPublic(req, res, next) {
  try {
    const data = await inquiryService.getPublicConfigs();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

function toOpsReadableConfigRows(rows = []) {
  const hiddenKeys = new Set(['smtp_pass', 'jwt_secret', 'api_key', 'token']);
  return rows
    .filter((row) => !hiddenKeys.has((row.config_key || '').toLowerCase()))
    .map((row) => ({
      id: row.id,
      title: row.name,
      value: row.config_value,
      tips: row.description || '',
    }));
}

async function getAll(req, res, next) {
  try {
    const data = await inquiryService.getAllConfigs();
    return success(res, toOpsReadableConfigRows(data));
  } catch (err) {
    next(err);
  }
}

async function upsert(req, res, next) {
  try {
    const data = await inquiryService.upsertConfig(req.body);
    return success(res, data, '保存成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await inquiryService.updateConfig(req.params.id, req.body);
    if (!data) return fail(res, '配置不存在', 404, 404);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublic, getAll, upsert, update };
