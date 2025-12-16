const UN_CONTAINER = document.getElementById('unsorted-container');
const SORTED_CONTAINER = document.getElementById('sorted-container');
const CHECK_BUTTON = document.getElementById('checkButton');
const FEEDBACK_AREA = document.getElementById('feedback-area');

// Biến toàn cục mới cho Đồng hồ Đếm ngược
let gameTimer;
let timeLeft;
const TIMER_DISPLAY = document.getElementById('time-left');

let originalArray = [];     
let currentSorted = [];     
let placeholderElements = []; 

// --- HÀM TẠO SỐ NGẪU NHIÊN ---
function generateNumbers(size) {
    const numbers = new Set();
    while (numbers.size < size) {
        numbers.add(Math.floor(Math.random() * 99) + 1); 
    }
    return Array.from(numbers);
}

// --- HÀM XÁC ĐỊNH THỜI GIAN THEO KÍCH CỠ/ĐỘ KHÓ ---
function getDuration(size) {
    // === ĐÂY LÀ PHẦN XÁC ĐỊNH THỜI GIAN THEO YÊU CẦU ===
    // Dễ (5 khối): 10s, Trung bình (8 khối): 15s, Khó (12 khối): 20s
    switch (size) {
        case 5: // Dễ
            return 15;
        case 8: // Trung bình
            return 20;
        case 12: // Khó
            return 25;
        default:
            // Nếu không đọc được size, dùng mặc định 15s
            console.warn(`[getDuration] Kích cỡ không xác định: ${size}. Sử dụng mặc định 15s.`);
            return 20; 
    }
}

// --- HÀM KHỞI TẠO ĐỒNG HỒ ĐẾM NGƯỢC ---
function startTimer(size) {
    // Xóa bộ đếm cũ nếu có
    if (gameTimer) {
        clearInterval(gameTimer);
    }

    // Lấy thời gian dựa trên kích cỡ (size)
    timeLeft = getDuration(size); 
    
    // Cập nhật hiển thị lần đầu với đơn vị và biểu tượng ở cuối
    TIMER_DISPLAY.innerHTML = `${timeLeft}s ⏳`; 
    TIMER_DISPLAY.style.color = '#cc0000'; // Đặt lại màu đỏ

    // Bắt đầu đếm ngược
    gameTimer = setInterval(() => {
        timeLeft--;
        
        // Cập nhật hiển thị mỗi giây
        TIMER_DISPLAY.innerHTML = `${timeLeft}s ⏳`; 
        
        // Đổi màu cảnh báo khi còn 3s
        if (timeLeft <= 3) {
            TIMER_DISPLAY.style.color = '#ff0000';
        }

        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            // Tự động kiểm tra kết quả khi hết giờ
            checkResult(true); 
        }
    }, 1000);
}

// --- HÀM KHỞI TẠO TRÒ CHƠI ---
function startGame() {
    // Đọc giá trị kích cỡ (size) từ HTML Select
    const size = parseInt(document.getElementById('sizeSelect').value);
    
    // Reset Logic
    originalArray = generateNumbers(size);
    currentSorted = new Array(size).fill(null); 

    // 1. Hiện lại Ô Chứa Dãy Số Ngẫu Nhiên và dọn dẹp
    UN_CONTAINER.classList.remove('hidden-container'); 
    UN_CONTAINER.innerHTML = '';

    // 2. Dọn dẹp Ô Chứa Kết Quả
    SORTED_CONTAINER.innerHTML = '';

    // 3. Dọn dẹp Khu vực Phản hồi
    FEEDBACK_AREA.innerHTML = '';
    FEEDBACK_AREA.className = '';
    
    // 4. Hiện lại nút "Xong" và đặt lại trạng thái
    CHECK_BUTTON.disabled = true;
    CHECK_BUTTON.style.display = 'inline-block'; 
    
    // 5. Tạo các khối số ngẫu nhiên
    originalArray.forEach((number, index) => {
        const id = `block-un-${index}`;
        const block = document.createElement('div');
        block.className = `number-block color-${index % 10}`;
        block.id = id;
        block.innerText = number;
        block.dataset.value = number;
        block.dataset.index = index; 
        block.dataset.state = 'unsorted'; 
        
        block.onclick = () => handleBlockClick(block);
        
        UN_CONTAINER.appendChild(block);
    });

    // 6. Tạo các placeholder (khối rỗng) trong khu vực sắp xếp
    placeholderElements = [];
    for (let i = 0; i < size; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.dataset.index = i;
        placeholder.dataset.state = 'empty';
        
        placeholder.onclick = () => handlePlaceholderClick(placeholder);
        SORTED_CONTAINER.appendChild(placeholder);
        placeholderElements.push(placeholder);
    }

    // 7. BẮT ĐẦU ĐỒNG HỒ ĐẾM NGƯỢC
    startTimer(size); 
}

