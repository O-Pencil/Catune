// jest 处理 CSS 导入的 stub：什么都不做，因为 CSS 只在 native/web runtime 注入，
// jest 用 react-test-renderer 跑 React 树，不关心样式。
module.exports = {};