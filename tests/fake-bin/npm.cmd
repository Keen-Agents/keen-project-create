@echo off
if not "%KPC_FAKE_NPM_LOG%"=="" (
    >>"%KPC_FAKE_NPM_LOG%" echo %CD%^|%*
)
echo [stubbed] npm %*
exit /b 0