// --- XỬ LÝ CLICK TRÊN KHỐI SỐ CHƯA SẮP XẾP (Giữ nguyên) ---
function handleBlockClick(block) {
    if (block.classList.contains('invisible-ghost')) return; 

    const targetIndex = currentSorted.findIndex(val => val === null);
    
    if (targetIndex !== -1) {
        const targetPlaceholder = placeholderElements[targetIndex];
        
        currentSorted[targetIndex] = parseInt(block.dataset.value);
        
        block.classList.add('invisible-ghost');
        block.onclick = null; 
        
        const movingBlock = block.cloneNode(true);
        movingBlock.id = `block-sorted-${block.dataset.index}`;
        movingBlock.classList.remove('invisible-ghost');
        movingBlock.dataset.state = 'sorted';
        movingBlock.onclick = null; 
        
        moveElement(movingBlock, targetPlaceholder, true, block);
        
        targetPlaceholder.dataset.state = 'filled';
        targetPlaceholder.onclick = () => handlePlaceholderClick(targetPlaceholder); 
        
        checkCompletion();
    }
}

// --- XỬ LÝ CLICK TRÊN KHỐI ĐÃ SẮP XẾP (Trả lại) (Giữ nguyên) ---
function handlePlaceholderClick(placeholder) {
    if (placeholder.dataset.state !== 'filled') return;
    
    const blockInPlaceholder = placeholder.querySelector('.number-block');
    if (!blockInPlaceholder) return;
    
    const originalIndex = parseInt(blockInPlaceholder.dataset.index);
    const originalBlock = UN_CONTAINER.querySelector(`#block-un-${originalIndex}`); 
    
    const index = parseInt(placeholder.dataset.index);
    currentSorted[index] = null;

    placeholder.dataset.state = 'empty';

    moveElement(blockInPlaceholder, originalBlock, false, originalBlock);

    placeholder.onclick = () => handlePlaceholderClick(placeholder); 
    
    checkCompletion();
}

/**
 * Hàm tạo hiệu ứng bay giữa hai container (Giữ nguyên)
 */
function moveElement(movingBlock, targetElement, isSorting, originalBlock) {
    const startRect = movingBlock.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    movingBlock.style.position = 'fixed';
    movingBlock.style.top = `${startRect.top}px`;
    movingBlock.style.left = `${startRect.left}px`;
    movingBlock.style.zIndex = '1000';
    movingBlock.style.transition = 'none';

    document.body.appendChild(movingBlock);

    const dx = targetRect.left - startRect.left;
    const dy = targetRect.top - startRect.top;

    requestAnimationFrame(() => {
        movingBlock.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.8s';
        movingBlock.style.transform = `translate(${dx}px, ${dy}px) rotate(${isSorting ? 360 : -360}deg)`;
        movingBlock.classList.add('sorted');
    });

    setTimeout(() => {
        if (isSorting) {
            targetElement.appendChild(movingBlock); 
            
            movingBlock.style.position = '';
            movingBlock.style.top = '';
            movingBlock.style.left = '';
            movingBlock.style.zIndex = '';
            movingBlock.style.transform = 'none'; 
            
            movingBlock.onclick = () => handlePlaceholderClick(targetElement); 

        } else {
            movingBlock.remove(); 
            
            originalBlock.classList.remove('invisible-ghost');
            originalBlock.onclick = () => handleBlockClick(originalBlock);
        }
        
    }, 850);
}


// --- KIỂM TRA TRẠNG THÁI HOÀN THÀNH (Giữ nguyên) ---
function checkCompletion() {
    const isCompleted = currentSorted.every(val => val !== null);
    CHECK_BUTTON.disabled = !isCompleted;
}

