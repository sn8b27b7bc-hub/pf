/**
 * Interactive Particle Portfolio Script
 * 1. Idle: 파티클이 자유롭게 부유하며 마우스를 피해 다님
 * 2. Hover: 파티클이 글자(픽셀) 위치로 모여들어 텍스트 형성 (이때는 마우스 회피 무시)
 * 3. Click: 파티클 폭발 후 화면 전환
 */

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
// 텍스트 해상도 설정 (숫자가 낮을수록 고해상도, 1~3 추천)
const resolutionGap = 2; 
// 파티클 연결 감도 (너무 높으면 느려짐)
const connectionDistance = 20; 

// 마우스 설정
const mouse = {
    x: null,
    y: null,
    radius: 120 // 마우스 회피 반경
};

// 마우스 움직임 감지
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

// 화면 크기 변경 대응
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init(); 
});

/**
 * 텍스트를 캔버스에 그려서 픽셀 좌표를 추출하는 함수
 * @param {string} text - 변환할 텍스트
 * @returns {Array} - {x, y} 좌표 객체 배열
 */
function getTextCoordinates(text) {
    // 1. 임시로 텍스트 그리기 (화면에는 안보임, 데이터만 추출용)
    ctx.fillStyle = 'white';
    // 폰트 크기가 클수록 파티클이 채울 공간이 많아져서 선명해짐
    ctx.font = 'bold 120px Verdana'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2); 
    
    // 2. 픽셀 데이터 가져오기
    const textData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const coordinates = [];
    
    // 3. 픽셀 스캔 (resolutionGap 만큼 건너뛰며 스캔)
    for (let y = 0; y < textData.height; y += resolutionGap) {
        for (let x = 0; x < textData.width; x += resolutionGap) {
            // 알파값(투명도)이 128 이상인 픽셀만 유효한 글자 영역으로 판단
            if (textData.data[(y * 4 * textData.width) + (x * 4) + 3] > 128) {
                coordinates.push({x: x, y: y});
            }
        }
    }
    
    // 캔버스 깨끗이 지우기 (데이터 뽑았으니 그림은 삭제)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return coordinates;
}

/**
 * 파티클 개별 객체
 */
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1; // 파티클 크기 랜덤 (1~3px)
        
        // 목표 위치 (글자 만들 때 사용)
        this.baseX = x; 
        this.baseY = y;
        
        // 물리 변수
        this.density = (Math.random() * 30) + 1; // 무게감 (마우스 반응 속도 차이)
        this.vx = (Math.random() - 0.5) * 2; // X축 이동 속도
        this.vy = (Math.random() - 0.5) * 2; // Y축 이동 속도
        
        // 상태 플래그
        this.isFormingText = false; 
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // --- CASE 1: 글자 만드는 모드 (마우스 무시) ---
        if (this.isFormingText) {
            // 목표 지점(baseX, baseY)까지 거리 계산
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            
            // Ease-out 애니메이션: 거리가 멀면 빠르고 가까우면 느리게
            // 10으로 나누는 값이 작을수록 더 빨리 붙음
            this.x += dx / 15; 
            this.y += dy / 15;
        } 
        
        // --- CASE 2: 평소 부유 모드 (마우스 회피 포함) ---
        else {
            // 마우스와의 거리 계산
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            
            // 마우스 회피 로직
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                this.x -= directionX * 3; // 밀려나는 힘
                this.y -= directionY * 3;
            } else {
                // 평소 움직임 (속도만큼 이동)
                this.x += this.vx;
                this.y += this.vy;

                // 화면 밖으로 나가면 반대편에서 튕겨나오기 (벽 튕기기)
                if (this.x > canvas.width || this.x < 0) this.vx *= -1;
                if (this.y > canvas.height || this.y < 0) this.vy *= -1;
            }
        }
    }

    // 클릭 시 폭발 효과
    explode() {
        this.isFormingText = false; // 글자 모드 해제
        // 속도를 랜덤하게 대폭 증가시켜 사방으로 퍼지게 함
        this.vx = (Math.random() - 0.5) * 50; 
        this.vy = (Math.random() - 0.5) * 50;
    }
}

/**
 * 초기화 함수
 */
function init() {
    particlesArray = [];
    // 파티클 개수 설정 (고해상도를 위해 넉넉하게 5000개 잡음)
    // 컴퓨터가 느려지면 이 숫자를 줄이세요 (예: 2000)
    const numberOfParticles = 5000; 
    
    for (let i = 0; i < numberOfParticles; i++){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

/**
 * 애니메이션 루프
 */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
        particlesArray[i].update();
    }
    requestAnimationFrame(animate);
}

// 실행
init();
animate();


// --------------------------------------------------------
// HTML 요소와 인터랙션 연결 (호버 및 클릭 이벤트)
// --------------------------------------------------------

const titles = document.querySelectorAll('.project-title'); // HTML의 텍스트들
const container = document.getElementById('container');     // 전체 컨테이너

titles.forEach(title => {
    
    // 1. 호버 진입: 글자 모양으로 파티클 집결
    title.addEventListener('mouseenter', (e) => {
        let text = e.target.getAttribute('data-text'); // HTML의 data-text 값 읽기
        let coords = getTextCoordinates(text);         // 픽셀 좌표 추출
        
        // 파티클들에게 임무 부여
        for (let i = 0; i < particlesArray.length; i++) {
            // 좌표 개수만큼만 파티클 할당
            if (i < coords.length) {
                particlesArray[i].baseX = coords[i].x;
                particlesArray[i].baseY = coords[i].y;
                particlesArray[i].isFormingText = true; // 글자 모드로 전환!
            } else {
                // 글자를 만들고 남은 잉여 파티클은 계속 배경에서 놈
                particlesArray[i].isFormingText = false;
            }
        }
    });

    // 2. 호버 해제: 다시 자유 비행
    title.addEventListener('mouseleave', () => {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].isFormingText = false; // 자유 모드로 전환
        }
    });

    // 3. 클릭: 폭발 및 페이지 전환
    title.addEventListener('click', () => {
        // 모든 파티클 폭발
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].explode();
        }

        // 0.3초 뒤에 화면 슬라이드 (폭발 감상 시간)
        setTimeout(() => {
            container.classList.add('slide-out');
            
            // (선택사항) 상세 페이지 내용을 클릭한 프로젝트에 맞게 변경하려면 여기에 로직 추가
            // console.log("Go to detail page for: " + title.innerText);
        }, 300); 
    });
});
