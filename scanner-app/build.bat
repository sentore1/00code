@echo off
echo ================================
echo ShotCode Scanner - Build Script
echo ================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo + Node.js is installed

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo + npm is installed

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo X Failed to install dependencies
    pause
    exit /b 1
)

echo + Dependencies installed

REM Check if eas-cli is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Installing EAS CLI...
    call npm install -g eas-cli
    
    if %ERRORLEVEL% NEQ 0 (
        echo X Failed to install EAS CLI
        pause
        exit /b 1
    )
)

echo + EAS CLI is installed

REM Check if logged in
echo.
echo Checking EAS login status...
call eas whoami >nul 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo X Not logged in to EAS
    echo.
    echo Please login to your Expo account:
    call eas login
    
    if %ERRORLEVEL% NEQ 0 (
        echo X Login failed
        pause
        exit /b 1
    )
)

echo + Logged in to EAS

REM Ask which platform to build
echo.
echo Which platform do you want to build?
echo 1) Android (APK)
echo 2) iOS
echo 3) Both
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Building Android APK...
    echo This will take 10-20 minutes. Please wait...
    call eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo.
    echo Building iOS...
    echo This will take 10-20 minutes. Please wait...
    call eas build --platform ios --profile preview
) else if "%choice%"=="3" (
    echo.
    echo Building both platforms...
    echo This will take 20-40 minutes. Please wait...
    call eas build --platform all --profile preview
) else (
    echo X Invalid choice
    pause
    exit /b 1
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build completed successfully!
    echo.
    echo Download your app from the link above
    echo Transfer to your phone and install
) else (
    echo.
    echo X Build failed. Check the error messages above.
)

pause
