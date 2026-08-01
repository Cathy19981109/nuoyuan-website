import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '控制台', breadcrumbs: [{ label: '控制台', to: '/dashboard' }] } },
      { path: 'nav', name: 'Nav', component: () => import('@/views/nav/NavList.vue'), meta: { title: '导航编辑', breadcrumbs: [{ label: '导航&页面管理', to: '/nav' }, { label: '导航编辑', to: '/nav' }] } },
      { path: 'pages', name: 'Pages', component: () => import('@/views/pages/PageList.vue'), meta: { title: '页面管理', breadcrumbs: [{ label: '页面管理', to: '/pages' }] } },
      { path: 'product-categories', name: 'ProductCategories', component: () => import('@/views/products/CategoryList.vue'), meta: { title: '产品分类（导航）', breadcrumbs: [{ label: '导航&页面管理', to: '/nav' }, { label: '产品分类（导航）', to: '/product-categories' }] } },
      { path: 'product-filter-tags', name: 'ProductFilterTags', component: () => import('@/views/products/ProductFilterTagManager.vue'), meta: { title: '筛选标签', breadcrumbs: [{ label: '产品管理', to: '/product-filter-tags' }, { label: '筛选标签', to: '/product-filter-tags' }] } },
      { path: 'products', name: 'Products', component: () => import('@/views/products/ProductList.vue'), meta: { title: '产品列表', breadcrumbs: [{ label: '产品管理', to: '/products' }, { label: '产品列表', to: '/products' }] } },
      { path: 'service-categories', name: 'ServiceCategories', component: () => import('@/views/services/ServiceCategoryList.vue'), meta: { title: '服务分类（导航）', breadcrumbs: [{ label: '导航&页面管理', to: '/nav' }, { label: '服务分类（导航）', to: '/service-categories' }] } },
      { path: 'service-filter-tags', name: 'ServiceFilterTags', component: () => import('@/views/services/ServiceFilterTagManager.vue'), meta: { title: '服务筛选标签', breadcrumbs: [{ label: '服务管理', to: '/service-filter-tags' }, { label: '服务筛选标签', to: '/service-filter-tags' }] } },
      { path: 'services-admin', name: 'ServicesAdmin', component: () => import('@/views/services/ServiceList.vue'), meta: { title: '服务列表', breadcrumbs: [{ label: '服务管理', to: '/services-admin' }, { label: '服务列表', to: '/services-admin' }] } },
      { path: 'news-categories', redirect: '/page-editor' },
      { path: 'news', redirect: '/page-editor' },
      { path: 'applications', redirect: '/page-editor' },
      { path: 'inquiries', name: 'Inquiries', component: () => import('@/views/inquiries/InquiryList.vue'), meta: { title: '询价管理', breadcrumbs: [{ label: '询价管理', to: '/inquiries' }, { label: '询价记录', to: '/inquiries' }] } },
      { path: 'site-center', name: 'SiteCenter', component: () => import('@/views/ops/SiteCenter.vue'), meta: { title: '官网信息', breadcrumbs: [{ label: '官网信息', to: '/site-center' }] } },
      { path: 'footer-config', name: 'FooterConfig', component: () => import('@/views/ops/FooterConfig.vue'), meta: { title: '导航与底部配置' } },
      { path: 'stats-board', name: 'StatsBoard', component: () => import('@/views/ops/StatsBoard.vue'), meta: { title: '数据统计', breadcrumbs: [{ label: '数据统计', to: '/stats-board' }] } },
      { path: 'inquiry-form-builder', name: 'InquiryFormBuilder', component: () => import('@/views/ops/InquiryFormBuilder.vue'), meta: { title: '询价表单配置' } },
      { path: 'page-editor', name: 'PageEditor', component: () => import('@/views/ops/PageEditorV2.vue'), meta: { title: '页面编辑', breadcrumbs: [{ label: '导航&页面管理', to: '/nav' }, { label: '页面编辑', to: '/page-editor' }] } },
      { path: 'permission-manager', name: 'PermissionManager', component: () => import('@/views/ops/PermissionManager.vue'), meta: { title: '权限管理', breadcrumbs: [{ label: '权限管理', to: '/permission-manager' }] } },
      { path: 'seo-manager', name: 'SeoManager', component: () => import('@/views/ops/SeoManager.vue'), meta: { title: 'SEO管理', breadcrumbs: [{ label: 'SEO管理', to: '/seo-manager' }] } },
      { path: 'config', name: 'Config', component: () => import('@/views/config/ConfigList.vue'), meta: { title: '配置列表（兼容）' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'Login' && auth.isLoggedIn) {
    return { name: 'Dashboard' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 诺元智合管理后台` : '诺元智合管理后台'
})

export default router
