const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const navController = require('../controllers/navController');
const pageController = require('../controllers/pageController');
const productController = require('../controllers/productController');
const serviceController = require('../controllers/serviceController');
const newsController = require('../controllers/newsController');
const applicationController = require('../controllers/applicationController');
const inquiryController = require('../controllers/inquiryController');
const configController = require('../controllers/configController');
const opsController = require('../controllers/opsController');
const uploadController = require('../controllers/uploadController');
const seoController = require('../controllers/seoController');

const router = express.Router();

// 登录（无需认证）
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  validate,
  adminController.login
);

// 以下接口需要登录
router.use(authRequired);

// 管理员
router.get('/profile', adminController.getProfile);
router.put(
  '/profile/binding',
  [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('phone').matches(/^1\d{10}$/).withMessage('手机号格式不正确'),
  ],
  validate,
  adminController.updateProfileBinding
);
router.put(
  '/password',
  [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位'),
  ],
  validate,
  adminController.changePassword
);
router.post('/upload/image', uploadController.image);
router.post('/upload/video', uploadController.video);
router.post('/upload/doc', uploadController.doc);

// 导航管理
router.get('/nav', navController.getAll);
router.get('/nav/:id', navController.getById);
router.put('/nav/reorder', navController.reorder);
router.post(
  '/nav',
  [body('name').notEmpty().withMessage('导航名称不能为空')],
  validate,
  navController.create
);
router.put('/nav/:id', navController.update);
router.delete('/nav/:id', navController.remove);

// 页面管理
router.get('/pages', pageController.getList);
router.get('/pages/:id', pageController.getAdminById);
router.post(
  '/pages',
  [
    body('title').notEmpty().withMessage('页面标题不能为空'),
    body('nav_name').notEmpty().withMessage('导航名称不能为空'),
  ],
  validate,
  pageController.create
);
router.put('/pages/:id', pageController.update);
router.delete('/pages/:id', pageController.remove);

// 产品分类管理
router.get('/product-categories', productController.getAllCategories);
router.put('/product-categories/reorder', productController.reorderProductCategories);
router.get('/product-categories/:id', productController.getCategoryById);
router.post(
  '/product-categories',
  [body('name').notEmpty().withMessage('分类名称不能为空')],
  validate,
  productController.createCategory
);
router.put('/product-categories/:id', productController.updateCategory);
router.delete('/product-categories/:id', productController.deleteCategory);
router.get('/product-filter-tags', productController.getFilterTagsAdmin);
router.post(
  '/product-filter-groups',
  [body('group_title').notEmpty().withMessage('分组名称不能为空')],
  validate,
  productController.createFilterGroup
);
router.put('/product-filter-groups/reorder', productController.reorderFilterGroups);
router.put('/product-filter-groups/:id', productController.updateFilterGroup);
router.delete('/product-filter-groups/:id', productController.deleteFilterGroup);
router.post(
  '/product-filter-tags',
  [
    body('tag_group').optional(),
    body('group_key').optional(),
    body('tag_name').notEmpty().withMessage('标签名称不能为空'),
  ],
  validate,
  productController.createFilterTag
);
router.put('/product-filter-tags/:id', productController.updateFilterTag);
router.delete('/product-filter-tags/:id', productController.deleteFilterTag);
router.put('/product-filter-tags/reorder/:tagGroup', productController.reorderFilterTags);
router.get('/products/filter-stats', productController.getFilterStats);

// 产品管理
router.get('/products', productController.getAdminList);
router.get('/products/search-by-code', productController.searchByCode);
router.put('/products/reorder', productController.reorder);
router.get('/products/:id', productController.getAdminById);
router.post(
  '/products',
  [
    body('category_id').notEmpty().withMessage('分类ID不能为空'),
    body('name').notEmpty().withMessage('产品名称不能为空'),
    body('short_desc').notEmpty().withMessage('简短描述不能为空'),
  ],
  validate,
  productController.create
);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.remove);

// 服务分类管理（独立于产品）
router.get('/service-categories', serviceController.getAllCategories);
router.put('/service-categories/reorder', serviceController.reorderServiceCategories);
router.get('/service-categories/:id', serviceController.getCategoryById);
router.post(
  '/service-categories',
  [body('name').notEmpty().withMessage('分类名称不能为空')],
  validate,
  serviceController.createCategory
);
router.put('/service-categories/:id', serviceController.updateCategory);
router.delete('/service-categories/:id', serviceController.deleteCategory);

