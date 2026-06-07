# prototype/ · P2 模块地图

> 层级：P2（模块成员清单）
> 父级：[../AGENTS.md](../AGENTS.md)
> 语言：**中文**

---

## 1. 模块定位

Catune 项目的静态 HTML 原型集，用于设计验证和赛事演示。所有页面自包含（内联 CSS + JS），无构建步骤。

---

## 2. 设计代际

| 代际 | 主题 | 画布色 | 页面 |
|------|------|--------|------|
| **v2**（当前） | 暖色调 | `#FFF8F0` | index, desk, plant, agent, demo |
| **v1**（遗留） | 深色调 | `#0A0F1A` | 其余全部，保留向后参考 |

---

## 3. 成员清单

| 文件 | 职责 |
|------|------|
| `_shared_head.html` | 可复用 `<head>` 片段（Tailwind 4 CDN + Google Fonts + v1 暗色 token），非独立页面 |
| `index.html` | 原型导航中心，链接全部页面，展示 Design DNA |
| **v2 核心页面** | |
| `desk.html` | 桌面主页：猫咪 + 3 节点脊柱可视化 + 5 种姿态状态 + AI 建议 |
| `plant.html` | 植物养成：5 阶段生长 + 7 天连续打卡 + 6 个成就徽章 |
| `agent.html` | MCP 网关：连接信息 + 终端模拟 + 10 个工具 + 数据流指标 |
| `demo.html` | 3 分钟闭环演示脚本：5 步循环 + 自动播放 + 赛事 Q&A |
| **v1 遗留页面** | |
| `dashboard.html` | v1 主仪表盘：姿态分数 + 脊柱可视化 + 热力图 |
| `dashboard-empty.html` | v1 空状态引导：首次使用 3 步设置 |
| `dashboard-v2.html` | 占位文件（仅含 "hello2"，无功能） |
| `gamification.html` | v1 游戏化/植物页（plant.html 的前身） |
| `pairing.html` | v1 BLE 设备配对：雷达扫描 + 信号强度 |
| `calibration.html` | v1 三点零位校准：9 步引导 + 倒计时 |
| `settings.html` | v1 设备管理/设置：设备信息 + AI 模型 + MCP 服务 |
| `report.html` | v1 周报/月报：分数曲线 + 异常分布 + AI 建议 |
| `watchdog.html` | v1 周期感知：后台监控任务 + SSE 告警 |
| `mock-console.html` | v1 演示控制台：5 种姿态场景选择 |
| `mcp-service.html` | v1 MCP 服务管理：状态 + QR 码 + 工具列表 |

---

## 4. 共享模式

- **自包含**：每个 HTML 内联 CSS（Tailwind `@theme` token）+ JS，无外部项目级资源
- **CDN 依赖**：`@tailwindcss/browser@4` + Google Fonts（Geist / Geist Mono / Noto Sans SC）
- **设备帧**：桌面端 `md:w-[390px] md:rounded-[44px]` iPhone 框
- **语言切换**：`setLang('zh'|'en')` + `data-lang-zh` / `data-lang-en` 属性
- **导航返回**：每个页面左上角隐藏的 `index.html` 返回链接

---

## 5. 维护纪律

- 新增/删除任何 HTML 文件 → 必须同步更新本文件的成员清单。
- v2 页面修改设计 token → 检查是否需要同步到 v1 遗留页面。
