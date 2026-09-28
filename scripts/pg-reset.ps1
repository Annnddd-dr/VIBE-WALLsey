# Resets the local PostgreSQL 16 'user' role password to a known value so the app can connect.
# Temporarily switches pg_hba.conf to 'trust', sets the password, then restores 'scram-sha-256'.
$ErrorActionPreference = 'Stop'

$dir = 'D:\Downloads\webstie builds\posterraxx-nextjs\posterraxx\scripts'
$log = Join-Path $dir 'pg-reset.log'
$sqlFile = Join-Path $dir 'pg-reset.sql'
function Log($m) { $ts = Get-Date -Format 'HH:mm:ss'; "$ts  $m" | Out-File -FilePath $log -Append; Write-Host $m }

$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
$pgData = 'C:\Program Files\PostgreSQL\16\data'
$hba = Join-Path $pgData 'pg_hba.conf'
$hbaBak = Join-Path $pgData 'pg_hba.conf.reset-bak'
$svc = 'postgresql-x64-16'
$newPass = 'posterraxxdb2026'

Set-Content -Path $log -Value ''
Log '=== Starting PG password reset ==='

try {
  # 1. Stop service
  Log 'Stopping PostgreSQL service...'
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  $waits = 0
  while ((Get-Service -Name $svc).Status -ne 'Stopped' -and $waits -lt 30) { Start-Sleep 1; $waits++ }
  Log ("Service status: " + (Get-Service -Name $svc).Status)
  if ((Get-Service -Name $svc).Status -ne 'Stopped') { throw 'Could not stop service.' }

  # 2. Backup hba
  if (-not (Test-Path $hbaBak)) { Copy-Item $hba $hbaBak; Log 'Backed up pg_hba.conf' }

  # 3. Switch to trust for local connections
  $content = Get-Content $hba -Raw
  $content = $content -replace 'scram-sha-256', 'trust'
  Set-Content -Path $hba -Value $content -Encoding ASCII
  Log 'pg_hba.conf switched to trust'

  # 4. Start service
  Log 'Starting PostgreSQL service...'
  Start-Service -Name $svc
  $waits = 0
  do {
    Start-Sleep 1; $waits++
    $up = & "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5432 2>&1
  } while ($up -match 'no response' -and $waits -lt 30)
  Log ("pg_isready: " + $up)

  # 5. SQL: create-or-update role and ensure database
  $sql = @'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'user') THEN
    CREATE ROLE "user" WITH LOGIN PASSWORD '__PASS__';
  ELSE
    ALTER ROLE "user" WITH LOGIN PASSWORD '__PASS__';
  END IF;
END $$;
SELECT 'CREATE DATABASE posterraxx OWNER "user"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'posterraxx')\gexec
'@.Replace('__PASS__', $newPass)
  Set-Content -Path $sqlFile -Value $sql -Encoding UTF8
  & "$pgBin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -f $sqlFile
  if ($LASTEXITCODE -ne 0) { throw 'psql role/db setup failed' }
  Log 'Role user + database posterraxx ensured.'

  # 6. Stop, restore hba, start
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  $waits = 0
  while ((Get-Service -Name $svc).Status -ne 'Stopped' -and $waits -lt 30) { Start-Sleep 1; $waits++ }
  Copy-Item $hbaBak $hba -Force
  Log 'pg_hba.conf restored to scram-sha-256'
  Start-Service -Name $svc
  Log 'Service restarted with secure auth. DONE.'
} catch {
  Log ("ERROR: " + $_.Exception.Message)
  if (Test-Path $hbaBak) { Copy-Item $hbaBak $hba -Force; Log 'Restored hba on error' }
  Start-Service -Name $svc -ErrorAction SilentlyContinue
  exit 1
}