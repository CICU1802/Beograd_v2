@echo off
setlocal

cd /d "%~dp0class-status-web"

if not exist node_modules (
  echo [INFO] Dang cai dat dependencies cho class-status-web...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Cai dat dependencies that bai.
    pause
    exit /b 1
  )
)

echo [INFO] Khoi tao du lieu thoi khoa bieu moi nhat...
cd /d "%~dp0"
node generate_timetable_from_curriculum.js
if errorlevel 1 (
  echo [ERROR] Khong the tao du lieu thoi khoa bieu.
  pause
  exit /b 1
)

cd /d "%~dp0class-status-web"
start "Class Status Web" cmd /c "npm start"

timeout /t 2 /nobreak >nul
start "" "http://localhost:3200"

echo [INFO] Da mo web tinh trang lop hoc phan tai http://localhost:3200
exit /b 0