// 服务管理（独立于产品）
router.get('/service-filter-tags', serviceController.getFilterTagsAdmin);
router.post(
  '/service-filter-groups',
  [body('group_title').notEmpty().withMessage('分组名称不能为空')],
  validate,
  serviceController.createFilterGroup
);
router.put('/service-filter-groups/reorder', serviceController.reorderFilterGroups);
router.put('/service-filter-groups/:id', serviceController.updateFilterGroup);
router.delete('/service-filter-groups/:id', serviceController.deleteFilterGroup);
router.post(
  '/service-filter-tags',
  [
    body('tag_group').optional(),
    body('group_key').optional(),
    body('tag_name').notEmpty().withMessage('标签名称不能为空'),
  ],
  validate,
  serviceController.createFilterTag
);
router.put('/service-filter-tags/:id', serviceController.updateFilterTag);
router.delete('/service-filter-tags/:id', serviceController.deleteFilterTag);
router.put('/service-filter-tags/reorder/:tagGroup', serviceController.reorderFilterTags);
router.get('/services/filter-stats', serviceController.getFilterStats);
router.get('/services', serviceController.getAdminList);
router.put('/services/reorder', serviceController.reorder);
router.get('/services/:id', serviceController.getAdminById);
router.post(
  '/services',
  [
    body('category_id').notEmpty().withMessage('分类ID不能为空'),
    body('name').notEmpty().withMessage('服务名称不能为空'),
    body('short_desc').notEmpty().withMessage('简短描述不能为空'),
  ],
  validate,
  serviceController.create
);
router.put('/services/:id', serviceController.update);
router.delete('/services/:id', serviceController.remove);

// 新闻分类管理
router.get('/news-categories', newsController.getAllCategories);
router.put('/news-categories/reorder', newsController.reorderCategories);
router.get('/news-categories/:id', newsController.getCategoryById);
router.post(
  '/news-categories',
  [body('name').notEmpty().withMessage('分类名称不能为空')],
  validate,
  newsController.createCategory
);
router.put('/news-categories/:id', newsController.updateCategory);
router.delete('/news-categories/:id', newsController.deleteCategory);

// 新闻管理
router.get('/news', newsController.getAdminList);
router.put('/news/reorder', newsController.reorder);
router.get('/news/:id', newsController.getAdminById);
router.post(
  '/news',
  [
    body('category_id').notEmpty().withMessage('分类ID不能为空'),
    body('title').notEmpty().withMessage('新闻标题不能为空'),
    body('content').notEmpty().withMessage('新闻内容不能为空'),
  ],
  validate,
  newsController.create
);
router.put('/news/:id', newsController.update);
router.delete('/news/:id', newsController.remove);

// 应用领域管理
router.get('/applications', applicationController.getAdminList);
router.get('/applications/:id', applicationController.getAdminById);
router.post(
  '/applications',
  [body('name').notEmpty().withMessage('领域名称不能为空')],
  validate,
  applicationController.create
);
router.put('/applications/:id', applicationController.update);
router.delete('/applications/:id', applicationController.remove);


// 询价管理
router.get('/inquiries', inquiryController.getList);
router.get('/inquiries/notify-emails', inquiryController.getNotifyEmails);
router.put('/inquiries/notify-emails', inquiryController.saveNotifyEmails);
router.get('/inquiries/:id', inquiryController.getById);
router.put(
  '/inquiries/:id/handle',
  [body('status').notEmpty().withMessage('处理状态不能为空')],
  validate,
  inquiryController.handle
);
router.delete('/inquiries/:id', inquiryController.remove);
router.post('/inquiries/export', inquiryController.exportRows);

// 官网中心（原系统配置）
router.get('/config', configController.getAll);
router.post(
  '/config',
  [
    body('config_key').notEmpty().withMessage('配置键名不能为空'),
    body('name').notEmpty().withMessage('配置名称不能为空'),
  ],
  validate,
  configController.upsert
);
router.put('/config/:id', configController.update);


// 官网中心（运营可读）
router.get('/site-center', opsController.getSiteCenter);
router.put('/site-center', opsController.saveSiteCenter);

// 导航&底部配置 - 页脚
router.get('/footer-blocks', opsController.getFooterBlocks);
router.post('/footer-blocks', opsController.createFooterBlock);
router.put('/footer-blocks/:id', opsController.updateFooterBlock);
router.delete('/footer-blocks/:id', opsController.deleteFooterBlock);

// 页面编辑 - 模块化编辑
router.get('/page-modules/:pageKey/templates', opsController.getModuleTemplates);
router.get('/page-modules/:pageKey', opsController.getPageModules);
router.post('/page-modules/:pageKey', opsController.createPageModule);
router.put('/page-modules/:pageKey/reorder', opsController.reorderPageModules);
router.put('/page-module/:id', opsController.updatePageModule);
router.delete('/page-module/:id', opsController.deletePageModule);

// 页面编辑 - 回收站
router.get('/module-recycle', opsController.getRecycle);
router.put('/module-recycle/:pageKey/reorder', opsController.reorderRecycle);
router.put('/module-recycle/:id/restore', opsController.restoreRecycle);
router.delete('/module-recycle/:id', opsController.purgeRecycle);


// 询价表单拖拽模板
router.get('/inquiry-form-template', opsController.getInquiryFormTemplate);
router.put('/inquiry-form-template', opsController.saveInquiryFormTemplate);

// 数据统计
router.get('/stats/dashboard', opsController.getStatsDashboard);

// SEO管理
router.get('/seo/global', seoController.getGlobal);
router.put('/seo/global', seoController.saveGlobal);
router.get('/seo/pages', seoController.getPageList);
router.put('/seo/pages/:id', seoController.savePage);
router.get('/seo/products', seoController.listProduct);
router.put('/seo/products/:id', seoController.saveProduct);
router.get('/seo/news', seoController.listNews);
router.put('/seo/news/:id', seoController.saveNews);

module.exports = router;
