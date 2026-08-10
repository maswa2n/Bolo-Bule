# Supabase MCP status for the current workspace (Bolo Bule / CMMS-Bus safe).
# Run after Open Folder or before DB/RPC agent work.
#
# Usage:
#   .\scripts\mcp-project-status.ps1
#   .\scripts\mcp-project-status.ps1 -Strict   # exit 1 if project mcp.json mismatch

param(
    [switch]$Strict
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$MetaPath = Join-Path $RepoRoot '.cursor\mcp-project.meta.json'
$ProjectMcpPath = Join-Path $RepoRoot '.cursor\mcp.json'
$GlobalMcpPath = Join-Path $env:USERPROFILE '.cursor\mcp.json'
$McpBaseUrl = 'https://mcp.supabase.com/mcp'

function Get-QueryParamValue {
    param([string]$Url, [string]$Name)
    if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
    $pattern = "[?&]$([regex]::Escape($Name))=([^&]+)"
    if ($Url -match $pattern) { return [uri]::UnescapeDataString($matches[1]) }
    return $null
}

function Test-QueryFlag {
    param([string]$Url, [string]$Name)
    $value = Get-QueryParamValue -Url $Url -Name $Name
    return ($null -ne $value -and $value -notin @('', 'false', '0'))
}

function Read-McpJson {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return $null }
    return Get-Content $Path -Raw | ConvertFrom-Json
}

function Get-ServerEntry {
    param($McpConfig, [string]$ServerKey)
    if (-not $McpConfig -or -not $McpConfig.mcpServers) { return $null }
    return $McpConfig.mcpServers.$ServerKey
}

if (-not (Test-Path $MetaPath)) {
    Write-Host "Missing meta file: $MetaPath" -ForegroundColor Red
    exit 1
}

$meta = Get-Content $MetaPath -Raw | ConvertFrom-Json
$projectMcp = Read-McpJson -Path $ProjectMcpPath
$globalMcp = Read-McpJson -Path $GlobalMcpPath

$serverKey = [string]$meta.mcpServerKey
$expectedRef = [string]$meta.projectRef
$projectServer = Get-ServerEntry -McpConfig $projectMcp -ServerKey $serverKey
$projectUrl = [string]$projectServer.url
$projectRef = Get-QueryParamValue -Url $projectUrl -Name 'project_ref'
$projectReadOnly = Test-QueryFlag -Url $projectUrl -Name 'read_only'

$globalSupabase = Get-ServerEntry -McpConfig $globalMcp -ServerKey 'supabase'
$globalUrl = [string]$globalSupabase.url
$globalRef = Get-QueryParamValue -Url $globalUrl -Name 'project_ref'

$projectOk = ($projectRef -eq $expectedRef)
$hasProjectServer = ($null -ne $projectServer -and -not [string]::IsNullOrWhiteSpace($projectUrl))

Write-Host ''
Write-Host "MCP workspace: $($meta.workspaceLabel)" -ForegroundColor Cyan
Write-Host "  Folder           : $RepoRoot"
Write-Host "  Expected ref     : $expectedRef"
Write-Host "  MCP server key   : $serverKey"
Write-Host "  Project mcp.json : $ProjectMcpPath"
Write-Host ''

if ($hasProjectServer) {
    $color = if ($projectOk) { 'Green' } else { 'Red' }
    Write-Host 'Project MCP (USE THIS for agent DB work)' -ForegroundColor $color
    Write-Host "  url         : $projectUrl"
    Write-Host "  project_ref : $(if ($projectRef) { $projectRef } else { '(missing)' })"
    Write-Host "  read_only   : $projectReadOnly"
    Write-Host "  match       : $(if ($projectOk) { 'OK' } else { 'MISMATCH' })"
}
else {
    Write-Host "Project MCP server '$serverKey' not found in $ProjectMcpPath" -ForegroundColor Red
    $projectOk = $false
}

Write-Host ''
Write-Host 'Global MCP (CMMS dev/prod switch - ignore in this workspace)' -ForegroundColor DarkGray
if ($globalRef) {
    Write-Host "  ~/.cursor/mcp.json supabase ref : $globalRef"
}
else {
    Write-Host '  ~/.cursor/mcp.json supabase      : (not set)'
}

if ($meta.otherWorkspaces) {
    Write-Host ''
    Write-Host 'Other Cursor workspaces' -ForegroundColor Gray
    foreach ($other in $meta.otherWorkspaces) {
        Write-Host "  - $($other.label) -> $($other.folder) [$($other.mcpServerKey)]"
    }
}

Write-Host ''
Write-Host 'Switch checklist' -ForegroundColor Yellow
Write-Host '  1. File -> Open Folder -> this repo only'
Write-Host '  2. Ctrl+Shift+P -> Developer: Reload Window'
Write-Host '  3. Run this script again'
Write-Host '  4. In chat: MCP get_project_url on server' $serverKey

if ($meta.workspaceLabel -eq 'CMMS-Bus') {
    Write-Host ''
    Write-Host 'CMMS dev/prod:' -ForegroundColor Yellow
    Write-Host '  .\scripts\switch-mcp-supabase.ps1 -Target status'
    Write-Host '  .\scripts\switch-mcp-supabase.ps1 -Target dev'
    Write-Host '  .\scripts\switch-mcp-supabase.ps1 -Target prod'
}

Write-Host ''

if ($Strict -and -not $projectOk) {
    exit 1
}

if (-not $projectOk) {
    exit 1
}

exit 0
