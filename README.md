# Codex Saiyan Pets · 赛亚人桌面宠物

两个《龙珠》灵感的 Q 版 Codex 自定义动画宠物：**超级赛亚人**和**自在极意功**。

| Super Saiyan · 超级赛亚人 | Ultra Instinct · 自在极意功 |
| :---: | :---: |
| ![超级赛亚人动画预览](previews/super-saiyan.gif) | ![自在极意功动画预览](previews/ultra-instinct.gif) |
| 金色尖发、青绿色眼睛、橙蓝训练服 | 银白尖发、银灰眼睛、裸上身与橙蓝训练装 |

每张预览依次展示九组动作和十六个视线方向。

## 下载与安装

[下载最新版本](https://github.com/yangguofengtop/codex-saiyan-pets/releases/latest)

可在仓库的 **Releases** 下载单个宠物安装包，也可以选择 **Code → Download ZIP** 下载整个仓库并解压。

### Windows

在解压后的仓库根目录打开 PowerShell：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

默认安装两个宠物。只安装其中一个：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Pet ultra-instinct
```

安装脚本优先使用 `CODEX_HOME`，否则安装到 `%USERPROFILE%\.codex\pets`。已有相同文件会跳过；已有不同版本会先备份到 `.codex\pet-backups`。

### 手动安装 / macOS / Linux

将 `pets` 里的宠物文件夹复制到 `~/.codex/pets/`；设置了 `CODEX_HOME` 时则复制到 `$CODEX_HOME/pets/`。每个宠物文件夹需要同时包含 `pet.json` 和 `spritesheet.webp`。已有同名目录时先备份。

安装后的结构：

```text
.codex/pets/
├── super-saiyan/
│   ├── pet.json
│   └── spritesheet.webp
└── ultra-instinct/
    ├── pet.json
    └── spritesheet.webp
```

### 在 Codex 中启用

打开 **设置 → Mini 与虚拟宠物**，点击刷新，选择 **Super Saiyan** 或 **Ultra Instinct**，然后唤醒 Mini。若当前应用尚未加载自定义宠物，可重新打开应用后查看。

## 动画规格

- Codex 宠物 v2：`spriteVersionNumber: 2`。
- 图集为 **8 列 × 11 行**，透明 WebP，**1536 × 2288** 像素。
- 单帧 **192 × 208** 像素。
- 九组动作：待机、向右跑、向左跑、挥手、跳跃、失落、等待回应、专注工作、思考审阅。
- 十六个顺时针视线方向；正上、正右、正下、正左分别对应 000、090、180、270 度。

两套图集均已通过格式、透明边缘、动作完整性、独立方向盲测和最终视觉检查。安装文件的 SHA-256 见 [checksums.sha256](checksums.sha256)。

## 仓库内容

```text
pets/          两个可直接安装的宠物
previews/      完整动画预览
scripts/       Windows 安装脚本
checksums.sha256
```

## 项目说明

这是使用 AI 辅助创作的非官方同人项目，与《龙珠》的原作版权方无关联。原作角色、名称及商标等权利归各自权利人所有；本仓库不代表获得原作授权。

Two unofficial, AI-assisted Dragon Ball inspired animated pets for Codex. Each pet includes nine animation states and sixteen look directions in the v2 spritesheet format.
