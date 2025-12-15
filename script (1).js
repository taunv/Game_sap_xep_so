const UN_CONTAINER = document.getElementById('unsorted-container');
const SORTED_CONTAINER = document.getElementById('sorted-container');
const CHECK_BUTTON = document.getElementById('checkButton');
const FEEDBACK_AREA = document.getElementById('feedback-area');

let originalArray = [];     // Dãy số ban đầu
let currentSorted = [];     // Dãy số đang được sắp xếp (logic)
let sortedBlocks = [];      // Mảng lưu trữ các khối HTML đã được sắp xếp
let originalBlocks = new Map(); // Map lưu trữ mối liên hệ giữa ID và khối HTML ban đầu
let placeholderElements = []; // Mảng lưu trữ các khối placeholder trong SORTED_CONTAINER

// --- HÀM TẠO VÀ SẮP XẾP SỐ ---
function generateNumbers(size) {
    const numbers = new Set();
    while (numbers.size < size) {
        numbers.add(Math.floor(Math.random() * 99) + 1); 
    }
    return Array.from(numbers);
}

// --- HÀM KHỞI TẠO TRÒ CHƠI ---
function startGame() {
    const size = parseInt(document.getElementById('sizeSelect').value);
    
    // Reset Logic
    originalArray = generateNumbers(size);
    currentSorted = new Array(size).fill(null); 
    sortedBlocks = [];
    originalBlocks.clear();

    // Reset Giao diện
    UN_CONTAINER.innerHTML = '';
    SORTED_CONTAINER.innerHTML = '';
    FEEDBACK_AREA.innerHTML = '';
    FEEDBACK_AREA.className = '';
    CHECK_BUTTON.disabled = true;

    // 1. Tạo các khối số ngẫu nhiên
    originalArray.forEach((number, index) => {
        const id = `block-${index}`;
        const block = document.createElement('div');
        block.className = `number-block color-${index % 10}`;
        block.id = id;
        block.innerText = number;
        block.dataset.value = number;
        block.dataset.originalIndex = index;
        
        block.onclick = () => handleBlockClick(id);
        
        UN_CONTAINER.appendChild(block);
        originalBlocks.set(id, block); // Lưu khối HTML ban đầu
    });

    // 2. Tạo các placeholder (khối rỗng) trong khu vực sắp xếp
    placeholderElements = [];
    for (let i = 0; i < size; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'number-block placeholder';
        placeholder.dataset.index = i;
        placeholder.onclick = () => handlePlaceholderClick(i);
        SORTED_CONTAINER.appendChild(placeholder);
        placeholderElements.push(placeholder);
    }
}

// --- XỬ LÝ CLICK TRÊN KHỐI SỐ CHƯA SẮP XẾP ---
function handleBlockClick(id) {
    const block = originalBlocks.get(id);
    
    // Chỉ xử lý nếu khối chưa được sắp xếp
    if (block.classList.contains('hidden')) return;

    // 1. Tìm vị trí rỗng đầu tiên trong mảng logic
    const targetIndex = currentSorted.findIndex(val => val === null);
    
    if (targetIndex !== -1) {
        // 2. Cập nhật Logic
        currentSorted[targetIndex] = parseInt(block.dataset.value);
        
        // 3. Cập nhật Giao diện (Hiệu ứng Bay)
        moveBlock(block, placeholderElements[targetIndex]);
        
        // Ghi lại khối nào đang ở vị trí nào
        sortedBlocks[targetIndex] = block; 

        // Ẩn khối ban đầu và đánh dấu khối placeholder đã được điền
        block.classList.add('hidden');
        placeholderElements[targetIndex].classList.add('sorted');
        placeholderElements[targetIndex].onclick = null; // Vô hiệu hóa click trên placeholder đã đầy
        
        checkCompletion();
    }
}

// --- XỬ LÝ CLICK TRÊN KHỐI ĐÃ SẮP XẾP (Trả lại) ---
function handlePlaceholderClick(index) {
    // Chỉ xử lý nếu vị trí này đã được điền
    if (currentSorted[index] === null) return;
    
    // Khối đang ở vị trí đích
    const block = sortedBlocks[index];
    
    // Vị trí placeholder ban đầu
    const originalPlaceholder = placeholderElements[index];

    // 1. Cập nhật Logic
    currentSorted[index] = null;

    // 2. Cập nhật Giao diện (Hiệu ứng Bay ngược)
    moveBlock(block, originalPlaceholder);
    
    // Reset lại khối placeholder
    originalPlaceholder.classList.remove('sorted');
    originalPlaceholder.onclick = () => handlePlaceholderClick(index);

    // Hiện lại khối ban đầu
    block.classList.remove('hidden');
    sortedBlocks[index] = null;
    
    checkCompletion();
}


