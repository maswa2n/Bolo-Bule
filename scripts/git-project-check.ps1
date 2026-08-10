# Quick sanity check before commit/push — run from any project root.
$folder = Split-Path -Leaf (Get-Location)
$remote = (git remote get-url origin 2>$null)

Write-Host ""
Write-Host "Project check: $folder" -ForegroundColor Cyan
Write-Host "  Folder : $(Get-Location)"
Write-Host "  Branch : $(git branch --show-current 2>$null)"
Write-Host "  Remote : $remote"

switch -Regex ($remote) {
  "github.com-maswa2n|maswa2n/Bolo-Bule" {
    Write-Host "  GitHub : maswa2n (Bolo Bule)" -ForegroundColor Green
  }
  "github.com-wawan|wawan2025-bmg/CMMS-Bus" {
    Write-Host "  GitHub : wawan2025-bmg (CMMS-Bus)" -ForegroundColor Green
  }
  default {
    Write-Host "  GitHub : unknown mapping — verify remote manually" -ForegroundColor Yellow
  }
}

$metaPath = ".cursor\mcp-project.meta.json"
if (Test-Path $metaPath) {
  $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
  Write-Host "  MCP    : $($meta.mcpServerKey) -> $($meta.projectRef)" -ForegroundColor Green
} elseif (Test-Path ".cursor\mcp.json") {
  $mcp = Get-Content ".cursor\mcp.json" -Raw
  if ($mcp -match "project_ref=([a-z0-9]+)") {
    Write-Host "  MCP    : Supabase $($Matches[1])" -ForegroundColor Green
  }
} else {
  Write-Host "  MCP    : no .cursor/mcp.json in this folder" -ForegroundColor Yellow
}

Write-Host "  Tip    : .\scripts\mcp-project-status.ps1 for full MCP switch check" -ForegroundColor Gray
Write-Host ""
