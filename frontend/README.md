# 诺元智合官网前端

Vue 3 + Vite 构建的企业官网前台项目。

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Axios
- Vite

## 快速开始

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

**注意：** 需要先启动后端服务（`backend` 目录，`npm run dev`），前端通过 Vite 代理访问 `/api`。

## 页面结构

| 路由 | 页面 |
|------|------|
| `/` | 首页 |
| `/products` | 产品中心 |
| `/products/:id` | 产品详情 |
| `/services` | 技术服务 |
| `/applications` | 应用领域 |
| `/applications/:id` | 领域详情 |
| `/news` | 新闻动态 |
| `/news/:id` | 新闻详情 |
| `/about` | 关于我们 |
| `/contact` | 联系我们 |
| `/search?keyword=` | 搜索结果 |

## 项目结构

```
frontend/
├── src/
│   ├── api/           # API 请求封装
│   ├── components/    # 公共组件（Header、Footer、询价弹窗等）
│   ├── router/        # 路由配置
│   ├── styles/        # 全局样式
│   ├── views/         # 页面视图
│   ├── App.vue
│   └── main.js
├── vite.config.js     # Vite 配置（含 API 代理）
└── .env.development   # 开发环境变量
```

## 构建部署

```bash
npm run build
npm run preview
```

生产环境需配置 Nginx 将 `/api` 反向代理到后端服务。

## 模块化页面说明（v2）

以下页面已支持读取后台“页面模块编辑”新增的模块数据并渲染：

- 首页（`home`）
- 产品中心（`products`）
- 技术服务（`services`）
- 应用领域（`applications`）
- 新闻动态（`news`）
- 关于我们（`about`）

顶部导航已支持：

- 自定义品牌Logo与品牌标题（后台官网中心）
- 导航下拉子菜单
- 导航下拉横幅图

页脚已支持：

- 后台多栏模块
- 二维码展示
- 底部版权文字与ICP备案号
