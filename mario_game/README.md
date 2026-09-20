# 超级玛丽 · 简易版（Python + Pygame）

一个用 Python 写的简易横向卷轴平台跳跃小游戏。

## 环境要求

- Python 3.8+
- pygame

## 安装与运行

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
