#!/usr/bin/env python3
"""
简易超级玛丽风格平台跳跃游戏
操作：← → 或 A/D 移动，空格 / W / ↑ 跳跃，R 重新开始，Esc 退出
"""

import sys
import pygame

# ---------- 基本设置 ----------
WIDTH, HEIGHT = 960, 540
FPS = 60
TILE = 48
GRAVITY = 0.55
JUMP_POWER = -12.5
MOVE_SPEED = 5

SKY = (110, 180, 255)
GROUND = (90, 160, 50)
DIRT = (140, 90, 40)
BRICK = (200, 120, 60)
COIN_COLOR = (255, 210, 40)
ENEMY_COLOR = (160, 80, 40)
PLAYER_RED = (220, 40, 40)
PLAYER_BLUE = (40, 80, 200)
FLAG_POLE = (40, 40, 40)
FLAG = (40, 180, 60)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)
UI_BG = (0, 0, 0, 140)


def make_level():
    """用字符画关卡：# 地面/砖块，C 金币，E 敌人，P 出生点，F 终点旗"""
    rows = [
        "....................................................................",
        "....................................................................",
        "....................................................................",
        ".........................C..........................................",
        "......................#######.......................................",
        "..............C.....................................................",
        "...........######.................C........C........................",
        ".................................####....####.......................",
        "......C.............................................................",
        "..P.####..............E.......................E.........C...........",
        "##############...##############...#############################...##",
        "##############...##############...#############################...##",
    ]
    # 补齐长度并在底部留旗
    width = max(len(r) for r in rows)
    rows = [r.ljust(width, ".") for r in rows]
    # 在终点放旗与平台
    flag_x = width - 4
    rows[7] = rows[7][:flag_x] + "F" + rows[7][flag_x + 1 :]
    return rows


