param(
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\output\Catune-决赛PPT-v2-设计师素材版.pptx'),
  [string]$PreviewDir = (Join-Path $PSScriptRoot '..\output\Catune-决赛PPT-v2-预览')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$assetRoot = (Resolve-Path (Join-Path $root 'output\initial-assets')).Path
$templateCover = (Resolve-Path (Join-Path $root 'output\pitch-assets\template-cover.png')).Path
$templateBg = (Resolve-Path (Join-Path $root 'output\pitch-assets\template-bg.png')).Path

$msoFalse = 0
$msoTrue = -1
$msoTextOrientationHorizontal = 1
$msoShapeRectangle = 1
$ppLayoutBlank = 12
$ppSaveAsOpenXMLPresentation = 24
$ppAlignLeft = 1
$ppAlignCenter = 2

function Rgb([int]$r, [int]$g, [int]$b) { $r + (256 * $g) + (65536 * $b) }
$blue = Rgb 32 70 245
$blueDeep = Rgb 20 46 168
$ink = Rgb 20 24 43
$muted = Rgb 95 103 129
$green = Rgb 24 166 106
$orange = Rgb 255 122 36
$white = Rgb 255 255 255
$black = Rgb 0 0 0
$soft = Rgb 244 247 255
$line = Rgb 220 227 244
$darkGreen = Rgb 25 67 43

function Asset([string]$name) { (Resolve-Path (Join-Path $assetRoot $name)).Path }

function Add-Text($slide, [string]$text, [double]$left, [double]$top, [double]$width, [double]$height, [double]$size, [int]$color, [bool]$bold = $false, [int]$align = 1) {
  $shape = $slide.Shapes.AddTextbox($msoTextOrientationHorizontal, $left, $top, $width, $height)
  $shape.TextFrame2.MarginLeft = 0
  $shape.TextFrame2.MarginRight = 0
  $shape.TextFrame2.MarginTop = 0
  $shape.TextFrame2.MarginBottom = 0
  $shape.TextFrame2.WordWrap = $msoTrue
  $shape.TextFrame2.TextRange.Text = $text
  $shape.TextFrame2.TextRange.Font.Name = 'Microsoft YaHei'
  $shape.TextFrame2.TextRange.Font.NameFarEast = 'Microsoft YaHei'
  $shape.TextFrame2.TextRange.Font.Size = $size
  $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $color
  $shape.TextFrame2.TextRange.Font.Bold = $(if ($bold) { $msoTrue } else { $msoFalse })
  $shape.TextFrame2.TextRange.ParagraphFormat.Alignment = $align
  $shape
}

function Add-Rect($slide, [double]$left, [double]$top, [double]$width, [double]$height, [int]$fill, [double]$transparency = 0) {
  $shape = $slide.Shapes.AddShape($msoShapeRectangle, $left, $top, $width, $height)
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Fill.Transparency = $transparency
  $shape.Line.Visible = $msoFalse
  $shape
}

function Get-ImageSize([string]$path) {
  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Image]::FromFile($path)
  try { @($image.Width, $image.Height) } finally { $image.Dispose() }
}

function Add-ImageContain($slide, [string]$path, [double]$left, [double]$top, [double]$width, [double]$height) {
  $size = Get-ImageSize $path
  $scale = [Math]::Min($width / $size[0], $height / $size[1])
  $w = $size[0] * $scale
  $h = $size[1] * $scale
  $x = $left + (($width - $w) / 2)
  $y = $top + (($height - $h) / 2)
  $slide.Shapes.AddPicture($path, $msoFalse, $msoTrue, $x, $y, $w, $h)
}

function Add-ImageCover($slide, [string]$path, [double]$left = 0, [double]$top = 0, [double]$width = 960, [double]$height = 540) {
  $size = Get-ImageSize $path
  $scale = [Math]::Max($width / $size[0], $height / $size[1])
  $w = $size[0] * $scale
  $h = $size[1] * $scale
  $x = $left + (($width - $w) / 2)
  $y = $top + (($height - $h) / 2)
  $slide.Shapes.AddPicture($path, $msoFalse, $msoTrue, $x, $y, $w, $h)
}

function Add-Note($slide, [string]$text) {
  try { $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $text } catch {}
}

