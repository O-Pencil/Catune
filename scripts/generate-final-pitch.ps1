param(
  [string]$TemplatePath = (Join-Path $PSScriptRoot '..\output\HappyQwensday-ppt模版.pptx'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\output\Catune-决赛PPT-初版.pptx'),
  [string]$PreviewDir = (Join-Path $PSScriptRoot '..\output\Catune-决赛PPT-预览')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$template = (Resolve-Path $TemplatePath).Path
$background = (Resolve-Path (Join-Path $root 'output\pitch-assets\template-bg.png')).Path
$coverBackground = (Resolve-Path (Join-Path $root 'output\pitch-assets\template-cover.png')).Path
$design = (Resolve-Path (Join-Path $root 'public\design.png')).Path
$cat = (Resolve-Path (Join-Path $root 'public\cat-center.png')).Path
$plant = (Resolve-Path (Join-Path $root 'public\plant.png')).Path

$msoFalse = 0
$msoTrue = -1
$msoTextOrientationHorizontal = 1
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$ppLayoutBlank = 12
$ppSaveAsOpenXMLPresentation = 24
$ppAlignLeft = 1
$ppAlignCenter = 2

function Rgb([int]$r, [int]$g, [int]$b) { return $r + (256 * $g) + (65536 * $b) }
$blue = Rgb 32 70 245
$blueDeep = Rgb 20 46 168
$ink = Rgb 20 24 43
$muted = Rgb 95 103 129
$line = Rgb 223 229 247
$green = Rgb 24 166 106
$orange = Rgb 255 122 36
$white = Rgb 255 255 255
$terminal = Rgb 17 26 58

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
  return $shape
}

function Add-Box($slide, [double]$left, [double]$top, [double]$width, [double]$height, [int]$fill, [int]$accent = 0) {
  $box = $slide.Shapes.AddShape($msoShapeRectangle, $left, $top, $width, $height)
  $box.Fill.ForeColor.RGB = $fill
  $box.Line.Visible = $msoFalse
  if ($accent -ne 0) {
    $bar = $slide.Shapes.AddShape($msoShapeRectangle, $left, $top, 7, $height)
    $bar.Fill.ForeColor.RGB = $accent
    $bar.Line.Visible = $msoFalse
  }
  return $box
}

function Add-BaseSlide($presentation, [int]$number, [string]$section, [string]$title, [string]$lead, [string]$time) {
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $ppLayoutBlank)
  $slide.Shapes.AddPicture($background, $msoFalse, $msoTrue, 0, 0, 960, 540) | Out-Null
  Add-Text $slide $section 245 42 410 24 14 $blue $true | Out-Null
  Add-Text $slide $title 70 73 745 70 30 $ink $true | Out-Null
  Add-Text $slide $lead 70 145 720 44 15 $muted $false | Out-Null
  Add-Text $slide $time 830 45 60 20 12 $blue $true $ppAlignCenter | Out-Null
  Add-Text $slide (('{0:D2} / 09' -f $number)) 830 505 70 18 10 $muted $true $ppAlignCenter | Out-Null
  return $slide
}

function Add-Note($slide, [string]$text) {
  try {
    $placeholder = $slide.NotesPage.Shapes.Placeholders.Item(2)
    $placeholder.TextFrame.TextRange.Text = $text
  } catch {}
}

