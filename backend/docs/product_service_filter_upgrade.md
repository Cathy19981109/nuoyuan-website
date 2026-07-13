# 产品与服务筛选升级说明（V7）

## 一、数据库升级

在 `nuoyuan_website` 执行：

```sql
SOURCE /Users/liuluyao/Desktop/Demo/backend/sql/upgrade_v7.sql;
```

如果你用 Navicat，直接打开并执行 `backend/sql/upgrade_v7.sql` 全部语句即可。

## 二、本次改造内容

- 服务管理已独立：新增 `nuoyuan_service_category`、`nuoyuan_service`
- 产品新增三组筛选标签字段：
  - `product_type`
  - `app_type`
  - `level_tag`
- 新增产品筛选标签表：`nuoyuan_product_filter_tag`
- 前台产品中心支持：
  - 左侧多维筛选（产品类型/应用分类/级别）
  - 顶部搜索（目录号/名称/关键词/应用）
  - 联动分页（10/20/50）
  - 标签数量统计
- 产品卡片支持外部规格展示，用户可直接点击询价

## 三、后台运营操作路径

1. 维护筛选标签  
   - 菜单：`产品管理` -> `筛选标签`
   - 三组标签可新增/编辑/删除/拖拽排序

2. 维护产品筛选信息  
   - 菜单：`产品管理` -> `产品列表`
   - 编辑产品时，勾选：
     - 产品类型
     - 应用分类
     - 级别

3. 维护服务数据（独立）  
   - 菜单：`服务管理` -> `服务分类` / `服务列表`
   - 不再复用产品表

## 四、接口说明（新增）

- 后台：
  - `GET /api/admin/product-filter-tags`
  - `POST /api/admin/product-filter-tags`
  - `PUT /api/admin/product-filter-tags/:id`
  - `DELETE /api/admin/product-filter-tags/:id`
  - `PUT /api/admin/product-filter-tags/reorder/:tagGroup`
  - `GET /api/admin/products/filter-stats`
  - `GET /api/admin/service-categories`
  - `GET /api/admin/services`

- 前台：
  - `GET /api/public/product-filter-tags`
  - `GET /api/public/products/filter-stats`
  - `GET /api/public/products`
  - `GET /api/public/service-categories`
  - `GET /api/public/services`

## 五、启动命令（单行）

- 后端：
```bash
lsof -ti:3000 | xargs -r kill -9; cd /Users/liuluyao/Desktop/Demo/backend && npm run dev
```
访问：`http://localhost:3000`

- 前台：
```bash
lsof -ti:5173 | xargs -r kill -9; cd /Users/liuluyao/Desktop/Demo/frontend && npm run dev
```
访问：`http://localhost:5173`

- 管理后台：
```bash
lsof -ti:5174 | xargs -r kill -9; cd /Users/liuluyao/Desktop/Demo/Auth && npm run dev -- --port 5174
```
访问：`http://localhost:5174`
