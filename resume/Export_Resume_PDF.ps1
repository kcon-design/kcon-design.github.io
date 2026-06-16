$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$html = Join-Path $root 'resume\Kevin_Connolly_Resume_2026_Google_Style.html'
$pdf = Join-Path $root 'resume\Kevin_Connolly_Resume_2026_Google_Style.pdf'
$publicPdf = Join-Path $root 'public\Kevin_Connolly_Resume.pdf'

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$browser = if (Test-Path $edge) { $edge } elseif (Test-Path $chrome) { $chrome } else { throw 'Could not find Edge or Chrome.' }

if (Test-Path $pdf) { Remove-Item $pdf -Force }
$fileUri = 'file:///' + ($html -replace '\\','/')
& $browser --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdf" $fileUri
Start-Sleep -Seconds 1
if (!(Test-Path $pdf)) { throw 'PDF export failed.' }
Copy-Item $pdf $publicPdf -Force
Write-Host "Created: $pdf"
Write-Host "Updated site resume: $publicPdf"
