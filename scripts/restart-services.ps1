param(
    [string]$NodeRoot = "C:\nvm4w\nodejs",
    [switch]$SkipMiddleware
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

function Resolve-ExecutablePath {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [string]$Fallback
    )

    $resolved = Get-Command $Command -ErrorAction SilentlyContinue
    if ($resolved) {
        return $resolved.Source
    }

    if ($Fallback -and (Test-Path $Fallback)) {
        return $Fallback
    }

    throw "Unable to locate $Command. Add it to PATH or adjust the script parameters."
}

$npmPath = Resolve-ExecutablePath -Command 'npm' -Fallback (Join-Path $NodeRoot 'npm.cmd')
$nodeBin = Split-Path -Parent $npmPath
if (-not $nodeBin) {
    $nodeBin = $NodeRoot
}

if ($env:PATH -notmatch [regex]::Escape($nodeBin)) {
    $env:PATH = "$nodeBin;$($env:PATH)"
}

$middlewarePort = $null
if ($env:MIDDLEWARE_PORT) {
    [void][int]::TryParse($env:MIDDLEWARE_PORT, [ref]$middlewarePort)
}

$services = @(
    [pscustomobject]@{
        Name = 'backend'
        WorkingDirectory = Join-Path $projectRoot 'backend'
        Port = 3000
        Command = @('run', 'dev')
    },
    [pscustomobject]@{
        Name = 'frontend'
        WorkingDirectory = Join-Path $projectRoot 'frontend'
        Port = 5173
        Command = @('run', 'dev')
    },
    [pscustomobject]@{
        Name = 'middleware'
        WorkingDirectory = Join-Path $projectRoot 'middleware'
        Port = $middlewarePort
        Command = @('run', 'dev')
        Optional = $true
    }
)

if ($SkipMiddleware) {
    $services = $services | Where-Object { $_.Name -ne 'middleware' }
}

function Stop-ServiceProcesses {
    param([Parameter(Mandatory = $true)]$Service)

    if ($Service.Port) {
        $connections = Get-NetTCPConnection -State Listen -LocalPort $Service.Port -ErrorAction SilentlyContinue
        foreach ($connection in $connections) {
            $processId = $connection.OwningProcess
            if ($processId) {
                try {
                    Stop-Process -Id $processId -Force -ErrorAction Stop
                    Write-Host "Stopped $($Service.Name) listener on port $($Service.Port) (PID $processId)"
                } catch {
                    Write-Warning "Unable to stop PID $processId for $($Service.Name): $($_.Exception.Message)"
                }
            }
        }
    }

    if (Test-Path $Service.WorkingDirectory) {
        $fullPath = (Get-Item $Service.WorkingDirectory).FullName
        $pattern = [regex]::Escape($fullPath)
        $processes = Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='npm.exe' OR Name='cmd.exe'" |
            Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern }

        foreach ($process in $processes) {
            try {
                Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
                Write-Host "Stopped process $($process.ProcessId) tied to $($Service.Name)"
            } catch {
                Write-Warning "Unable to stop process $($process.ProcessId) for $($Service.Name): $($_.Exception.Message)"
            }
        }
    }
}

function Start-ServiceProcess {
    param([Parameter(Mandatory = $true)]$Service)

    if (-not (Test-Path $Service.WorkingDirectory)) {
        if ($Service.Optional) {
            Write-Warning "Skipping $($Service.Name); directory not found at $($Service.WorkingDirectory)."
            return
        }

        throw "Required directory missing for $($Service.Name): $($Service.WorkingDirectory)"
    }

    $startInfo = @{
        FilePath = $npmPath
        ArgumentList = $Service.Command
        WorkingDirectory = $Service.WorkingDirectory
        NoNewWindow = $false
        PassThru = $true
    }

    $process = Start-Process @startInfo
    Write-Host "Started $($Service.Name) (PID $($process.Id)) in $($Service.WorkingDirectory)"
}

foreach ($service in $services) {
    Write-Host "Restarting $($service.Name)..." -ForegroundColor Cyan
    Stop-ServiceProcesses -Service $service
    Start-ServiceProcess -Service $service
}
