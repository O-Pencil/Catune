# Commit 规范

所有 commit message **必须使用中文**，并遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

[optional body]
```

## Type 类型

| Type       | 用途                         |
| ---------- | ---------------------------- |
| `feat`     | 新功能                       |
| `fix`      | 修复 Bug                     |
| `docs`     | 仅文档变更                   |
| `style`    | 代码格式（空格、分号等）     |
| `refactor` | 重构（非 bugfix 也非 feat）  |
| `perf`     | 性能优化                     |
| `test`     | 测试相关                     |
| `chore`    | 构建、工具链、依赖           |
| `ci`       | CI/CD 配置                   |
| `revert`   | 回滚                         |

## 规则

- **语言**：必须中文。禁止英文 commit message。
- **Subject**：祈使句，不加句号，不超过 72 字符。
- **Scope**：可选，小写（如 `android`、`ios`、`rn`、`mcp`、`prd`）。
- **Body**：每行不超过 72 字符，说明 *为什么*，而不是 *做了什么*。

## 示例

```
feat(android): 集成 MNN 推理引擎
fix(prd): 修复文件移动导致的 UTF-8 编码损坏
docs: 添加 commit 规范到 CLAUDE.md
chore(android): 更新 Gradle 构建配置
```
