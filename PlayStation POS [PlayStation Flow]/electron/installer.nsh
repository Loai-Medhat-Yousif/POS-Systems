!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PlayStation Flow" "$INSTDIR\PlayStation Flow.exe"
!macroend

!macro customUninstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PlayStation Flow"
!macroend
