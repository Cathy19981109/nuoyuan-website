const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const navController = require('../controllers/navController');
const pageController = require('../controllers/pageController');
const productController = require('../controllers/productController');
const serviceController = require('../controllers/serviceController');
const newsController = require('../controllers/newsController');
const applicationController = require('../controllers/applicationController');
const inquiryController = require('../controllers/inquiryController');
const configController = require('../controllers/configController');
const searchController = require('../controllers/searchController');
const opsController = require('../controllers/opsController');
const seoController = require('../controllers/seoController');

const router = express.Router();

// 导航
router.get('/nav', navController.getNavTree);

// 页面
router.get('/pages/:id', pageController.getById);
router.get('/pages/nav/:navName', pageController.getByNavName);

// 产品分类 & 产品
router.get('/product-categories', productController.getCategoryTree);
router.get('/product-filter-tags', productController.getFilterTagsPublic);
router.get('/products/filter-stats', productController.getFilterStats);
router.get('/products', productController.getPublicList);
router.get('/products/:id', productController.getPublicById);
router.get('/service-categories', serviceController.getCategoryTree);
router.get('/service-filter-tags', serviceController.getFilterTagsPublic);
router.get('/services/filter-stats', serviceController.getFilterStats);
router.get('/services', serviceController.getPublicList);
router.get('/services/:id', serviceController.getPublicById);

// 新闻
router.get('/news-categories', newsController.getPublicCategories);
router.get('/news', newsController.getPublicList);
router.get('/news/:id', newsController.getPublicById);

// 应用领域
router.get('/applications', applicationController.getPublicList);
router.get('/applications/:id', applicationController.getPublicById);

// 系统配置（公开）
router.get('/config', configController.getPublic);

// 搜索
router.get('/search', searchController.search);
router.get('/page-modules/:pageKey', opsController.getPublicPageModules);
router.get('/seo-meta', seoController.getPublicMeta);

// 提交询价
router.post(
  '/inquiries',
  [
    body('name').notEmpty().withMessage('联系人姓名不能为空'),
    body('phone').notEmpty().withMessage('联系电话不能为空'),
    body('product_name').notEmpty().withMessage('咨询产品/服务不能为空'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
  ],
  validate,
  inquiryController.submit
);
router.get('/inquiry-form', inquiryController.getPublicForm);

module.exports = router;
