// ====== DOM 元素獲取 ======
const video = document.getElementById('cameraPreview');
const textInput = document.getElementById('textInput');
const scrollingText = document.getElementById('scrollingText');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontColorInput = document.getElementById('fontColor');
const scrollSpeedInput = document.getElementById('scrollSpeed');
const speedDisplay = document.getElementById('speedDisplay');
const estimatedTimeDisplay = document.getElementById('estimatedTime');
const textWrapper = document.getElementById('textWrapper');
const prompterContainer = document.getElementById('prompterContainer');

// 控制按鈕
const btnRotLeft = document.getElementById('btnRotLeft');
const btnRotRight = document.getElementById('btnRotRight');
const btnPortrait = document.getElementById('btnPortrait');
const btnRecord = document.getElementById('btnRecord');
const btnStop = document.getElementById('btnStop');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const countdownTimeInput = document.getElementById('countdownTime');
const downloadContainer = document.getElementById('downloadContainer');
const downloadLink = document.getElementById('downloadLink');

// ====== 相機與錄影全域變數 ======
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];

// 初始化相機
async function initCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        video.srcObject = mediaStream;
    } catch (err) {
        alert("無法啟動相機。請確認已授權權限並在 HTTPS 環境下運行。\n錯誤訊息: " + err);
    }
}
initCamera();

// ====== 提示詞參數設置 ======
let scrollSpeed = parseFloat(scrollSpeedInput.value); // 速度值
let scrollY = 0; // 當前滾動的 Y 軸位置
let animationFrameId = null;
let isScrolling = false;

// 更新文字內容
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value;
    calculateEstimatedTime();
});

// 調整文字大小
fontSizeInput.addEventListener('input', (e) => {
    const size = e.target.value;
    fontSizeDisplay.innerText = size;
    scrollingText.style.fontSize = size + 'px';
    calculateEstimatedTime();
});

// 調整文字顏色
fontColorInput.addEventListener('input', (e) => {
    scrollingText.style.color = e.target.value;
});

// 調整語速
scrollSpeedInput.addEventListener('input', (e) => {
    speedDisplay.innerText = e.target.value;
    scrollSpeed = parseFloat(e.target.value);
    calculateEstimatedTime();
});

// 旋轉控制 (左旋-90, 右旋90, Portrait 0)
let currentRotation = 0;
function applyRotation() {
    textWrapper.style.transform = `rotate(${currentRotation}deg)`;
    calculateEstimatedTime();
}

btnRotLeft.addEventListener('click', () => { currentRotation = -90; applyRotation(); });
btnRotRight.addEventListener('click', () => { currentRotation = 90; applyRotation(); });
btnPortrait.addEventListener('click', () => { currentRotation = 0; applyRotation(); });

// 計算預計時長
function calculateEstimatedTime() {
    // 如果文字為空
    if (!textInput.value.trim()) {
        estimatedTimeDisplay.innerText = "0.0 秒";
        return;
    }
    
    // 取得容器高度與文字高度
    const containerHeight = prompterContainer.clientHeight;
    // 為了獲取準確高度，我們短暫讓它渲染
    const textHeight = scrollingText.scrollHeight; 
    
    // 總移動距離 = 容器高度(準備出場) + 文字高度(完全離開)
    const totalDistance = containerHeight + textHeight;
    
    // 速度換算：scrollSpeed 滑桿值 (1~100)，假設每次 requestAnimationFrame (約60FPS) 移動的像素 = speed/20
    const pixelsPerFrame = scrollSpeed / 20; 
    const pixelsPerSecond = pixelsPerFrame * 60; // 每秒移動像素
    
    const estimatedSeconds = totalDistance / pixelsPerSecond;
    estimatedTimeDisplay.innerText = estimatedSeconds.toFixed(1) + " 秒";
}

// 監聽容器大小改變以更新時長
const resizeObserver = new ResizeObserver(() => calculateEstimatedTime());
resizeObserver.observe(prompterContainer);

// ====== 提示詞滾動邏輯 ======
function startScrolling() {
    const containerHeight = prompterContainer.clientHeight;
    scrollY = containerHeight; // 從容器最底部開始
    isScrolling = true;
    
    function scroll() {
        if (!isScrolling) return;
        
        const pixelsPerFrame = scrollSpeed / 20;
        scrollY -= pixelsPerFrame; // 向上移動
        scrollingText.style.top = scrollY + 'px';

        const textHeight = scrollingText.scrollHeight;
        // 如果文字還沒完全離開頂部，繼續滾動
        if (scrollY > -textHeight) {
            animationFrameId = requestAnimationFrame(scroll);
        } else {
            // 滾動結束，自動停止錄影
            stopRecording();
        }
    }
    scroll();
}

