const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
// 파티클 개수 (성능에 따라 조절: 4000 ~ 6000 추천)
const numberOfParticles = 5000; 

// 마우스 설정 (반응 범위 약간 축소하여 더 예민하게)
const mouse = { x: null, y: null, radius: 80 };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

// 텍스트 좌표 추출 (수정됨: 확실한 인식을 위해 폰트 크기 강제)
function getTextCoordinates(text) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 확실한 초기화
    
    ctx.fillStyle = 'white';
    // 화면 너비의 15% 크기로 폰트 설정 (반응형 크기) -> 픽셀 확보 유리
    const fontSize = Math.floor(canvas.width * 0.15); 
    ctx.font = `900 ${fontSize}px Verdana`; // 굵은 폰트 사용
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2); 
    
    const textData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const coordinates = [];
    // 갭을 3으로 설정 (너무 촘촘하면 파티클 부족, 너무 넓으면 모양 안나옴)
    const gap = 3; 

    for (let y = 0; y < textData.height; y += gap) {
        for (let x = 0; x < textData.width; x += gap) {
            // 알파값 체크 (투명도 128 이상)
            if (textData.data[(y * 4 * textData.width) + (x * 4) + 3] > 128) {
                coordinates.push({x: x, y: y});
            }
        }
    }
    
    // 디버깅용: 콘솔에 좌표 잡혔는지 확인
    console.log(`텍스트 '${text}' 픽셀 개수: ${coordinates.length}`);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return coordinates;
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1;
        this.baseX = x;
        this.baseY = y;
        this.density = (Math.random() * 30) + 1;
        
        // [수정] 속도 대폭 증가 (눈 내리는 느낌 제거)
        this.vx = (Math.random() - 0.5) * 8; // 기존 2 -> 8 (4배 빠름)
        this.vy = (Math.random() - 0.5) * 8;
        
        this.isFormingText = false;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // 더 밝게
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // --- CASE 1: 글자 만드는 모드 ---
        if (this.isFormingText) {
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            
            // [수정] 강력한 자석 효과
            // 나누는 값이 작을수록 더 빠르게 붙음 (기존 15 -> 7)
            this.x += dx / 7; 
            this.y += dy / 7;
            
            // 미세한 떨림 효과 (글자가 살아있는 느낌)
            // 딱 멈추지 않고 제자리에서 웅성거림
            /* if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                this.x += (Math.random() - 0.5) * 1; 
                this.y += (Math.random() - 0.5) * 1;
            }
            */
        } 
        
        // --- CASE 2: 평소 찌르래기 모드 ---
        else {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            
            // 마우스 회피 (반발력)
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                
                // 마우스 근처에선 더 빠르게 튕겨나감
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                this.x -= directionX * 5; 
                this.y -= directionY * 5;
            } else {
                // 평소 움직임
                this.x += this.vx;
                this.y += this.vy;

                // [수정] 단순 벽 튕기기 + 약간의 랜덤성 (찌르래기 처럼)
                if (Math.random() < 0.02) { // 2% 확률로 방향 미세 변경
                     this.vx += (Math.random() - 0.5); 
                     this.vy += (Math.random() - 0.5);
                }

                // 속도 제한 (너무 빨라지면 진정시킴)
                if(this.vx > 5) this.vx = 5;
                if(this.vx < -5) this.vx = -5;
                if(this.vy > 5) this.vy = 5;
                if(this.vy < -5) this.vy = -5;

                // 화면 밖 처리 (튕기기)
                if (this.x > canvas.width || this.x < 0) this.vx *= -1;
                if (this.y > canvas.height || this.y < 0) this.vy *= -1;
            }
        }
    }

    explode() {
        this.isFormingText = false;
        // [수정] 폭발력 극대화
        this.vx = (Math.random() - 0.5) * 80; 
        this.vy = (Math.random() - 0.5) * 80;
    }
}

function init() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

function animate() {
    // 잔상 효과 제거를 위해 완전 투명화 (깔끔하게)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
        particlesArray[i].update();
    }
    requestAnimationFrame(animate);
}

init();
animate();

// --- 인터랙션 연결 ---
const titles = document.querySelectorAll('.project-title');
const container = document.getElementById('container');

titles.forEach(title => {
    title.addEventListener('mouseenter', (e) => {
        // [중요] 글자가 없는 경우 방지
        let text = e.target.getAttribute('data-text'); 
        if(!text) text = e.target.innerText;

        let coords = getTextCoordinates(text);
        
        // 파티클 재할당
        // 파티클 수보다 좌표가 더 많으면, 좌표를 랜덤하게 줄여서 구멍을 방지하거나
        // 혹은 앞부분부터 채움. 
        for (let i = 0; i < particlesArray.length; i++) {
            if (i < coords.length) {
                particlesArray[i].baseX = coords[i].x;
                particlesArray[i].baseY = coords[i].y;
                particlesArray[i].isFormingText = true;
            } else {
                particlesArray[i].isFormingText = false;
            }
        }
    });

    title.addEventListener('mouseleave', () => {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].isFormingText = false;
            // 흩어질 때 랜덤 속도 다시 부여 (자연스럽게 퍼지도록)
            particlesArray[i].vx = (Math.random() - 0.5) * 8;
            particlesArray[i].vy = (Math.random() - 0.5) * 8;
        }
    });

    title.addEventListener('click', () => {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].explode();
        }
        setTimeout(() => {
            container.classList.add('slide-out');
        }, 300);
    });
});