class Camera:
    def __init__(self):
        self.x = 0

    def update(self, target_x, level_pixel_w):
        self.x = max(0, min(target_x - WIDTH // 3, level_pixel_w - WIDTH))


class Player(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((32, 40), pygame.SRCALPHA)
        self._draw()
        self.rect = self.image.get_rect(topleft=(x, y))
        self.vel = pygame.Vector2(0, 0)
        self.on_ground = False
        self.facing = 1
        self.alive = True
        self.won = False
        self.coins = 0

    def _draw(self):
        self.image.fill((0, 0, 0, 0))
        # 帽子/身体
        pygame.draw.rect(self.image, PLAYER_RED, (4, 2, 24, 10))
        pygame.draw.rect(self.image, (255, 200, 150), (8, 10, 16, 12))
        pygame.draw.rect(self.image, PLAYER_BLUE, (6, 22, 20, 12))
        pygame.draw.rect(self.image, BLACK, (10, 34, 6, 6))
        pygame.draw.rect(self.image, BLACK, (18, 34, 6, 6))

    def handle_input(self, keys):
        self.vel.x = 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.vel.x = -MOVE_SPEED
            self.facing = -1
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.vel.x = MOVE_SPEED
            self.facing = 1

    def jump(self):
        if self.on_ground and self.alive and not self.won:
            self.vel.y = JUMP_POWER
            self.on_ground = False

    def update(self, solids):
        if not self.alive or self.won:
            return

        self.vel.y += GRAVITY
        if self.vel.y > 16:
            self.vel.y = 16

        # 水平
        self.rect.x += int(self.vel.x)
        for s in solids:
            if self.rect.colliderect(s):
                if self.vel.x > 0:
                    self.rect.right = s.left
                elif self.vel.x < 0:
                    self.rect.left = s.right

        # 垂直
        self.rect.y += int(self.vel.y)
        self.on_ground = False
        for s in solids:
            if self.rect.colliderect(s):
                if self.vel.y > 0:
                    self.rect.bottom = s.top
                    self.vel.y = 0
                    self.on_ground = True
                elif self.vel.y < 0:
                    self.rect.top = s.bottom
                    self.vel.y = 0

        # 掉出地图
        if self.rect.top > HEIGHT + 100:
            self.alive = False


class Enemy(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((36, 28), pygame.SRCALPHA)
        pygame.draw.ellipse(self.image, ENEMY_COLOR, (0, 4, 36, 24))
        pygame.draw.circle(self.image, WHITE, (12, 14), 5)
        pygame.draw.circle(self.image, WHITE, (24, 14), 5)
        pygame.draw.circle(self.image, BLACK, (12, 14), 2)
        pygame.draw.circle(self.image, BLACK, (24, 14), 2)
        self.rect = self.image.get_rect(bottomleft=(x, y))
        self.speed = -1.8
        self.alive = True

    def update(self, solids):
        if not self.alive:
            return
        self.rect.x += int(self.speed)
        for s in solids:
            if self.rect.colliderect(s):
                if self.speed > 0:
                    self.rect.right = s.left
                else:
                    self.rect.left = s.right
                self.speed *= -1
                break
        # 简单落地探测：脚下一格空则掉头
        foot = self.rect.move(int(self.speed * 8), 4)
        standing = any(foot.colliderect(s) for s in solids)
        if not standing:
            self.speed *= -1


class Coin(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((20, 28), pygame.SRCALPHA)
        pygame.draw.ellipse(self.image, COIN_COLOR, (2, 0, 16, 28))
        pygame.draw.ellipse(self.image, (255, 240, 120), (6, 6, 8, 16))
        self.rect = self.image.get_rect(center=(x, y))
        self.base_y = y
        self.t = 0

    def update(self):
        self.t += 0.12
        self.rect.centery = int(self.base_y + 3 * pygame.math.sin(self.t))


class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("超级玛丽 · 简易版")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("microsoftyahei,simhei,arial", 28)
        self.big = pygame.font.SysFont("microsoftyahei,simhei,arial", 48, bold=True)
        self.camera = Camera()
        self.reset()

    def reset(self):
        self.level = make_level()
        self.rows = len(self.level)
        self.cols = len(self.level[0])
        self.level_w = self.cols * TILE
        self.solids = []
        self.coins = pygame.sprite.Group()
        self.enemies = pygame.sprite.Group()
        self.flag_rect = None
        spawn = (TILE * 2, TILE * 8)

        for r, row in enumerate(self.level):
            for c, ch in enumerate(row):
                x, y = c * TILE, r * TILE
                if ch == "#":
                    self.solids.append(pygame.Rect(x, y, TILE, TILE))
                elif ch == "C":
                    self.coins.add(Coin(x + TILE // 2, y + TILE // 2))
                elif ch == "E":
                    self.enemies.add(Enemy(x + 6, y + TILE))
                elif ch == "P":
                    # 脚底对齐下一行地面顶边（玩家身高 40）
                    spawn = (x + 8, (r + 1) * TILE - 40)
                elif ch == "F":
                    self.flag_rect = pygame.Rect(x + 18, y - TILE * 3, 12, TILE * 4)

        if self.flag_rect is None:
            self.flag_rect = pygame.Rect(self.level_w - 3 * TILE, HEIGHT - 5 * TILE, 12, 4 * TILE)

        self.player = Player(*spawn)
        # 落地检测：若脚下已贴地则允许立即起跳
        foot = self.player.rect.move(0, 1)
        if any(foot.colliderect(s) for s in self.solids):
            self.player.on_ground = True
        self.message = ""
        self.camera.x = 0

    def draw_background(self):
        self.screen.fill(SKY)
        # 远山
        ox = -self.camera.x * 0.2
        for i, (mx, my, mw, mh) in enumerate(
            [(80, 360, 220, 180), (320, 380, 260, 160), (620, 350, 200, 190), (900, 370, 240, 170)]
        ):
            pts = [
                (ox + mx, HEIGHT),
                (ox + mx + mw // 2, my),
                (ox + mx + mw, HEIGHT),
            ]
            color = (70 + i * 10, 150 + i * 5, 90)
            pygame.draw.polygon(self.screen, color, pts)
        # 云
        for cx, cy in [(100, 80), (400, 60), (700, 100), (1100, 70)]:
            x = cx - self.camera.x * 0.35
            pygame.draw.ellipse(self.screen, WHITE, (x, cy, 90, 40))
            pygame.draw.ellipse(self.screen, WHITE, (x + 30, cy - 18, 70, 40))

    def draw_tiles(self):
        for rect in self.solids:
            draw = rect.move(-self.camera.x, 0)
            if draw.right < 0 or draw.left > WIDTH:
                continue
            # 草地顶 + 泥土
            pygame.draw.rect(self.screen, DIRT, draw)
            pygame.draw.rect(self.screen, GROUND, (draw.x, draw.y, draw.w, 12))
            pygame.draw.line(self.screen, (60, 40, 20), draw.topleft, draw.topright, 1)

    def draw_flag(self):
        if not self.flag_rect:
            return
        r = self.flag_rect.move(-self.camera.x, 0)
        pygame.draw.rect(self.screen, FLAG_POLE, r)
        flag = [(r.right, r.top + 10), (r.right + 40, r.top + 28), (r.right, r.top + 46)]
        pygame.draw.polygon(self.screen, FLAG, flag)

    def draw_ui(self):
        coin_txt = self.font.render(f"金币: {self.player.coins}", True, WHITE)
        tip = self.font.render("←→移动  空格跳跃  R重开  Esc退出", True, WHITE)
        self.screen.blit(coin_txt, (16, 12))
        self.screen.blit(tip, (16, HEIGHT - 36))

        if not self.player.alive:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 150))
            self.screen.blit(overlay, (0, 0))
            t = self.big.render("游戏结束", True, (255, 80, 80))
            s = self.font.render("按 R 重新开始", True, WHITE)
            self.screen.blit(t, t.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 20)))
            self.screen.blit(s, s.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 30)))
        elif self.player.won:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 140))
            self.screen.blit(overlay, (0, 0))
            t = self.big.render("过关成功！", True, (80, 255, 120))
            s = self.font.render(f"金币 {self.player.coins} 枚 · 按 R 再玩一次", True, WHITE)
            self.screen.blit(t, t.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 20)))
            self.screen.blit(s, s.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 30)))

    def handle_collisions(self):
        # 金币
        for coin in pygame.sprite.spritecollide(self.player, self.coins, dokill=True):
            self.player.coins += 1

        # 敌人
        for enemy in list(self.enemies):
            if not enemy.alive:
                continue
            if not self.player.rect.colliderect(enemy.rect):
                continue
            # 从上踩扁
            if self.player.vel.y > 0 and self.player.rect.bottom - enemy.rect.top < 22:
                enemy.alive = False
                enemy.kill()
                self.player.vel.y = JUMP_POWER * 0.55
            else:
                self.player.alive = False

        # 旗杆
        if self.flag_rect and self.player.rect.colliderect(self.flag_rect):
            self.player.won = True
            self.player.vel.x = 0

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_r:
                        self.reset()
                    elif event.key in (pygame.K_SPACE, pygame.K_w, pygame.K_UP):
                        self.player.jump()

            keys = pygame.key.get_pressed()
            if self.player.alive and not self.player.won:
                self.player.handle_input(keys)

            self.player.update(self.solids)
            self.enemies.update(self.solids)
            self.coins.update()
            self.handle_collisions()
            self.camera.update(self.player.rect.centerx, self.level_w)

            self.draw_background()
            self.draw_tiles()
            self.draw_flag()

            for coin in self.coins:
                self.screen.blit(coin.image, coin.rect.move(-self.camera.x, 0))
            for enemy in self.enemies:
                self.screen.blit(enemy.image, enemy.rect.move(-self.camera.x, 0))
            self.screen.blit(self.player.image, self.player.rect.move(-self.camera.x, 0))
            self.draw_ui()

            pygame.display.flip()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit(0)


if __name__ == "__main__":
    Game().run()