$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  # PowerPoint COM refuses a hidden Application on some Office builds.
  # Keep the application visible while opening the document without a window.
  $powerPoint.Visible = $msoTrue
  # The supplied deck is protected against slide edits. Build an editable deck from
  # its extracted 16:9 cover/content artwork while leaving the original untouched.
  $presentation = $powerPoint.Presentations.Add($msoTrue)
  $presentation.PageSetup.SlideWidth = 960
  $presentation.PageSetup.SlideHeight = 540
  if ($presentation.Slides.Count -eq 0) {
    $cover = $presentation.Slides.Add(1, $ppLayoutBlank)
  } else {
    $cover = $presentation.Slides.Item(1)
    $cover.Layout = $ppLayoutBlank
    for ($i = $cover.Shapes.Count; $i -ge 1; $i--) { $cover.Shapes.Item($i).Delete() }
    while ($presentation.Slides.Count -gt 1) { $presentation.Slides.Item(2).Delete() }
  }
  $cover.Shapes.AddPicture($coverBackground, $msoFalse, $msoTrue, 0, 0, 960, 540) | Out-Null
  Add-Box $cover 92 402 390 96 $blueDeep $orange | Out-Null
  Add-Text $cover 'Catune' 116 416 220 42 31 $white $true | Out-Null
  Add-Text $cover '端侧坐姿教练 · 真实 IMU × 规则引擎 × Qwen' 116 460 330 28 14 $white $false | Out-Null
  Add-Note $cover '20 秒：Catune 是一个不依赖持续摄像头、在手机本地完成判断和反馈的坐姿教练。'

  $s = Add-BaseSlide $presentation 2 '01 · 痛点与创意' '久坐真正的问题，是坏姿态发生时没人提醒' '不使用持续摄像头，用轻量 IMU 感知前倾、含胸和侧倾。' '0:55'
  $items = @(
    @('01', '定时提醒不懂姿态', '知道坐了多久，却不知道此刻坐得怎么样。', $blue),
    @('02', '摄像头不适合办公室', '持续拍摄带来隐私压力，也增加网络依赖。', $orange),
    @('03', '反馈必须立刻可做', '提醒发生在姿态变差当下，并给出 30 秒动作。', $green)
  )
  for ($i=0; $i -lt 3; $i++) {
    $x = 70 + ($i * 274)
    Add-Box $s $x 232 244 205 $white $items[$i][3] | Out-Null
    Add-Text $s $items[$i][0] ($x+22) 250 70 42 29 $items[$i][3] $true | Out-Null
    Add-Text $s $items[$i][1] ($x+22) 304 200 42 18 $ink $true | Out-Null
    Add-Text $s $items[$i][2] ($x+22) 354 198 58 13 $muted $false | Out-Null
  }
  Add-Note $s '55 秒：用户不是不知道正确坐姿，而是不知道自己何时开始前倾。Catune 只采集 IMU 姿态，不拍人。'

  $s = Add-BaseSlide $presentation 3 '02 · 产品闭环' '从一个四元数，到一次可执行的纠正' '数据、判断、提醒、行动和复盘形成离线可用的完整链路。' '1:10'
  $flows = @(
    @('姿态采样','BNO085 / 手机 IMU'), @('规则判断','状态 / 分数 / 持续'), @('温和提醒','猫姿态 / 震动 / 文案'), @('30 秒跟练','动作标签驱动'), @('成长复盘','植物 / 日报 / 周报')
  )
  for ($i=0; $i -lt 5; $i++) {
    $x = 60 + ($i * 174)
    Add-Box $s $x 258 145 138 $white $blue | Out-Null
    Add-Text $s $flows[$i][0] ($x+16) 285 114 32 17 $ink $true $ppAlignCenter | Out-Null
    Add-Text $s $flows[$i][1] ($x+12) 334 122 42 11 $muted $false $ppAlignCenter | Out-Null
    if ($i -lt 4) { Add-Text $s '→' ($x+147) 304 28 30 23 $blue $true $ppAlignCenter | Out-Null }
  }
  Add-Note $s '70 秒：规则引擎决定状态、阈值和冷却；Qwen 只把确定结果翻译成自然语言。模型失败，监测和提醒仍工作。'

  $s = Add-BaseSlide $presentation 4 '03 · 技术架构' '规则负责确定性，端侧 Qwen 负责表达' '一套 TypeScript 跑 Android、iOS 与 Web；原生能力通过平台层隔离。' '1:05'
  $layers = @(
    @('数据与平台', "ESP32-S3 + BNO085`nBLE / WS / DeviceMotion`nVibration / FileSystem"),
    @('确定性核心', "姿态状态机与评分`n异常持续与冷却`n动作标签 / 安全过滤`n模型失败，闭环仍运行"),
    @('端侧智能与体验', "Qwen + MNN 流式生成`n设备分级与模型管理`nDesk / Plant / Training")
  )
  for ($i=0; $i -lt 3; $i++) {
    $x = 70 + ($i * 276)
    $accent = $(if ($i -eq 1) { $blue } else { $line })
    Add-Box $s $x 230 246 220 $white $accent | Out-Null
    Add-Text $s $layers[$i][0] ($x+22) 252 205 35 19 $ink $true | Out-Null
    Add-Text $s $layers[$i][1] ($x+22) 305 202 120 13 $muted $false | Out-Null
  }
  Add-Note $s '65 秒：讲清平台层、纯 TS 规则层和体验层。MCP 不在 Catune 产品主链，不为模板硬讲。'

  $s = Add-BaseSlide $presentation 5 '04 · 端侧证明' '端侧 AI 的证据分成“库、硬件、运行时”三层' '只有 hw=true、lib=true、sme2:1 同时成立，才声称 SME2 加速。' '1:05'
  $proofs = @(
    @('已完成','MNN 原生文本与流式桥','下载、切换、Benchmark、规则兜底已接入'),
    @('已完成','LoRA 场景训练与对比','动作标签 100%，7/7 样例有效变化'),
    @('待复验','新 SME2 手机中文与性能','当前 APK 输出非中文，以新实测为准')
  )
  for ($i=0; $i -lt 3; $i++) {
    $y = 228 + ($i * 82)
    Add-Text $s $proofs[$i][0] 70 $y 80 24 13 $blue $true | Out-Null
    Add-Text $s $proofs[$i][1] 155 $y 300 28 16 $ink $true | Out-Null
    Add-Text $s $proofs[$i][2] 155 ($y+30) 315 34 11 $muted $false | Out-Null
  }
  Add-Box $s 515 225 365 210 $terminal $green | Out-Null
  Add-Text $s "catune benchmark`n`nmodel     Qwen2.5-0.5B`nhw_sme2   待真机截图`nlib_sme2  true`nbackend   待真机截图`noutput    待中文复验`ndecode    待 3 次均值" 545 250 305 165 14 (Rgb 234 240 255) $false | Out-Null
  Add-Note $s '65 秒：左边是已有工程证据，右边是决赛验收位。不要把历史 NEON 数据说成新 SME2 手机成绩。'

  $s = Add-BaseSlide $presentation 6 '05 · 真实硬件' '先把单节点闭环做实，再扩展到颈、胸、腰三节点' '17 字节 BLE 协议，把 BNO085 四元数稳定送进姿态引擎。' '0:55'
  Add-Box $s 70 235 330 200 $white $orange | Out-Null
  Add-Text $s 'ESP32-S3 + BNO085' 95 260 270 34 20 $ink $true | Out-Null
  Add-Text $s 'VIN→3V3 · SDA→GPIO8 · SCL→GPIO9' 95 312 270 28 13 $blueDeep $true | Out-Null
  Add-Text $s '固件 50Hz 采样，默认胸椎 Node-T；断连后重新广播，App 自动降级。' 95 356 270 58 12 $muted $false | Out-Null
  Add-Box $s 440 225 440 220 $terminal $green | Out-Null
  Add-Text $s "I2C scan`n0x4A <- BNO085`nBNO085 OK`nCatune-Node advertising`n`nBLE notify -> calibrate -> engine.update`n现场证据位：待接线与录屏" 470 248 375 175 14 (Rgb 234 240 255) $false | Out-Null
  Add-Note $s '55 秒：完成后把右侧待验收文字替换为面包板实拍、串口和 BLE connected 截图。'

  $s = Add-BaseSlide $presentation 7 '06 · 用户价值' '低打扰、可执行、能坚持' '黑猫把抽象角度变成直觉反馈，植物把长期改善变成看得见的积累。' '0:55'
  $values = @(@('当下看得懂','猫的姿态跟随传感器变化，异常时才震动。'),@('下一步做得到','每次只给一个 30 秒动作，不打断工作节奏。'),@('长期愿意坚持','日报、周报和植物成长形成非惩罚式反馈。'))
  for ($i=0; $i -lt 3; $i++) {
    $y = 232 + ($i * 84)
    Add-Text $s $values[$i][0] 70 $y 285 28 18 $ink $true | Out-Null
    Add-Text $s $values[$i][1] 70 ($y+31) 350 40 12 $muted $false | Out-Null
  }
  $s.Shapes.AddPicture($design, $msoFalse, $msoTrue, 605, 198, 180, 270) | Out-Null
  Add-Note $s '55 秒：产品价值不是把模型参数展示给用户，而是让人一眼知道现在怎么坐、下一步做什么。'

  $s = Add-BaseSlide $presentation 8 '07 · 现场 Demo' '两分钟，只证明一件事：真实姿态变化能闭环' '现场主线用真实单节点；录屏与 Preview Sandbox 是无缝兜底。' '2:00'
  $steps = @(@('01','连接 Catune-Node','Settings 显示 BLE connected'),@('02','坐直并校准','当前四元数记为零点'),@('03','身体前倾','Monitor 角度与 Desk 猫同步'),@('04','触发提醒与跟练','规则瞬时反馈，Qwen 异步改写'))
  for ($i=0; $i -lt 4; $i++) {
    $y = 220 + ($i * 63)
    Add-Text $s $steps[$i][0] 70 $y 45 28 18 $blue $true | Out-Null
    Add-Text $s $steps[$i][1] 125 $y 300 25 16 $ink $true | Out-Null
    Add-Text $s $steps[$i][2] 125 ($y+26) 340 28 11 $muted $false | Out-Null
  }
  $s.Shapes.AddPicture($cat, $msoFalse, $msoTrue, 550, 215, 245, 315) | Out-Null
  Add-Note $s '120 秒：连接、校准、前倾、提醒、恢复、跟练。任何一步超过 10 秒，直接切录屏或 Preview Sandbox。'

  $s = Add-BaseSlide $presentation 9 '08 · 总结' '真实感知 + 确定性规则 + 端侧 Qwen' '三者合成一个可用产品：核心闭环默认离线，模型失败可降级。' '0:55'
  Add-Box $s 70 248 120 34 $blue | Out-Null; Add-Text $s '真实 IMU' 70 255 120 20 12 $white $true $ppAlignCenter | Out-Null
  Add-Box $s 200 248 120 34 $green | Out-Null; Add-Text $s '本地规则' 200 255 120 20 12 $white $true $ppAlignCenter | Out-Null
  Add-Box $s 330 248 120 34 $orange | Out-Null; Add-Text $s '端侧 Qwen' 330 255 120 20 12 $white $true $ppAlignCenter | Out-Null
  Add-Box $s 70 316 12 105 $orange | Out-Null
  Add-Text $s '让坐姿问题从“事后发现”变成“发生时即可纠正”。' 100 320 440 100 25 $ink $true | Out-Null
  $s.Shapes.AddPicture($plant, $msoFalse, $msoTrue, 665, 215, 185, 278) | Out-Null
  Add-Note $s '55 秒：收束为真实传感器、确定性规则闭环、端侧 Qwen 表达。'

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
  if ($presentation) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
  if ($powerPoint) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}





