const inquiryService = require('../services/inquiryService');
const { success, fail } = require('../utils/response');

async function submit(req, res, next) {
  try {
    const result = await inquiryService.createInquiry(req.body);
    return success(res, result, '提交成功');
  } catch (err) {
    next(err);
  }
}

async function getPublicForm(req, res, next) {
  try {
    const data = await inquiryService.getPublicInquiryForm();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getList(req, res, next) {
  try {
    const hasAdvancedFilters = ['name', 'phone', 'email', 'company', 'productKeyword'].some((k) => req.query?.[k]);
    const data = hasAdvancedFilters
      ? await inquiryService.getInquiryListAdvanced(req.query)
      : await inquiryService.getInquiryList(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await inquiryService.getInquiryById(req.params.id);
    if (!data) return fail(res, '询价记录不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function handle(req, res, next) {
  try {
    const existing = await inquiryService.getInquiryById(req.params.id);
    if (!existing) return fail(res, '询价记录不存在', 404, 404);
    const data = await inquiryService.handleInquiry(req.params.id, req.admin.id, req.body);
    return success(res, data, '处理成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await inquiryService.getInquiryById(req.params.id);
    if (!existing) return fail(res, '询价记录不存在', 404, 404);
    await inquiryService.deleteInquiry(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function exportRows(req, res, next) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const rows = await inquiryService.exportInquiryRows({ ids });
    return success(res, rows, '导出数据已生成');
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, getPublicForm, getList, getById, handle, remove, exportRows };
