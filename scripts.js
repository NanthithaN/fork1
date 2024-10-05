const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const popup = document.getElementById('popup');
const canvas = document.getElementById('captured-photo');
const ctx = canvas.getContext('2d');
const stickerBtn = document.getElementById('stickers-btn');
const borderBtn = document.getElementById('borders-btn');
const overlay = document.getElementById('overlay');
const stickerPopup = document.getElementById('sticker-popup');
const borderPopup = document.getElementById('border-popup');
const removeBtn = document.getElementById('remove-btn');
const saveBtn = document.getElementById('save-btn');
const retakeBtn = document.getElementById('retake-btn'); 
let selectedSticker = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let stickerPosition = { x: 50, y: 50 }; 
let originalImageData; 

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        curtain.classList.add('open');
    }, 1000); 
});

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
}).catch(err => {
    console.error('Error accessing webcam:', err);
});

captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); 
    popup.style.display = 'block';
});

stickerBtn.addEventListener('click', () => {
    overlay.style.display = 'block';
    stickerPopup.style.display = 'block';
});

borderBtn.addEventListener('click', () => {
    overlay.style.display = 'block';
    borderPopup.style.display = 'block';
});

document.getElementById('close-sticker-popup').addEventListener('click', () => {
    overlay.style.display = 'none';
    stickerPopup.style.display = 'none';
});

document.getElementById('close-border-popup').addEventListener('click', () => {
    overlay.style.display = 'none';
    borderPopup.style.display = 'none';
});

const stickers = document.querySelectorAll('.sticker-option');
stickers.forEach(sticker => {
    sticker.addEventListener('click', () => {
        selectedSticker = sticker.src;
        stickerPosition = { x: 50, y: 50 }; 
        overlay.style.display = 'none';
        stickerPopup.style.display = 'none';
        drawSticker(); 
    });
});

function drawSticker() {
    if (selectedSticker) {
        const img = new Image();
        img.src = selectedSticker;
        img.onload = function () {
            ctx.drawImage(img, stickerPosition.x, stickerPosition.y, 50, 50); 
        };
    }
}

const borderOptions = document.querySelectorAll('.border-option');
borderOptions.forEach(borderOption => {
    borderOption.addEventListener('click', () => {
        const borderColor = borderOption.getAttribute('data-border');
        addBorderToPhoto(borderColor);
        overlay.style.display = 'none';
        borderPopup.style.display = 'none';
    });
});

function addBorderToPhoto(borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

removeBtn.addEventListener('click', () => {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(originalImageData, 0, 0); 
    selectedSticker = null; 
});


saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'captured_photo.png';
    link.click();
});

retakeBtn.addEventListener('click', () => {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selectedSticker = null; 
    popup.style.display = 'none'; 
});

canvas.addEventListener('mousedown', (event) => {
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    if (selectedSticker && isStickerClicked(mouseX, mouseY)) {
        isDragging = true;
        dragStartX = mouseX - stickerPosition.x;
        dragStartY = mouseY - stickerPosition.y;
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        stickerPosition.x = event.offsetX - dragStartX;
        stickerPosition.y = event.offsetY - dragStartY;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(originalImageData, 0, 0); 
        drawSticker(); 
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

function isStickerClicked(mouseX, mouseY) {
    return (
        mouseX >= stickerPosition.x &&
        mouseX <= stickerPosition.x + 50 &&
        mouseY >= stickerPosition.y &&
        mouseY <= stickerPosition.y + 50
    );
}
document.getElementById('sendButton').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'flex'; 
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none'; 
});

document.getElementById('submitEmail').addEventListener('click', async () => {
    const caption = document.getElementById('caption').value;  

    const canvas = document.getElementById('captured-photo');
    const imageData = canvas.toDataURL('image/png');  

    
    const sendEmailResponse = await fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customText: caption, imageData }), 
    });

    if (sendEmailResponse.ok) {
        alert('Email sent successfully!');
        document.getElementById('modal').style.display = 'none';  
    } else {
        alert('Error sending email');
    }
});