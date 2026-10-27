# Windows PowerShell 5.1 compatible. Installs Node only inside this project.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$project = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $project '.runtime'
$runtimeDirectory = Join-Path $runtimeRoot 'node'
$portableNode = Join-Path $runtimeDirectory 'node.exe'

function Test-NodeVersion {
    param([string]$Executable)
    try {
        if (-not (Test-Path -LiteralPath $Executable -PathType Leaf)) { return $false }
        $version = & $Executable --version 2>$null
        return ($LASTEXITCODE -eq 0 -and $version -match '^v(\d+)\.' -and [int]$Matches[1] -ge 24)
    } catch {
        return $false
    }
}

function Save-Download {
    param([string]$Uri, [string]$Destination)
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Destination -TimeoutSec 300
            return
        } catch {
            if ($attempt -eq 3) { throw }
            Write-Host 'A letoltes megszakadt, ujraprobalom...'
            Start-Sleep -Seconds 2
        }
    }
}

function Get-NodeExecutable {
    if (Test-NodeVersion $portableNode) { return $portableNode }
    $existing = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existing -and (Test-NodeVersion $existing.Source)) { return $existing.Source }

    $architecture = $env:PROCESSOR_ARCHITEW6432
    if (-not $architecture) { $architecture = $env:PROCESSOR_ARCHITECTURE }
    switch ($architecture) {
        'AMD64' { $nodeArchitecture = 'x64' }
        'ARM64' { $nodeArchitecture = 'arm64' }
        default { throw 'Ehhez a valtozathoz 64 bites Windows 10/11 szukseges (x64 vagy ARM64).' }
    }

    Write-Host 'Node.js 24 letoltese a hivatalos nodejs.org oldalrol...'
    Write-Host 'Ez csak az elso inditaskor szukseges, nehany percig tarthat.'
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $null = New-Item -ItemType Directory -Path $runtimeRoot -Force
    $temporary = Join-Path $runtimeRoot ('setup-' + [guid]::NewGuid().ToString('N'))
    $null = New-Item -ItemType Directory -Path $temporary
    try {
        $checksums = Join-Path $temporary 'SHASUMS256.txt'
        Save-Download 'https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt' $checksums
        $pattern = '^([a-fA-F0-9]{64})\s+(node-(v24\.\d+\.\d+)-win-' + $nodeArchitecture + '\.zip)$'
        $entry = Get-Content -LiteralPath $checksums | Where-Object { $_ -match $pattern } | Select-Object -First 1
        if (-not $entry -or $entry -notmatch $pattern) {
            throw 'Nem talalhato a megfelelo Node.js csomag a hivatalos kiadasban.'
        }
        $expectedHash = $Matches[1]
        $fileName = $Matches[2]
        $version = $Matches[3]
        $archive = Join-Path $temporary $fileName
        Save-Download ("https://nodejs.org/dist/$version/$fileName") $archive
        Write-Host 'Letoltes ellenorzese es kicsomagolas...'
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expectedHash) {
            throw 'A letoltes ellenorzoosszege hibas. Inditsd ujra az INDITAS.cmd fajlt.'
        }
        $expanded = Join-Path $temporary 'extracted'
        Expand-Archive -LiteralPath $archive -DestinationPath $expanded
        $folder = Join-Path $expanded ([IO.Path]::GetFileNameWithoutExtension($fileName))
        if (-not (Test-NodeVersion (Join-Path $folder 'node.exe'))) {
            throw 'A letoltott Node.js nem indult el. Ellenorizd, hogy 64 bites Windows 10/11-et hasznalsz.'
        }
        if (Test-Path -LiteralPath $runtimeDirectory) {
            Remove-Item -LiteralPath $runtimeDirectory -Recurse -Force
        }
        Move-Item -LiteralPath $folder -Destination $runtimeDirectory
        Write-Host 'Node.js kesz. A jatek sajat mappajaba kerult, rendszergazdai jog nem kellett.'
        return $portableNode
    } finally {
        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    Set-Location -LiteralPath $project
    Write-Host ''
    Write-Host 'KJK Online - Kiralynok Utvesztoje'
    Write-Host 'Automatikus elokeszites es inditas...'
    $node = Get-NodeExecutable
    # Only this process and its children receive the Node directory in PATH.
    $env:Path = (Split-Path -Parent $node) + [IO.Path]::PathSeparator + $env:Path
    if (-not (Test-Path -LiteralPath (Join-Path $project 'dist/index.html'))) {
        Write-Host 'A kesz oldal hianyzik. Fuggosegek telepitese es a weboldal elkeszitese...'
        $npm = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $npm) { throw 'Az npm hianyzik. Csomagold ki ujra a teljes ZIP-et, amely a kesz dist mappat is tartalmazza.' }
        & $npm.Source ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'A fuggosegek telepitese nem sikerult. Ellenorizd az internetkapcsolatot.' }
        & $npm.Source run build
        if ($LASTEXITCODE -ne 0) { throw 'Az oldal elkeszitese nem sikerult. A reszletes hiba fent olvashato.' }
    }
    & $node (Join-Path $PSScriptRoot 'serve-local.mjs')
    exit $LASTEXITCODE
} catch {
    Write-Host ''
    Write-Host ('Hiba: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Az elso Node-letolteshez internet es irhato jatekmappa szukseges (peldaul az Asztalon).'
    exit 1
}
