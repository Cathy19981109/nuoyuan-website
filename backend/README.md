# 诺元智合官网后端 API

Node.js + Express + MySQL 后端服务，为诺元智合企业官网提供 RESTful API。

## 快速开始

```bash
cd backend
npm install
npm run seed    # 初始化管理员账号和基础数据
npm run dev     # 开发模式启动
```

默认服务地址：`http://localhost:3000`

## 环境配置

复制 `.env.example` 为 `.env` 并修改数据库连接信息：

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=nuoyuan_web
DB_PASSWORD=123456
DB_NAME=nuoyuan_website
```

## 默认管理员

| 账号 | 密码 |
|------|------|
| admin | 123456 |

## API 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- `code = 0` 表示成功，非 0 表示失败
- 分页数据格式：`{ list: [], pagination: { total, page, pageSize, totalPages } }`

## 认证方式

管理端接口需在 Header 中携带 JWT Token：

```
Authorization: Bearer <token>
```

---

## 公开 API（前台）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/nav` | 获取导航菜单树 |
| GET | `/api/pages/:id` | 获取页面详情（按ID） |
| GET | `/api/pages/nav/:navName` | 获取页面详情（按导航名） |
| GET | `/api/product-categories` | 获取产品分类树 |
| GET | `/api/products` | 产品列表（支持 categoryId, isHot, keyword, page, pageSize） |
| GET | `/api/products/:id` | 产品详情 |
| GET | `/api/news-categories` | 新闻分类列表 |
| GET | `/api/news` | 新闻列表（支持 categoryId, page, pageSize） |
| GET | `/api/news/:id` | 新闻详情 |
| GET | `/api/applications` | 应用领域列表 |
| GET | `/api/applications/:id` | 应用领域详情 |
| GET | `/api/config` | 公开系统配置 |
| GET | `/api/search?keyword=` | 全站搜索 |
| POST | `/api/inquiries` | 提交询价 |

### 提交询价示例

```json
POST /api/inquiries
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhang@example.com",
  "company": "某某生物公司",
  "product_id": 1,
  "product_name": "长链RNA合成服务",
  "demand": "需要合成200nt sgRNA，请报价"
}
```

---

## 管理 API（后台）

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/profile` | 获取当前管理员信息 |
| PUT | `/api/admin/password` | 修改密码 |

### 导航管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/nav` | 导航列表（含隐藏项） |
| GET | `/api/admin/nav/:id` | 导航详情 |
| POST | `/api/admin/nav` | 新增导航 |
| PUT | `/api/admin/nav/:id` | 更新导航 |
| DELETE | `/api/admin/nav/:id` | 删除导航 |

### 页面管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/pages` | 页面列表 |
| GET | `/api/admin/pages/:id` | 页面详情 |
| POST | `/api/admin/pages` | 新增页面 |
| PUT | `/api/admin/pages/:id` | 更新页面 |
| DELETE | `/api/admin/pages/:id` | 删除页面 |

### 产品分类管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/product-categories` | 分类树 |
| POST | `/api/admin/product-categories` | 新增分类 |
| PUT | `/api/admin/product-categories/:id` | 更新分类 |
| DELETE | `/api/admin/product-categories/:id` | 删除分类 |

### 产品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/products` | 产品列表 |
| POST | `/api/admin/products` | 新增产品 |
| PUT | `/api/admin/products/:id` | 更新产品 |
| DELETE | `/api/admin/products/:id` | 删除产品 |

### 新闻分类 & 新闻管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/admin/news-categories` | 新闻分类 CRUD |
| GET/POST/PUT/DELETE | `/api/admin/news` | 新闻 CRUD |

### 应用领域管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/admin/applications` | 应用领域 CRUD |

### 询价管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/inquiries` | 询价列表 |
| GET | `/api/admin/inquiries/:id` | 询价详情 |
| PUT | `/api/admin/inquiries/:id/handle` | 处理询价（status: 0未处理/1已处理/2已跟进/3已完成） |
| DELETE | `/api/admin/inquiries/:id` | 删除询价 |

### 系统配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/config` | 全部配置 |
| POST | `/api/admin/config` | 新增/更新配置（按 config_key 幂等） |
| PUT | `/api/admin/config/:id` | 更新配置 |

**询价邮件相关配置项：**

| config_key | 说明 |
|------------|------|
| inquiry_email | 接收询价的邮箱 |
| smtp_host | SMTP 服务器 |
| smtp_port | SMTP 端口（默认465） |
| smtp_user | SMTP 账号 |
| smtp_pass | SMTP 密码/授权码 |

---

## 项目结构

```
backend/
├── src/
│   ├── config/         # 数据库 & 应用配置
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件（认证、校验、错误处理）
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── scripts/        # 种子脚本
│   ├── sql/            # 数据库升级脚本
│   ├── utils/          # 工具函数
│   ├── app.js          # Express 应用
│   └── server.js       # 启动入口
├── .env                # 环境变量
└── package.json
```

## v2 升级（模块化编辑/回收站/统计/官网中心）

本次新增能力包含：

- 全站Logo+标题配置（官网中心）
- 页面模块化编辑（按页面模板）
- 模块删除回收站（保留30天，可恢复）
- 页脚多栏配置（含二维码、版权）
- 导航下拉横幅图
- 询价表单模板配置（拖拽组件数据结构）
- 数据统计看板接口
- 产品5位数字编码（00001起）

### 升级步骤

1. 执行升级 SQL：

```bash
mysql -u nuoyuan_web -p nuoyuan_website < src/sql/upgrade_v2.sql
```

2. 运行种子（补充新配置项和默认询价模板）：

```bash
npm run seed
```

3. 重启后端服务：

```bash
npm run dev
```

### 新增管理接口（节选）

- 官网中心：`GET/PUT /api/admin/site-center`
- 页脚配置：`GET/POST/PUT/DELETE /api/admin/footer-blocks`
- 页面模块：
  - `GET /api/admin/page-modules/:pageKey/templates`
  - `GET/POST /api/admin/page-modules/:pageKey`
  - `PUT/DELETE /api/admin/page-module/:id`
- 回收站：
  - `GET /api/admin/module-recycle`
  - `PUT /api/admin/module-recycle/:id/restore`
  - `DELETE /api/admin/module-recycle/:id`
- 询价表单模板：`GET/PUT /api/admin/inquiry-form-template`
- 数据统计：`GET /api/admin/stats/dashboard`
- 询价导出：`POST /api/admin/inquiries/export`