function Add-BaseSlide($presentation, [int]$number, [string]$section, [string]$title, [string]$lead, [string]$time) {
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $ppLayoutBlank)
  $slide.Shapes.AddPicture($templateBg, $msoFalse, $msoTrue, 0, 0, 960, 540) | Out-Null
  Add-Text $slide $section 245 40 420 22 13 $blue $true | Out-Null
  Add-Text $slide $title 70 72 750 60 29 $ink $true | Out-Null
  Add-Text $slide $lead 70 142 750 38 14 $muted $false | Out-Null
  Add-Text $slide $time 830 42 62 20 11 $blue $true $ppAlignCenter | Out-Null
  Add-Text $slide (('{0:D2} / 14' -f $number)) 830 505 72 16 9 $muted $true $ppAlignCenter | Out-Null
  $slide
}

function Add-FullSlide($presentation, [int]$number, [string]$imagePath) {
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $ppLayoutBlank)
  Add-ImageCover $slide $imagePath | Out-Null
  Add-Text $slide (('{0:D2} / 14' -f $number)) 842 510 62 14 9 $white $true $ppAlignCenter | Out-Null
  $slide
}

$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $powerPoint.Visible = $msoTrue
  $presentation = $powerPoint.Presentations.Add($msoTrue)
  $presentation.PageSetup.SlideWidth = 960
  $presentation.PageSetup.SlideHeight = 540

  if ($presentation.Slides.Count -eq 0) {
    $cover = $presentation.Slides.Add(1, $ppLayoutBlank)
  } else {
    $cover = $presentation.Slides.Item(1)
    $cover.Layout = $ppLayoutBlank
    for ($i = $cover.Shapes.Count; $i -ge 1; $i--) { $cover.Shapes.Item($i).Delete() }
  }
  $cover.Shapes.AddPicture($templateCover, $msoFalse, $msoTrue, 0, 0, 960, 540) | Out-Null
  Add-Rect $cover 82 390 405 104 $blueDeep 0.03 | Out-Null
  Add-Rect $cover 82 390 8 104 $orange 0 | Out-Null
  Add-Text $cover 'Catune' 112 404 260 42 31 $white $true | Out-Null
  Add-Text $cover '端侧坐姿教练 · 决赛版' 112 451 300 25 15 $white $false | Out-Null
  Add-Note $cover '20 秒：Catune 面向久坐办公人群，用轻量 IMU 感知坐姿，在手机本地完成判断、提醒和个性化表达。'

  $s = Add-FullSlide $presentation 2 (Asset '11.png')
  Add-Rect $s 620 330 300 145 $black 0.25 | Out-Null
  Add-Text $s '不拍人，也能实时看见坐姿变化' 650 350 235 58 25 $white $true | Out-Null
  Add-Text $s '姿态带采样 · 手机本地判断 · 当下即可纠正' 650 421 235 35 12 $white $false | Out-Null
  Add-Note $s '35 秒：一句话定位。不是事后报告，也不是持续摄像头，而是发生时即可纠正的端侧坐姿教练。'

  $s = Add-FullSlide $presentation 3 (Asset '03.png')
  Add-Rect $s 0 0 425 540 $black 0.23 | Out-Null
  Add-Text $s '问题不在于“不知道正确坐姿”' 55 72 325 70 27 $white $true | Out-Null
  Add-Text $s "而在于：`n何时开始前倾？`n异常持续了多久？`n当下能做什么？" 55 172 300 145 18 $white $false | Out-Null
  Add-Text $s '定时站立提醒不懂姿态；持续摄像头又有隐私压力。' 55 392 305 58 13 $white $false | Out-Null
  Add-Note $s '45 秒：用户通常知道怎么坐，但工作时不会察觉姿态逐渐变差。现有方案要么只计时，要么持续拍摄。'

  $s = Add-BaseSlide $presentation 4 '01 · 产品形态' '三块界面，把当下反馈和长期改善连起来' 'Desk 看状态，Plant 看积累，Settings 管设备与端侧模型。' '0:45'
  Add-ImageContain $s (Asset '02.png') 60 195 840 310 | Out-Null
  Add-Note $s '45 秒：仪表盘看猫的姿态和三个角度；植物页承载长期反馈；设置页负责硬件、提醒和模型，不让调试信息干扰日常使用。'

  $s = Add-BaseSlide $presentation 5 '02 · 完整闭环' '规则先给结果，Qwen 再把结果说得自然' '核心链路不等待模型，也不依赖网络。' '0:45'
  $labels = @(
    @('姿态采样','BLE / DeviceMotion'), @('规则判断','分类 / 评分 / 持续'), @('温和提醒','猫 / 震动 / 文案'), @('30秒跟练','动作标签'), @('成长复盘','日报 / 周报')
  )
  for ($i=0; $i -lt 5; $i++) {
    $x = 60 + ($i * 174)
    Add-Rect $s $x 232 145 145 $white 0 | Out-Null
    Add-Rect $s $x 232 6 145 $blue 0 | Out-Null
    Add-Text $s $labels[$i][0] ($x+16) 266 115 30 17 $ink $true $ppAlignCenter | Out-Null
    Add-Text $s $labels[$i][1] ($x+12) 318 122 34 11 $muted $false $ppAlignCenter | Out-Null
    if ($i -lt 4) { Add-Text $s '→' ($x+147) 288 28 28 22 $blue $true $ppAlignCenter | Out-Null }
  }
  Add-Text $s '模型不可用 → 自动回退本地安全文案，姿态监测不中断' 255 414 450 28 13 $green $true $ppAlignCenter | Out-Null
  Add-Note $s '45 秒：姿态分类、分数、提醒阈值和冷却全部由规则负责；Qwen 只生成 30 字以内的自然表达。'

  $s = Add-BaseSlide $presentation 6 '03 · 情感化体验' '猫负责当下反馈，植物负责长期坚持' '降低提醒疲劳，让“纠正坐姿”从任务变成陪伴。' '0:35'
  Add-ImageContain $s (Asset '04.gif') 60 210 405 270 | Out-Null
  Add-ImageContain $s (Asset '05.gif') 495 210 405 270 | Out-Null
  Add-Text $s '姿态变化时，猫同步前倾或回正' 92 476 340 22 11 $ink $true $ppAlignCenter | Out-Null
  Add-Text $s '持续良好坐姿，植物逐步生长' 528 476 340 22 11 $ink $true $ppAlignCenter | Out-Null
  Add-Note $s '35 秒：我们没有采用高频警报和重度游戏化。猫提供即时直觉，植物提供日积月累的非惩罚反馈。'

  $s = Add-BaseSlide $presentation 7 '04 · 核心创新' '规则与端侧模型双轨：确定性不交给大模型' '规则负责“是什么、何时提醒”，模型只负责“怎么说”。' '0:45'
  Add-Rect $s 70 220 360 220 $soft 0 | Out-Null
  Add-Text $s '规则引擎' 100 248 150 30 21 $blue $true | Out-Null
  Add-Text $s "姿态分类与评分`n异常持续时间`n提醒阈值与冷却`n动作标签与安全回退" 100 298 245 110 14 $ink $false | Out-Null
  Add-Rect $s 530 220 360 220 $soft 0 | Out-Null
  Add-Text $s '端侧 Qwen + MNN' 560 248 240 30 21 $orange $true | Out-Null
  Add-Text $s "30 字以内自然文案`n流式输出掩盖等待`n本地记忆注入`n失败不影响规则主链" 560 298 250 110 14 $ink $false | Out-Null
  Add-Text $s '→' 447 302 65 48 32 $blue $true $ppAlignCenter | Out-Null
  Add-Note $s '45 秒：这是最重要的技术判断。模型不覆盖姿态结论，因此模型超时、缺失或输出异常都不会让产品失效。'

  $s = Add-BaseSlide $presentation 8 '05 · Arm 端侧部署' '同一套 App，按设备能力推荐合适模型' '0.5B 保稳定，1.7B 面向大内存与 SME2/i8mm 设备。' '0:50'
  Add-Text $s '设备探测' 70 225 180 26 18 $ink $true | Out-Null
  Add-Text $s "RAM / ABI / 存储`nSME2 / i8mm / dot / fp16" 70 264 260 64 13 $muted $false | Out-Null
  Add-Text $s '运行路径' 70 350 180 26 18 $ink $true | Out-Null
  Add-Text $s "SME2 → KleidiAI`ni8mm → Armv8.2`n旧设备 → NEON 回退" 70 389 260 68 13 $muted $false | Out-Null
  Add-ImageContain $s (Asset '11.png') 380 205 465 280 | Out-Null
  Add-Text $s '历史真机：0.5B 中文可读、NEON 回退约 88.69 tok/s；新 SME2 手机正在复验中文与 backend。' 365 472 500 28 10 $blueDeep $true $ppAlignCenter | Out-Null
  Add-Note $s '50 秒：设备分级和模型管理已经实现。历史真机走 NEON；决赛前只在拿到 sme2:1 和对照数据后声称 SME2 加速。'

  $s = Add-BaseSlide $presentation 9 '06 · 个性化' 'LoRA 约束表达，本地记忆让教练“越用越懂你”' '训练目标与 App prompt 同格式：短、具体、带动作标签。' '0:45'
  Add-ImageContain $s (Asset '06.png') 62 210 300 280 | Out-Null
  Add-Text $s 'LoRA 对比结果' 420 220 250 28 20 $ink $true | Out-Null
  Add-Text $s "7 / 7 样例发生有效变化`n动作标签命中率 100%`n超 30 字：0`n禁词：0" 420 268 260 115 15 $blueDeep $false | Out-Null
  Add-Text $s '问卷 + 正负反馈 → 本地语义记忆 → 推理时相关性注入；支持查看与清空。' 420 406 405 58 13 $muted $false | Out-Null
  Add-Text $s '当前边界：LoRA 已训练和对比，merge → MNN → 新真机仍待完成。' 420 470 420 22 10 $orange $true | Out-Null
  Add-Note $s '45 秒：微调已经证明语气和格式有效，但不把训练结果包装成已部署；真机模型仍使用正式 MNN 模型。'

  $s = Add-BaseSlide $presentation 10 '07 · 系统架构' '传感器、纯 TS 业务、MNN 原生层和可选云端清晰分工' '核心坐姿闭环默认在设备本地；云端只用于可插拔视觉评估。' '0:50'
  Add-ImageContain $s (Asset '10.png') 235 190 490 320 | Out-Null
  Add-Text $s "INPUT`nBLE / IMU" 60 250 145 55 14 $green $true $ppAlignCenter | Out-Null
  Add-Text $s "CORE`n规则状态机" 60 366 145 55 14 $blue $true $ppAlignCenter | Out-Null
  Add-Text $s "NATIVE`nMNN + SME2" 755 250 145 55 14 $orange $true $ppAlignCenter | Out-Null
  Add-Text $s "CLOUD`n仅视觉评估" 755 366 145 55 14 $muted $true $ppAlignCenter | Out-Null
  Add-Note $s '50 秒：平台适配层隔离 BLE、传感器和原生模块；姿态业务保持纯 TS；设计层三端复用。'

  $s = Add-BaseSlide $presentation 11 '08 · 安全与降级' '四类失败，都有明确的产品行为' '离线不是异常模式，而是从架构开始设计的默认能力。' '0:40'
  $squares = @(
    @('07.png','异常持续','冷却后才提醒'),
    @('08.png','提醒触发','震动 + 卡片'),
    @('09.png','模型失败','规则文案兜底')
  )
  for ($i=0; $i -lt 3; $i++) {
    $x = 70 + ($i * 285)
    Add-ImageContain $s (Asset $squares[$i][0]) $x 205 230 230 | Out-Null
    Add-Text $s $squares[$i][1] $x 442 230 20 13 $ink $true $ppAlignCenter | Out-Null
    Add-Text $s $squares[$i][2] $x 466 230 18 10 $muted $false $ppAlignCenter | Out-Null
  }
  Add-Note $s '40 秒：传感器断连显示离线；模型失败切规则文案；网络断开不影响核心监测；输出超长或命中禁词直接替换。'

  $s = Add-BaseSlide $presentation 12 '09 · 已有证据' '从概念走到可运行工程，已经有三类证据' '代码、自动化测试和历史真机结果互相印证。' '0:50'
  $metrics = @(
    @('79','自动化测试全部通过','姿态规则 / 安全链 / i18n / App'),
    @('88.69','历史真机 Decode TPS','Qwen2.5-0.5B · NEON 回退'),
    @('5.39MB','APK 内 libMNN.so','arm64 · SME2 编译支持'),
    @('5','可固定触发姿态状态','含离线和四种典型坐姿')
  )
  for ($i=0; $i -lt 4; $i++) {
    $row = [Math]::Floor($i / 2)
    $col = $i % 2
    $x = 70 + ($col * 420)
    $y = 210 + ($row * 135)
    Add-Rect $s $x $y 370 110 $white 0 | Out-Null
    Add-Rect $s $x $y 7 110 $(if ($i -eq 1) {$orange} else {$blue}) 0 | Out-Null
    Add-Text $s $metrics[$i][0] ($x+25) ($y+18) 100 42 26 $blueDeep $true | Out-Null
    Add-Text $s $metrics[$i][1] ($x+135) ($y+20) 210 24 15 $ink $true | Out-Null
    Add-Text $s $metrics[$i][2] ($x+135) ($y+53) 210 38 10 $muted $false | Out-Null
  }
  Add-Note $s '50 秒：不要只讲完成了多少功能。展示规则测试、原生库、历史真机和固定状态演示四种可复验证据。'

  $s = Add-FullSlide $presentation 13 (Asset '01.png')
  Add-Rect $s 0 0 455 540 $black 0.28 | Out-Null
  Add-Text $s '用户价值不在“多一个模型”' 55 75 350 50 27 $white $true | Out-Null
  Add-Text $s "而在于：`n不拍摄办公环境`n异常发生时立即反馈`n给出可执行动作`n断网仍能工作" 55 160 315 165 18 $white $false | Out-Null
  Add-Text $s '硬件成本目标：200 元级；手机 App 承担计算与交互。' 55 402 320 54 13 $white $true | Out-Null
  Add-Note $s '40 秒：与定时提醒相比，Catune 懂姿态；与摄像头相比，更适合办公室；与事后课程相比，它在问题发生时行动。'

  $s = $presentation.Slides.Add(14, $ppLayoutBlank)
  Add-Rect $s 0 0 960 540 $white 0 | Out-Null
  Add-ImageContain $s (Asset '12.png') 25 70 420 380 | Out-Null
  Add-Rect $s 470 0 490 540 $black 0.18 | Out-Null
  Add-Text $s '决赛前只做三件事' 535 70 330 45 28 $white $true | Out-Null
  Add-Text $s '01' 535 150 45 28 18 $orange $true | Out-Null
  Add-Text $s 'BNO085 + S3 单节点真实闭环' 595 150 300 28 16 $white $true | Out-Null
  Add-Text $s '02' 535 220 45 28 18 $orange $true | Out-Null
  Add-Text $s 'SME2 手机中文与性能复验' 595 220 300 28 16 $white $true | Out-Null
  Add-Text $s '03' 535 290 45 28 18 $orange $true | Out-Null
  Add-Text $s '冻结 APK + 全离线 Demo 兜底' 595 290 300 28 16 $white $true | Out-Null
  Add-Text $s '让坐姿问题从“事后发现”变成“发生时即可纠正”。' 535 390 340 70 19 $white $true | Out-Null
  Add-Note $s '55 秒：收束并进入现场 Demo。先连姿态带、坐直校准、前倾触发反馈；随后展示中文推理和 SME2 证据。'

  $outputFull = [System.IO.Path]::GetFullPath($OutputPath)
  if (Test-Path $outputFull) { Remove-Item -LiteralPath $outputFull -Force }
  $presentation.SaveAs($outputFull, $ppSaveAsOpenXMLPresentation)

  if (Test-Path $PreviewDir) { Remove-Item -LiteralPath $PreviewDir -Recurse -Force }
  New-Item -ItemType Directory -Path $PreviewDir | Out-Null
  $presentation.Export([System.IO.Path]::GetFullPath($PreviewDir), 'PNG', 1600, 900)
  Write-Output "Generated: $outputFull"
  Write-Output "Preview: $([System.IO.Path]::GetFullPath($PreviewDir))"
}
finally {
  if ($presentation) { $presentation.Close() }
  if ($powerPoint) { $powerPoint.Quit() }
  if ($presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
  if ($powerPoint) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}