// --- HÀM TẠO HIỆU ỨNG BAY MƯỢT MÀ ---
function moveBlock(movingBlock, targetElement) {
    // 1. Tính toán vị trí hiện tại và vị trí đích
    const startRect = movingBlock.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const dx = targetRect.left - startRect.left;
    const dy = targetRect.top - startRect.top;
    
    // 2. Tách khối ra khỏi luồng DOM (cho phép di chuyển tự do)
    movingBlock.style.position = 'fixed';
    movingBlock.style.top = `${startRect.top}px`;
    movingBlock.style.left = `${startRect.left}px`;
    movingBlock.style.zIndex = '1000';
    movingBlock.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.3s';
    
    // 3. Áp dụng hiệu ứng bay
    setTimeout(() => {
        movingBlock.style.transform = `translate(${dx}px, ${dy}px) rotate(360deg)`;
        movingBlock.classList.add('sorted'); // Đánh dấu là đã sắp xếp (nếu bay vào)
    }, 10);
    
    // 4. Đưa khối về vị trí mới trong DOM sau khi animation kết thúc
    setTimeout(() => {
        // Reset style
        movingBlock.style.position = '';
        movingBlock.style.top = '';
        movingBlock.style.left = '';
        movingBlock.style.zIndex = '';
        movingBlock.style.transition = '';
        movingBlock.style.transform = '';
        movingBlock.classList.remove('sorted');

        // Nếu khối đang ở trạng thái 'hidden' (đã được sắp xếp), không cần làm gì nữa.
        // Ngược lại, nếu khối vừa 'bay về' thì nó sẽ tự hiện lại (nhờ remove 'hidden' class trong handler)
        
        checkCompletion();
    }, 850);
}


// --- KIỂM TRA TRẠNG THÁI HOÀN THÀNH ---
function checkCompletion() {
    const isCompleted = currentSorted.every(val => val !== null);
    CHECK_BUTTON.disabled = !isCompleted;
}


// --- KIỂM TRA KẾT QUẢ CUỐI CÙNG ---
function checkResult() {
    // Tạm thời vô hiệu hóa tất cả các tương tác
    UN_CONTAINER.querySelectorAll('.number-block').forEach(b => b.onclick = null);
    placeholderElements.forEach(p => p.onclick = null);
    CHECK_BUTTON.disabled = true;

    const order = document.getElementById('orderSelect').value; 
    
    // 1. Tính toán kết quả đúng
    const correctArray = [...originalArray].sort((a, b) => {
        return order === 'asc' ? a - b : b - a;
    });

    let isCorrect = true;
    let correctResultHTML = '';
    let playerResultHTML = '';

    // 2. So sánh và tạo minh họa
    placeholderElements.forEach((placeholder, index) => {
        const playerValue = currentSorted[index];
        const correctValue = correctArray[index];
        const isMatch = playerValue === correctValue;

        if (!isMatch) {
            isCorrect = false;
        }

        // Tạo khối cho kết quả đúng
        correctResultHTML += `<div class="number-block color-${correctValue % 10}">${correctValue}</div>`;

        // Tạo khối cho kết quả người chơi (Dùng khối đang ở vị trí đích)
        const block = sortedBlocks[index];

        if (block) {
            if (!isMatch) {
                // Đánh dấu khối sai trong giao diện
                block.classList.add('error-block'); 
            }
            playerResultHTML += block.outerHTML;
        } else {
             // Thêm placeholder vào trường hợp không tìm thấy khối (Chỉ xảy ra nếu có lỗi logic)
             playerResultHTML += `<div class="number-block color-9 placeholder">?</div>`;
        }
    });

    // 3. Hiển thị phản hồi
    if (isCorrect) {
        FEEDBACK_AREA.className = 'feedback-correct';
        FEEDBACK_AREA.innerHTML = `✅ XUẤT SẮC! Bé đã sắp xếp ĐÚNG thứ tự ${order === 'asc' ? 'TĂNG DẦN' : 'GIẢM DẦN'}!`;
    } else {
        FEEDBACK_AREA.className = 'feedback-wrong';
        FEEDBACK_AREA.innerHTML = `❌ RẤT TIẾC! Kết quả sắp xếp của bé có chỗ SAI. Vui lòng xem hình minh họa dưới đây:`;
    }
    
    // 4. Hiển thị minh họa kết quả đúng và sai
    const illustrationHTML = `
        <p style="font-size: 1.1em; color: green; margin-top: 15px;">✅ **KẾT QUẢ ĐÚNG**:</p>
        <div class="number-container sorted-illustration">${correctResultHTML}</div>
        <p style="font-size: 1.1em; color: red;">❌ **BÉ ĐÃ SẮP XẾP** (Vị trí SAI được đánh dấu đỏ):</p>
        <div class="number-container sorted-illustration">${playerResultHTML}</div>
    `;
    
    FEEDBACK_AREA.innerHTML += illustrationHTML;

    // Thêm nút CHƠI LẠI
    FEEDBACK_AREA.innerHTML += '<button onclick="location.reload()" style="margin-top: 20px;">CHƠI LẠI</button>';
}

// Khởi tạo lần đầu
window.onload = startGame;
