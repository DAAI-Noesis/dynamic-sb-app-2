## Set the preference to stop on the first error
$ErrorActionPreference = "Stop"

& $PSScriptRoot\loadenv.ps1

$venvPythonPath = "./.venv/scripts/python.exe"
if (Test-Path -Path "/usr") {
  # fallback to Linux venv path
  $venvPythonPath = "./.venv/bin/python"
}

Write-Host "Running manageacl.py. Arguments to script: $args"
#Start-Process -FilePath $venvPythonPath -ArgumentList "./scripts/manageacl.py --search-service $env:AZURE_SEARCH_SERVICE --index $env:AZURE_SEARCH_INDEX $args" -Wait -NoNewWindow
Start-Process -FilePath $venvPythonPath -ArgumentList "./scripts/manageacl.py --search-service $env:AZURE_SEARCH_SERVICE --index $env:AZURE_SEARCH_INDEX --index_t1 $env:AZURE_SEARCH_INDEX_T1 --index_t2 $env:AZURE_SEARCH_INDEX_T2 --index_t3 $env:AZURE_SEARCH_INDEX_T3  --index_t4 $env:AZURE_SEARCH_INDEX_T4  --index_t5 $env:AZURE_SEARCH_INDEX_T5  --index_t6 $env:AZURE_SEARCH_INDEX_T6 --index_t7 $env:AZURE_SEARCH_INDEX_T7 $args" -Wait -NoNewWindow
# Start-Process -FilePath $venvPythonPath -ArgumentList "./scripts/manageacl.py --search-service $env:AZURE_SEARCH_SERVICE --index $env:AZURE_SEARCH_INDEX --index_t1 $env:AZURE_SEARCH_INDEX_T1 --index_t2 $env:AZURE_SEARCH_INDEX_T2 $args" -Wait -NoNewWindow