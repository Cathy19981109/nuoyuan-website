import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
      { path: 'products', name: 'Products', component: () => import('@/views/Products.vue'), meta: { title: '产品中心' } },
      { path: 'products/:id', name: 'ProductDetail', component: () => import('@/views/ProductDetail.vue'), meta: { title: '产品详情' } },
      { path: 'services', name: 'Services', component: () => import('@/views/Services.vue'), meta: { title: '技术服务' } },
      { path: 'services/:id', name: 'ServiceDetail', component: () => import('@/views/ProductDetail.vue'), meta: { title: '服务详情' } },
      { path: 'applications', name: 'Applications', component: () => import('@/views/Applications.vue'), meta: { title: '应用领域' } },
      { path: 'applications/:id', name: 'ApplicationDetail', component: () => import('@/views/ApplicationDetail.vue'), meta: { title: '应用领域详情' } },
      { path: 'news', name: 'News', component: () => import('@/views/News.vue'), meta: { title: '新闻动态' } },
      { path: 'news/:id', name: 'NewsDetail', component: () => import('@/views/NewsDetail.vue'), meta: { title: '新闻详情' } },
      { path: 'about', name: 'About', component: () => import('@/views/About.vue'), meta: { title: '关于我们' } },
      { path: 'contact', name: 'Contact', component: () => import('@/views/Contact.vue'), meta: { title: '联系我们' } },
      { path: 'search', name: 'Search', component: () => import('@/views/Search.vue'), meta: { title: '搜索结果' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 诺元智合` : '诺元智合'
})

export default router
