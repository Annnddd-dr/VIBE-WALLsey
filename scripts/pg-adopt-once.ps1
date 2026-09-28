# One-off companion to pg-reset.ps1:
# 1. Resets the 'postgres' superuser password to the same known dev value.
# 2. Reassigns all objects in the 'posterraxx' database to role "user"
#    (older dev data was created as postgres; the app now connects as "user").
# Same trust-cycle safety as pg-reset.ps1: backup hba -> trust -> run -> restore.
$ErrorActionPreference = 'Stop'

$pgBin  = 'C:\Program Files\PostgreSQL\16\bin'
$pgData = 'C:\Program Files\PostgreSQL\16\data'
$hba    = Join-Path $pgData 'pg_hba.conf'
$hbaBak = Join-Path $pgData 'pg_hba.conf.adopt-bak'
$svc    = 'postgresql-x64-16'
$pass   = 'posterraxxdb2026'

try {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  $waits = 0
  while ((Get-Service -Name $svc).Status -ne 'Stopped' -and $waits -lt 30) { Start-Sleep 1; $waits++ }

  if (-not (Test-Path $hbaBak)) { Copy-Item $hba $hbaBak }
  $content = Get-Content $hba -Raw
  $content = $content -replace 'scram-sha-256', 'trust'
  Set-Content -Path $hba -Value $content -Encoding ASCII

  Start-Service -Name $svc
  $waits = 0
  do { Start-Sleep 1; $waits++; $up = & "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5432 2>&1 } while ($up -match 'no response' -and $waits -lt 30)

  $sql = @'
ALTER ROLE postgres WITH LOGIN PASSWORD '__PASS__';
REASSIGN OWNED BY postgres TO "user";
GRANT ALL ON SCHEMA public TO "user";
'@.Replace('__PASS__', $pass)
  $sqlFile = Join-Path $PSScriptRoot 'pg-adopt.sql'
  Set-Content -Path $sqlFile -Value $sql -Encoding UTF8
  & "$pgBin\psql.exe" -h 127.0.0.1 -U postgres -d posterraxx -v ON_ERROR_STOP=1 -f $sqlFile
  if ($LASTEXITCODE -ne 0) { throw 'psql adopt failed' }
  Write-Host 'postgres password set; ownership reassigned to "user".'

  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  $waits = 0
  while ((Get-Service -Name $svc).Status -ne 'Stopped' -and $waits -lt 30) { Start-Sleep 1; $waits++ }
  Copy-Item $hbaBak $hba -Force
  Start-Service -Name $svc
  Write-Host 'DONE.'
} catch {
  Write-Host ("ERROR: " + $_.Exception.Message)
  if (Test-Path $hbaBak) { Copy-Item $hbaBak $hba -Force }
  Start-Service -Name $svc -ErrorAction SilentlyContinue
  exit 1
}
