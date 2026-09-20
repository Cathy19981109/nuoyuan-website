# 超级玛丽 · 简易版（Python + 网页版）

一个简易横向卷轴平台跳跃小游戏，提供 **网页版** 和 **Python/Pygame 版**。

## 网页版（推荐，直接打开链接玩）

**现在就能玩（Vercel 预览合并到主站后也会生效）：**

- 正式站（合并 PR 并部署后）：https://nuoyuan-frontend.vercel.app/mario/
- GitHub 网页预览（当前分支，无需安装）：  
  https://htmlpreview.github.io/?https://github.com/Cathy19981109/nuoyuan-website/blob/cursor/simple-mario-game-f0f3/mario_game/index.html

本地打开也可以：双击 `mario_game/index.html`，或：

```bash
cd mario_game
python3 -m http.server 8080
```

然后访问：http://localhost:8080/

## Python 桌面版

### 环境要求

- Python 3.8+
- pygame

### 安装与运行

在项目目录下执行：

```bash
cd mario_game
pip install -r requirements.txt
python mario.py
```

如果使用 `pip3` / `python3`：

```bash
cd mario_game
pip3 install -r requirements.txt
python3 mario.py
```

## 操作说明

| 按键 | 作用 |
|------|------|
| ← → 或 A / D | 左右移动 |
| 空格 / W / ↑ | 跳跃 |
| R | 重新开始 |
| Esc | 退出游戏 |

## 游戏目标

向右跑、跳过平台，踩扁棕色小怪（踩头），收集金币，碰到绿色终点旗即过关。掉出地图或撞到怪体会失败。
