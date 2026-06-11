param(
  [Parameter(Mandatory = $true)]
  [string]$ModelDir,

  [string]$MnnBuildDir = "D:\Projects\MNN\project\android\build_64_win",
  [string]$RemoteRoot = "/data/local/tmp",
  [string]$RemoteModelName = "",
  [string]$Prompt = "Please remind me to sit upright in one short sentence.",
  [string]$Adb = "adb"
)

$ErrorActionPreference = "Stop"

function Invoke-Adb {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & $Adb @Args
  if ($LASTEXITCODE -ne 0) {
    throw "adb command failed: $Adb $($Args -join ' ')"
  }
}

function Require-File {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Required file not found: $Path"
  }
}

function Require-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "Required directory not found: $Path"
  }
}

Require-Dir $ModelDir
Require-Dir $MnnBuildDir

$llmDemo = Join-Path $MnnBuildDir "llm_demo"
$llmBench = Join-Path $MnnBuildDir "llm_bench"
$libMnn = Join-Path $MnnBuildDir "libMNN.so"
$config = Join-Path $ModelDir "config.json"

Require-File $llmDemo
Require-File $llmBench
Require-File $libMnn
Require-File $config

$abi = (& $Adb shell getprop ro.product.cpu.abi).Trim()
if ($abi -notlike "arm64*") {
  throw "Connected device ABI is '$abi'. Use an arm64 Android device for MNN/SME2 validation."
}

if ([string]::IsNullOrWhiteSpace($RemoteModelName)) {
  $RemoteModelName = Split-Path -Leaf (Resolve-Path -LiteralPath $ModelDir)
}

$remoteModelDir = "$RemoteRoot/mnn_models/$RemoteModelName"
$remotePrompt = "$RemoteRoot/prompt.txt"

Write-Host "== push MNN runtime =="
Invoke-Adb push $llmDemo "$RemoteRoot/llm_demo"
Invoke-Adb push $llmBench "$RemoteRoot/llm_bench"
Invoke-Adb push $libMnn "$RemoteRoot/libMNN.so"

Write-Host "== push model =="
Invoke-Adb shell mkdir -p "$RemoteRoot/mnn_models"
Invoke-Adb push $ModelDir "$RemoteRoot/mnn_models/"

Write-Host "== prepare prompt =="
$tempPrompt = New-TemporaryFile
try {
  Set-Content -LiteralPath $tempPrompt -Value $Prompt -Encoding UTF8
  Invoke-Adb push $tempPrompt $remotePrompt
} finally {
  Remove-Item -LiteralPath $tempPrompt -Force -ErrorAction SilentlyContinue
}

Write-Host "== run llm_demo =="
Invoke-Adb shell chmod +x "$RemoteRoot/llm_demo" "$RemoteRoot/llm_bench"
Invoke-Adb shell "cd $RemoteRoot && export LD_LIBRARY_PATH=${RemoteRoot}:`$LD_LIBRARY_PATH && ./llm_demo $remoteModelDir/config.json $remotePrompt"

Write-Host ""
Write-Host "Optional benchmark:"
Write-Host "  adb shell cd $RemoteRoot '&&' export LD_LIBRARY_PATH=${RemoteRoot}:`$LD_LIBRARY_PATH '&&' ./llm_bench $remoteModelDir/config.json"
