param(
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

Write-Host "== adb devices =="
Invoke-Adb devices

$abi = (& $Adb shell getprop ro.product.cpu.abi).Trim()
$model = (& $Adb shell getprop ro.product.model).Trim()
$pageSize = (& $Adb shell getconf PAGE_SIZE).Trim()
$sdk = (& $Adb shell getprop ro.build.version.sdk).Trim()

Write-Host ""
Write-Host "== device =="
Write-Host "model=$model"
Write-Host "abi=$abi"
Write-Host "sdk=$sdk"
Write-Host "page_size=$pageSize"

if ($abi -notlike "arm64*") {
  Write-Warning "This device is not arm64. It can run the RN UI, but cannot validate the arm64 MNN/SME2 path."
  exit 2
}

Write-Host ""
Write-Host "Device ABI is suitable for MNN command-line validation."
Write-Host "To inspect SME2 capability while running MNN, use:"
Write-Host "  adb logcat | Select-String 'device supports|sme2|MNN'"