// --- KIỂM TRA KẾT QUẢ CUỐI CÙNG (Cập nhật để hiển thị đúng khi hết giờ) ---
function checkResult(timeExpired = false) {
    // Ngay lập tức xóa bộ đếm thời gian khi game kết thúc
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    // Đặt lại hiển thị đồng hồ (tránh hiển thị số giây khác 0)
    if (timeExpired) {
        TIMER_DISPLAY.innerHTML = '0s ⏳'; // Đã cập nhật định dạng
    }

    // ... (Giữ nguyên các logic kiểm tra và hiển thị kết quả khác) ...

    // Ẩn khu vực dãy số ngẫu nhiên
    UN_CONTAINER.classList.add('hidden-container');
    
    // Vô hiệu hóa tương tác
    SORTED_CONTAINER.querySelectorAll('.placeholder').forEach(p => p.onclick = null);
    CHECK_BUTTON.disabled = true;

    const order = document.getElementById('orderSelect').value; 
    
    // 1. Tính toán kết quả đúng
    const correctArray = [...originalArray].sort((a, b) => {
        return order === 'asc' ? a - b : b - a;
    });

    let isCorrect = true;
    let correctResultHTML = '';
    
    // 2. So sánh dãy của người chơi với dãy đúng để đánh dấu vị trí sai
    placeholderElements.forEach((placeholder, index) => {
        const playerValue = currentSorted[index];
        const correctValue = correctArray[index];
        const isMatch = playerValue === correctValue;

        if (!isMatch) {
            isCorrect = false;
        }

        const errorClass = isMatch ? '' : 'error-block'; 
        correctResultHTML += `<div class="number-block color-${correctValue % 10} ${errorClass}">${correctValue}</div>`;
        
        const blockInPlaceholder = placeholder.querySelector('.number-block');
        if (blockInPlaceholder) {
            blockInPlaceholder.classList.remove('error-block');
        }
    });

    // 3. Xử lý hiển thị phản hồi dựa trên kết quả và trạng thái hết giờ
    let finalMessage = '';

    if (timeExpired) {
        // Trường hợp hết giờ
        FEEDBACK_AREA.className = 'feedback-wrong';
        finalMessage += `<p style="font-size: 1.5em; margin: 10px 0;">⏰ HẾT GIỜ! ⏰</p>`;
        
        if (isCorrect) {
            finalMessage += `<p>Tuy hết giờ, nhưng bé đã sắp xếp ĐÚNG!</p>`;
        } else {
            finalMessage += `<p>Thời gian đã hết và kết quả sắp xếp của bé có chỗ SAI. Vui lòng xem kết quả đúng dưới đây:</p>`;
        }
    } else if (isCorrect) {
        // Trường hợp đúng 100%
        FEEDBACK_AREA.className = 'feedback-correct';
        finalMessage = `
            <p style="font-size: 1.5em; margin: 10px 0;">🎉 XUẤT SẮC! 🎉</p>
            <p>Bé đã sắp xếp ĐÚNG thứ tự ${order === 'asc' ? 'TĂNG DẦN' : 'GIẢM DẦN'}!</p>
        `;
    } else {
        // Trường hợp có lỗi sai (bấm nút)
        FEEDBACK_AREA.className = 'feedback-wrong';
        finalMessage = `
            <p style="font-size: 1.5em; margin: 10px 0;">❌ RẤT TIẾC!</p>
            <p>Kết quả sắp xếp của bé có chỗ SAI. Vui lòng xem kết quả đúng dưới đây:</p>
        `;
    }
    
    FEEDBACK_AREA.innerHTML = finalMessage;

    // 4. Chỉ hiển thị minh họa chi tiết khi có lỗi sai (hoặc hết giờ mà vẫn sai)
    if (!isCorrect) {
        const illustrationHTML = `
            <p style="font-size: 1.1em; color: red; margin-top: 15px;">❌ **KẾT QUẢ ĐÚNG** (Vị trí tô viền đỏ là vị trí bé đã xếp sai):</p>
            <div class="number-container sorted-illustration">${correctResultHTML}</div>
        `;
        
        FEEDBACK_AREA.innerHTML += illustrationHTML;
    }

    // Ẩn nút "Xong"
    CHECK_BUTTON.style.display = 'none';

    // Thêm nút CHƠI LẠI
    FEEDBACK_AREA.innerHTML += '<button onclick="location.reload()" style="margin-top: 20px;">CHƠI LẠI</button>';
}

// Khởi tạo lần đầu
window.onload = startGame;
