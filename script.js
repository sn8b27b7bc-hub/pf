const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
let textCoordinates = []; // 글자 픽셀 좌표 저장소

// 마우스 설정
const mouse = { x: null, y: null, radius: 150 };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

// 텍스트의 픽셀 좌표를 추출하는 함수
function getTextCoordinates(text) {
    // 1. 텍스트를 그리기 위한 임시 캔버스 로직
    // 실제로는 현재 캔버스에 투명하게 그리고 데이터를 뽑아낸 뒤 지웁니다.
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width/2, canvas.height/2); 
    
    const textData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const coordinates = [];
    
    // 2. 픽셀 데이터 스캔 (알파값이 128 이상인 픽셀만 좌표로 저장)
    // 성능을 위해 gap을 두어 픽셀을 듬성듬성 가져옵니다.
    for (let y = 0; y < textData.height; y += 4) {
        for (let x = 0; x < textData.width; x += 4) {
            if (textData.data[(y * 4 * textData.width) + (x * 4) + 3] > 128) {
                coordinates.push({x: x, y: y});
            }
        }
    }
    // 캔버스 초기화 (데이터만 뽑고 그림은 지움)
    ctx.clearRect(0,0, canvas.width, canvas.height);
    return coordinates;
}

// 파티클 클래스
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 2;
        this.baseX = x; // 원래 위치 (혹은 타겟 위치)
        this.baseY = y;
        this.density = (Math.random() * 30) + 1; // 무게감
        this.vx = (Math.random() - 0.5) * 2; // 자유 이동 속도
        this.vy = (Math.random() - 0.5) * 2;
        this.isFormingText = false; // 현재 글자를 만들고 있는지 여부
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // 1. 마우스 회피 로직 (Physics)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            // 마우스가 가까우면 밀어냄
            this.x -= directionX * 5; 
            this.y -= directionY * 5;
        } else {
            // 2. 상태에 따른 이동 로직
            if (this.isFormingText) {
                // 글자 만들기: 타겟(baseX, baseY)으로 복귀
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx/10; // Ease in 효과
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy/10;
                }
            } else {
                // 찌르래기 모드: 자유 부유 (간단한 버전)
                this.x += this.vx;
                this.y += this.vy;

                // 화면 밖으로 나가면 반대편에서 등장
                if (this.x > canvas.width || this.x < 0) this.vx *= -1;
                if (this.y > canvas.height || this.y < 0) this.vy *= -1;
            }
        }
    }
    
    // 폭발 효과
    explode() {
        this.vx = (Math.random() - 0.5) * 50; // 속도 대폭 증가
        this.vy = (Math.random() - 0.5) * 50;
        this.isFormingText = false;
    }
}

// 초기화
function init() {
    particlesArray = [];
    // 1000개의 랜덤 파티클 생성
    for (let i = 0; i < 1000; i++){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

// 애니메이션 루프
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
        particlesArray[i].update();
    }
    requestAnimationFrame(animate);
}

init();
animate();

// --- 인터랙션 로직 ---

const titles = document.querySelectorAll('.project-title');
const container = document.getElementById('container');

titles.forEach(title => {
    // 1. 호버 시: 글자 모양으로 파티클 집결
    title.addEventListener('mouseenter', (e) => {
        let text = e.target.getAttribute('data-text');
        let coords = getTextCoordinates(text);
        
        // 파티클들에게 목표 좌표 할당
        for (let i = 0; i < particlesArray.length; i++) {
            if (coords[i]) {
                particlesArray[i].baseX = coords[i].x;
                particlesArray[i].baseY = coords[i].y;
                particlesArray[i].isFormingText = true;
            }
        }
    });

    // 2. 호버 아웃: 다시 자유 비행
    title.addEventListener('mouseleave', () => {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].isFormingText = false;
        }
    });

    // 3. 클릭 시: 폭발 및 화면 전환
    title.addEventListener('click', () => {
        // A. 폭발 효과
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].explode();
        }

        // B. 화면 전환 (약간의 지연 후)
        setTimeout(() => {
            container.classList.add('slide-out');
        }, 300); // 0.3초 딜레이 (유저가 폭발을 보는 시간)
    });
});
