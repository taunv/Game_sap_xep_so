const UN_CONTAINER = document.getElementById('unsorted-container');
const SORTED_CONTAINER = document.getElementById('sorted-container');
const CHECK_BUTTON = document.getElementById('checkButton');
const FEEDBACK_AREA = document.getElementById('feedback-area');

let originalArray = [];     // Dãy số ban đầu (logic)
let currentSorted = [];     // Dãy số đang được sắp xếp (logic, chứa giá trị)
let placeholderElements = []; // Mảng lưu trữ các placeholder trong SORTED_CONTAINER

// --- HÀM TẠO SỐ NGẪU NHIÊN ---
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

    // Reset Giao diện
    UN_CONTAINER.innerHTML = '';
    SORTED_CONTAINER.innerHTML = '';
    FEEDBACK_AREA.innerHTML = '';
    FEEDBACK_AREA.className = '';
    CHECK_BUTTON.disabled = true;

    // 1. Tạo các khối số ngẫu nhiên (chưa được sắp xếp)
    originalArray.forEach((number, index) => {
        const id = `block-un-${index}`;
        const block = document.createElement('div');
        block.className = `number-block color-${index % 10}`;
        block.id = id;
        block.innerText = number;
        block.dataset.value = number;
        block.dataset.state = 'unsorted'; // Trạng thái: unsorted, sorted
        
        block.onclick = () => handleBlockClick(block);
        
        UN_CONTAINER.appendChild(block);
    });

    // 2. Tạo các placeholder (khối rỗng) trong khu vực sắp xếp
    placeholderElements = [];
    for (let i = 0; i < size; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.dataset.index = i;
        
        placeholder.onclick = () => handlePlaceholderClick(placeholder);
        SORTED_CONTAINER.appendChild(placeholder);
        placeholderElements.push(placeholder);
    }
}

// --- XỬ LÝ CLICK TRÊN BẤT KỲ KHỐI SỐ NÀO ---
function handleBlockClick(block) {
    // Nếu khối đang ở khu vực chưa sắp xếp (UN_CONTAINER) -> Chuyển vào SORTED_CONTAINER
    if (block.dataset.state === 'unsorted') {
        // Tìm vị trí rỗng đầu tiên trong mảng logic
        const targetIndex = currentSorted.findIndex(val => val === null);
        
        if (targetIndex !== -1) {
            const targetPlaceholder = placeholderElements[targetIndex];
            
            // 1. Cập nhật Logic
            currentSorted[targetIndex] = parseInt(block.dataset.value);
            
            // 2. Cập nhật Trạng thái và DOM
            block.dataset.state = 'sorted';
            block.classList.remove('selected');
            block.onclick = null; // Vô hiệu hóa click trên khối gốc
            
            // 3. Hiệu ứng chuyển động (Chuyển khối vào placeholder)
            // Khối sẽ bay từ vị trí hiện tại đến vị trí placeholder
            moveElement(block, targetPlaceholder, true); 
            
            targetPlaceholder.classList.add('filled');
            checkCompletion();
        }
    }
}

// --- XỬ LÝ CLICK TRÊN KHỐI ĐÃ SẮP XẾP (Trả lại) ---
function handlePlaceholderClick(placeholder) {
    const index = parseInt(placeholder.dataset.index);
    const block = placeholder.querySelector('.number-block');
    
    // Chỉ xử lý nếu vị trí này đã được điền
    if (!block) return; 
    
    // 1. Cập nhật Logic
    currentSorted[index] = null;

    // 2. Cập nhật Trạng thái và DOM
    placeholder.classList.remove('filled');
    
    // 3. Hiệu ứng chuyển động (Chuyển khối từ placeholder về UN_CONTAINER)
    moveElement(block, UN_CONTAINER, false);
    
    checkCompletion();
}

