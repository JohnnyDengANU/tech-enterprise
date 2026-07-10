@echo off
chcp 65001 >nul
REM ==========================================================
REM 同济人工智能（苏州）研究院 — HLS 多码率转码脚本
REM 输入: assets/about-intro.mp4 (HEVC 1080p, 98MB)
REM 输出: assets/hls/ 目录下的 M3U8 + TS 分片
REM 依赖: FFmpeg (需在 PATH 中或修改下方路径)
REM ==========================================================

echo ============================================
echo   HLS 多码率转码脚本
echo   同济人工智能（苏州）研究院
echo ============================================
echo.

REM ===== 配置 =====
set "INPUT=assets\about-intro.mp4"
set "OUTPUT_DIR=assets\hls"
set "FFMPEG=ffmpeg"

REM 检查 FFmpeg 是否可用
where %FFMPEG% >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] FFmpeg 未找到！请先安装:
    echo   winget install FFmpeg
    echo 或从 https://ffmpeg.org/download.html 下载
    pause
    exit /b 1
)

REM 检查输入文件
if not exist "%INPUT%" (
    echo [错误] 输入文件不存在: %INPUT%
    pause
    exit /b 1
)

REM 创建输出目录
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if not exist "%OUTPUT_DIR%\v0" mkdir "%OUTPUT_DIR%\v0"
if not exist "%OUTPUT_DIR%\v1" mkdir "%OUTPUT_DIR%\v1"
if not exist "%OUTPUT_DIR%\v2" mkdir "%OUTPUT_DIR%\v2"
if not exist "%OUTPUT_DIR%\v3" mkdir "%OUTPUT_DIR%\v3"

echo [1/3] 开始多码率 HLS 转码...
echo   - 360p  (800 kbps)   - 3G/弱网
echo   - 480p  (1200 kbps)  - 4G/普通宽带
echo   - 720p  (2000 kbps)  - WiFi/良好宽带
echo   - 1080p (3000 kbps)  - 光纤/高速网络
echo.
echo 预计耗时: 10-30 分钟（取决于 CPU 性能）
echo.

REM ===== HLS 多码率转码 =====
%FFMPEG% -i "%INPUT%" ^
    -filter_complex "[0:v]split=4[v360][v480][v720][v1080]; ^
        [v360]scale=w=640:h=360[v360out]; ^
        [v480]scale=w=854:h=480[v480out]; ^
        [v720]scale=w=1280:h=720[v720out]; ^
        [v1080]scale=w=1920:h=1080[v1080out]" ^
    -map "[v360out]" -c:v:0 libx264 -profile:v:0 main -preset medium ^
        -b:v:0 800k -maxrate:v:0 856k -bufsize:v:0 1200k ^
    -map "[v480out]" -c:v:1 libx264 -profile:v:1 main -preset medium ^
        -b:v:1 1200k -maxrate:v:1 1284k -bufsize:v:1 1800k ^
    -map "[v720out]" -c:v:2 libx264 -profile:v:2 high -preset medium ^
        -b:v:2 2000k -maxrate:v:2 2140k -bufsize:v:2 3000k ^
    -map "[v1080out]" -c:v:3 libx264 -profile:v:3 high -preset medium ^
        -b:v:3 3000k -maxrate:v:3 3210k -bufsize:v:3 4500k ^
    -map a:0 -c:a:0 aac -b:a:0 96k -ar 44100 ^
    -map a:0 -c:a:1 aac -b:a:1 96k -ar 44100 ^
    -map a:0 -c:a:2 aac -b:a:2 128k -ar 44100 ^
    -map a:0 -c:a:3 aac -b:a:3 128k -ar 44100 ^
    -f hls ^
    -hls_time 10 ^
    -hls_playlist_type vod ^
    -hls_flags independent_segments ^
    -hls_segment_filename "%OUTPUT_DIR%\v%%v\seg_%%03d.ts" ^
    -master_pl_name master.m3u8 ^
    -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" ^
    "%OUTPUT_DIR%\v%%v\playlist.m3u8"

if %errorlevel% neq 0 (
    echo.
    echo [错误] 转码失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo [2/3] 生成视频封面图 (poster.jpg)...
%FFMPEG% -y -ss 3 -i "%INPUT%" -vframes 1 -q:v 2 -vf "scale=1280:-1" "%OUTPUT_DIR%\poster.jpg" 2>nul

if %errorlevel% neq 0 (
    echo [警告] 封面图生成失败，尝试从第 0 秒截取...
    %FFMPEG% -y -ss 0 -i "%INPUT%" -vframes 1 -q:v 2 -vf "scale=1280:-1" "%OUTPUT_DIR%\poster.jpg" 2>nul
)

echo.
echo [3/3] 转码完成！输出文件结构:
echo.
dir /s /b "%OUTPUT_DIR%\*.m3u8" 2>nul
echo.
echo ============================================
echo   转码成功！
echo ============================================
echo.
echo HLS 文件目录: %OUTPUT_DIR%\
echo 主播放列表:   %OUTPUT_DIR%\master.m3u8
echo 封面图:       %OUTPUT_DIR%\poster.jpg
echo.
echo 下一步:
echo   1. 将 hls/ 目录推送到 GitHub
echo   2. 更新 index.html 引入 hls.js
echo   3. 更新 script.js 使用 HLS 播放器
echo   4. (可选) 配置 Cloudflare CDN
echo.
pause