function stopScrolling() {
    isScrolling = false;
    cancelAnimationFrame(animationFrameId);
    scrollingText.style.top = '100%'; // 重置位置
}

// ====== 錄影與倒數計時邏輯 ======
btnRecord.addEventListener('click', () => {
    if (!mediaStream) return alert("相機未就緒");
    
    let countdown = parseInt(countdownTimeInput.value) || 3;
    countdownOverlay.style.display = 'flex';
    countdownNumber.innerText = countdown;

    const timer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownNumber.innerText = countdown;
        } else {
            clearInterval(timer);
            countdownOverlay.style.display = 'none';
            startRecording();
        }
    }, 1000);
});

btnStop.addEventListener('click', () => {
    stopRecording();
});

function startRecording() {
    recordedChunks = [];
    
    // iOS Safari 支援 video/mp4 或預設 (使用空字串讓瀏覽器自動選擇支援格式)
    try {
        mediaRecorder = new MediaRecorder(mediaStream);
    } catch (e) {
        alert('此設備不支援 MediaRecorder API');
        return;
    }

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadContainer.style.display = 'block';
    };

    mediaRecorder.start();
    
    // 切換按鈕狀態
    btnRecord.style.display = 'none';
    btnStop.style.display = 'block';
    downloadContainer.style.display = 'none';

    // 開始滾動提示詞
    startScrolling();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    stopScrolling();
    btnRecord.style.display = 'block';
    btnStop.style.display = 'none';
}

// ====== 拖拽 (Drag) 與 縮放 (Resize) 邏輯 (支援觸控與滑鼠) ======
const prompterWindow = document.getElementById('prompterWindow');
const dragHandle = document.getElementById('dragHandle');
const resizeHandle = document.getElementById('resizeHandle');

// 提取事件座標 (相容 Touch 與 Mouse)
function getEventClient(e) {
    if (e.touches && e.touches.length > 0) return e.touches[0];
    return e;
}

// --- 拖拽邏輯 ---
let isDragging = false;
let dragStartX, dragStartY;
let initialLeft, initialTop;

dragHandle.addEventListener('mousedown', dragStart);
dragHandle.addEventListener('touchstart', dragStart, { passive: false });

function dragStart(e) {
    e.preventDefault();
    isDragging = true;
    const client = getEventClient(e);
    dragStartX = client.clientX;
    dragStartY = client.clientY;
    initialLeft = prompterWindow.offsetLeft;
    initialTop = prompterWindow.offsetTop;

    document.addEventListener('mousemove', dragging);
    document.addEventListener('touchmove', dragging, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragging(e) {
    if (!isDragging) return;
    e.preventDefault();
    const client = getEventClient(e);
    const dx = client.clientX - dragStartX;
    const dy = client.clientY - dragStartY;
    
    prompterWindow.style.left = (initialLeft + dx) + 'px';
    prompterWindow.style.top = (initialTop + dy) + 'px';
}

function dragEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', dragging);
    document.removeEventListener('touchmove', dragging);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);
}

// --- 縮放邏輯 ---
let isResizing = false;
let resizeStartX, resizeStartY;
let initialWidth, initialHeight;

resizeHandle.addEventListener('mousedown', resizeStart);
resizeHandle.addEventListener('touchstart', resizeStart, { passive: false });

function resizeStart(e) {
    e.preventDefault();
    isResizing = true;
    const client = getEventClient(e);
    resizeStartX = client.clientX;
    resizeStartY = client.clientY;
    initialWidth = prompterWindow.offsetWidth;
    initialHeight = prompterWindow.offsetHeight;

    document.addEventListener('mousemove', resizing);
    document.addEventListener('touchmove', resizing, { passive: false });
    document.addEventListener('mouseup', resizeEnd);
    document.addEventListener('touchend', resizeEnd);
}

function resizing(e) {
    if (!isResizing) return;
    e.preventDefault();
    const client = getEventClient(e);
    const dx = client.clientX - resizeStartX;
    const dy = client.clientY - resizeStartY;
    
    // 設置最小寬高
    const newWidth = Math.max(200, initialWidth + dx);
    const newHeight = Math.max(200, initialHeight + dy);

    prompterWindow.style.width = newWidth + 'px';
    prompterWindow.style.height = newHeight + 'px';
}

function resizeEnd() {
    isResizing = false;
    document.removeEventListener('mousemove', resizing);
    document.removeEventListener('touchmove', resizing);
    document.removeEventListener('mouseup', resizeEnd);
    document.removeEventListener('touchend', resizeEnd);
}