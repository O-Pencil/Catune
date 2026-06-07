/**
 * [WHO]: 无导出（应用入口）
 * [FROM]: react (StrictMode), react-dom/client (createRoot), ../styles/index.css, ./App (App)
 * [TO]: 被 Vite 开发服务器 / 构建入口消费
 * [HERE]: web/src/app/main.tsx · Vite 入口，挂载 React root 到 DOM
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../styles/index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
