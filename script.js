const videoElement = document.getElementById('input_video');
const controllerCanvas = document.getElementById('controller_canvas');
const controllerCtx = controllerCanvas.getContext('2d');
const galaxyCanvas = document.getElementById('galaxy_canvas');
const galaxyCtx = galaxyCanvas.getContext('2d');
const statusText = document.getElementById('status_text');

// --- CẤU HÌNH ---
const NUM_STARS = 10000; // Tăng lượng hạt để tăng mật độ nét vẽ
const W_GALAXY = 1000;
const H_GALAXY = 800;
const W_CONTROLLER = 640;
const H_CONTROLLER = 480;

let stars = [];
let targets = { MAP: [], FLAG: [], LIKE: [], DISLIKE: [] };
let currentShape = "HOME";

// --- HÀM TRÍCH XUẤT TỌA ĐỘ ẢNH ---
function getImageCoords(imgSrc, targetWidth, targetHeight, numPoints, shapeName, isMap = false) {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
        const tCanvas = document.createElement('canvas');
        const tCtx = tCanvas.getContext('2d');
        tCanvas.width = targetWidth;
        tCanvas.height = targetHeight;
        tCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const imgData = tCtx.getImageData(0, 0, targetWidth, targetHeight).data;
        let coords = [];
        const offsetX = Math.floor((W_GALAXY - targetWidth) / 2);
        const offsetY = Math.floor((H_GALAXY - targetHeight) / 2);
        const cx = W_GALAXY / 2;
        const cy = H_GALAXY / 2;

        // HIỆU CHỈNH: Giảm bước nhảy từ 3 xuống 1 để lấy toàn bộ pixel
        for (let y = 0; y < targetHeight; y += 1) {
            for (let x = 0; x < targetWidth; x += 1) {
                const alpha = imgData[(y * targetWidth + x) * 4 + 3];
                const r = imgData[(y * targetWidth + x) * 4];
                if (alpha > 128 && r < 128) {
                    coords.push({x: x + offsetX, y: y + offsetY});
                }
            }
        }

        let finalCoords = [];
        if (coords.length > 0) {
            if (isMap) {
                for (let i = 0; i < numPoints * 0.95; i++) {
                    const randPoint = coords[Math.floor(Math.random() * coords.length)];
                    finalCoords.push({x: randPoint.x, y: randPoint.y});
                }
                for (let i = 0; i < numPoints * 0.02; i++) {
                    const a = Math.random() * 2 * Math.PI;
                    const r = Math.random() * 15;
                    finalCoords.push({x: cx + 220 + r * Math.cos(a), y: cy - 100 + r * Math.sin(a)});
                }
                for (let i = 0; i < numPoints * 0.03; i++) {
                    const a = Math.random() * 2 * Math.PI;
                    const rx = Math.random() * 30;
                    const ry = Math.random() * 15;
                    finalCoords.push({
                        x: cx + 300 + (rx * Math.cos(a) * 0.8 - ry * Math.sin(a) * 0.6),
                        y: cy + 160 + (rx * Math.cos(a) * 0.6 + ry * Math.sin(a) * 0.8)
                    });
                }
            } else {
                for (let i = 0; i < numPoints; i++) {
                    const randPoint = coords[Math.floor(Math.random() * coords.length)];
                    finalCoords.push({x: randPoint.x, y: randPoint.y});
                }
            }
        }
        targets[shapeName] = finalCoords;
    };
}

getImageCoords('vietnam_map.png', 500, 700, NUM_STARS, 'MAP', true);
getImageCoords('covn.png', 700, 500, NUM_STARS, 'FLAG');
getImageCoords('like.png', 500, 500, NUM_STARS, 'LIKE');
getImageCoords('dislike.png', 500, 500, NUM_STARS, 'DISLIKE');

// --- ĐỐI TƯỢNG SAO ---
class Star {
    constructor() {
        this.home_x = Math.random() * W_GALAXY;
        this.home_y = Math.random() * H_GALAXY;
        this.x = this.home_x;
        this.y = this.home_y;
        this.tx = this.x;
        this.ty = this.y;
        this.size = Math.random() * 1.5 + 0.5;
    }
    update() {
        this.x += (this.tx - this.x) * 0.08;
        this.y += (this.ty - this.y) * 0.08;
    }
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < NUM_STARS; i++) stars.push(new Star());

