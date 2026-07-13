import request from './request'

export const getNav = () => request.get('/nav')
export const getConfig = () => request.get('/config')
export const getPageByNavName = (navName) => request.get(`/pages/nav/${encodeURIComponent(navName)}`)
export const getPageById = (id) => request.get(`/pages/${id}`)

export const getProductCategories = () => request.get('/product-categories')
export const getProducts = (params) => request.get('/products', { params })
export const getProductById = (id) => request.get(`/products/${id}`)
export const getProductFilterTags = () => request.get('/product-filter-tags')
export const getProductFilterStats = (params) => request.get('/products/filter-stats', { params })
export const getServiceCategories = () => request.get('/service-categories')
export const getServiceFilterTags = () => request.get('/service-filter-tags')
export const getServiceFilterStats = (params) => request.get('/services/filter-stats', { params })
export const getServices = (params) => request.get('/services', { params })
export const getServiceById = (id) => request.get(`/services/${id}`)

export const getNewsCategories = () => request.get('/news-categories')
export const getNewsList = (params) => request.get('/news', { params })
export const getNewsById = (id) => request.get(`/news/${id}`)

export const getApplications = () => request.get('/applications')
export const getApplicationById = (id) => request.get(`/applications/${id}`)

export const searchSite = (keyword, params) => request.get('/search', { params: { keyword, ...params } })

export const submitInquiry = (data) => request.post('/inquiries', data)
export const getInquiryForm = () => request.get('/inquiry-form')
export const getPageModules = (pageKey) => request.get(`/page-modules/${pageKey}`)
export const getSeoMeta = (params) => request.get('/seo-meta', { params })