// --- HÀM TẠO HIỆU ỨNG BAY MƯỢT MÀ (Khắc phục lỗi) ---
function moveElement(movingBlock, targetContainer, isSorting) {
    // 1. Tách khối ra khỏi DOM và đặt vào vị trí tuyệt đối ban đầu
    const rect = movingBlock.getBoundingClientRect();
    
    // Tạo bản sao để di chuyển (giữ lại khối gốc cho vị trí đích)
    const clone = movingBlock.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.zIndex = '1000';
    clone.style.transform = movingBlock.style.transform;
    clone.style.transition = 'none';

    document.body.appendChild(clone);
    movingBlock.style.opacity = '0'; // Ẩn khối gốc ngay lập tức

    // 2. Tính toán vị trí đích
    let targetRect;
    if (isSorting) {
        // Trường hợp bay vào placeholder
        targetRect = targetContainer.getBoundingClientRect();
        targetRect.left += (targetContainer.offsetWidth / 2) - (clone.offsetWidth / 2);
        targetRect.top += (targetContainer.offsetHeight / 2) - (clone.offsetHeight / 2);
        
        // Điều chỉnh cho phù hợp với vị trí tuyệt đối của placeholder trong SORTED_CONTAINER
        // Tọa độ của placeholder chính là tọa độ đích
        targetRect = targetContainer.getBoundingClientRect();

    } else {
        // Trường hợp bay về UN_CONTAINER (tìm vị trí của nó trong UN_CONTAINER)
        const originalIndex = Array.from(UN_CONTAINER.children).findIndex(el => el.id === movingBlock.id);
        targetRect = UN_CONTAINER.children[originalIndex].getBoundingClientRect();
    }
    
    const dx = targetRect.left - rect.left;
    const dy = targetRect.top - rect.top;

    // 3. Kích hoạt animation trên bản sao
    requestAnimationFrame(() => {
        clone.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.8s';
        clone.style.transform = `translate(${dx}px, ${dy}px) rotate(360deg)`;
        clone.classList.add('sorted');
    });

    // 4. Hoàn thành animation (chuyển khối gốc và dọn dẹp)
    setTimeout(() => {
        // Dọn dẹp bản sao
        clone.remove();
        
        // Hiện khối gốc ở vị trí mới
        movingBlock.style.opacity = '1';
        
        if (isSorting) {
            // Bay vào: Chuyển khối gốc vào bên trong Placeholder
            movingBlock.style.transition = 'none';
            movingBlock.classList.add('sorted');
            movingBlock.style.transform = 'none'; // Xóa transform 3D khi đã xếp
            targetContainer.appendChild(movingBlock);
            
            // Đặt lại sự kiện click cho khối (Giờ click vào khối nghĩa là trả nó về)
            movingBlock.onclick = () => handlePlaceholderClick(targetContainer);

        } else {
            // Bay về: Chuyển khối gốc về UN_CONTAINER
            movingBlock.dataset.state = 'unsorted';
            movingBlock.classList.remove('sorted');
            movingBlock.style.transform = ''; // Phục hồi transform 3D
            movingBlock.onclick = () => handleBlockClick(movingBlock);

            // Tìm vị trí ban đầu (dựa trên ID để chèn đúng thứ tự)
            const id = movingBlock.id;
            const originalIndex = parseInt(id.split('-')[2]);
            
            if (originalIndex < UN_CONTAINER.children.length) {
                 UN_CONTAINER.insertBefore(movingBlock, UN_CONTAINER.children[originalIndex]);
            } else {
                 UN_CONTAINER.appendChild(movingBlock);
            }
        }
        
    }, 850);
}


// --- KIỂM TRA TRẠNG THÁI HOÀN THÀNH ---
function checkCompletion() {
    const isCompleted = currentSorted.every(val => val !== null);
    CHECK_BUTTON.disabled = !isCompleted;
}


// --- KIỂM TRA KẾT QUẢ CUỐI CÙNG ---
function checkResult() {
    // Vô hiệu hóa tương tác
    SORTED_CONTAINER.querySelectorAll('.number-block').forEach(b => b.onclick = null);
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

        // Lấy khối số đã được sắp xếp trong placeholder
        const blockInPlaceholder = placeholder.querySelector('.number-block');

        if (blockInPlaceholder) {
            // Đánh dấu khối sai trong giao diện
            if (!isMatch) {
                blockInPlaceholder.classList.add('error-block'); 
            }
            playerResultHTML += blockInPlaceholder.outerHTML;
        } else {
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