// --- VÒNG LẶP RENDER GALAXY ---
function renderGalaxy() {
    galaxyCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    galaxyCtx.fillRect(0, 0, W_GALAXY, H_GALAXY);
    const cx = W_GALAXY / 2;
    const cy = H_GALAXY / 2;

    stars.forEach((s, i) => {
        // HIỆU CHỈNH: Gom chung logic xử lý hình ảnh và thêm độ nhiễu (jitter offset)
        let targetList = targets[currentShape];
        if (["LIKE", "DISLIKE", "MAP", "FLAG"].includes(currentShape) && targetList && targetList.length > 0) {
            let target = targetList[i % targetList.length];
            s.tx = target.x + (Math.random() - 0.5) * 4; // Tỏa ra xung quanh tọa độ gốc 4px
            s.ty = target.y + (Math.random() - 0.5) * 4;
        } 
        else if (currentShape === "STAR") {
            let a = (i / NUM_STARS) * 2 * Math.PI;
            let r = 280 * (Math.pow(Math.sin(a * 2.5), 2) + 0.4);
            s.tx = cx + r * Math.cos(a);
            s.ty = cy + r * Math.sin(a);
        } else if (currentShape === "HEART") {
            let a = (i / NUM_STARS) * 2 * Math.PI;
            let x = 16 * Math.pow(Math.sin(a), 3);
            let y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
            s.tx = cx + x * 15;
            s.ty = cy + y * 15;
        } else if (currentShape === "DONUT") {
            let a = (i / NUM_STARS) * 2 * Math.PI;
            let r = 180 + (Math.random() * 40 - 20);
            s.tx = cx + r * Math.cos(a);
            s.ty = cy + r * Math.sin(a);
        } else {
            s.tx = s.home_x;
            s.ty = s.home_y;
        }
        s.update();
        s.draw(galaxyCtx);
    });
    requestAnimationFrame(renderGalaxy);
}
renderGalaxy();

// --- AI & CAMERA LOGIC ---
const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`});

hands.setOptions({
    maxNumHands: 1, 
    modelComplexity: 1, // Giữ mức 1 để độ phân giải AI tốt hơn trong điều kiện thiếu sáng
    minDetectionConfidence: 0.5, 
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    controllerCtx.clearRect(0, 0, W_CONTROLLER, H_CONTROLLER);
    
    // HIỆU CHỈNH: Loại bỏ ctx.scale(-1, 1). Chỉ sử dụng thuộc tính transform lật CSS.
    controllerCtx.drawImage(results.image, 0, 0, W_CONTROLLER, H_CONTROLLER);

    let f_count = 0;
    currentShape = "HOME";

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        window.drawConnectors(controllerCtx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        window.drawLandmarks(controllerCtx, landmarks, {color: '#FF0000', lineWidth: 1});

        const lms = landmarks.map(l => ({x: l.x * W_CONTROLLER, y: l.y * H_CONTROLLER}));
        
        const dx4 = lms[4].x - lms[17].x;
        const dy4 = lms[4].y - lms[17].y;
        const dist4 = Math.sqrt(dx4 * dx4 + dy4 * dy4);

        const dx2 = lms[2].x - lms[17].x;
        const dy2 = lms[2].y - lms[17].y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        const thumb_open = dist4 > dist2; 
        
        const tip_ids = [8, 12, 16, 20];
        let fingers = tip_ids.map(id => lms[id].y < lms[id - 2].y ? 1 : 0);
        
        f_count = (thumb_open ? 1 : 0) + fingers.reduce((a, b) => a + b, 0);

        if (f_count === 1 && thumb_open) {
            currentShape = lms[4].y < lms[3].y ? "LIKE" : "DISLIKE";
        } else if (f_count === 1) { currentShape = "DONUT"; }
        else if (f_count === 2) { currentShape = "STAR"; }
        else if (f_count === 3) { currentShape = "HEART"; }
        else if (f_count === 4) { currentShape = "FLAG"; }
        else if (f_count === 5) { currentShape = "MAP"; }
    }
    
    statusText.innerText = `Fingers: ${f_count}`;
});

const camera = new window.Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: W_CONTROLLER, height: H_CONTROLLER
});
camera.start().then(() => {
    statusText.innerText = "Fingers: 0";
});