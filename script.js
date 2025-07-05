document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizContainer = document.getElementById('quiz-container');
    const quizQuestionEl = document.getElementById('quiz-question');
    const quizAnswerEl = document.getElementById('quiz-answer');
    const quizSubmitBtn = document.getElementById('quiz-submit');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const shurikenCountEl = document.getElementById('shuriken-count');
    const popupContainer = document.getElementById('popup-container');
    const bgm = document.getElementById('bgm');
    const hitSound = document.getElementById('hit-sound');
    const quizBGM = document.getElementById('quiz-bgm');

    // --- Game Resolution ---
    const logicalWidth = 800;
    const logicalHeight = 600;

    // --- State Variables ---
    let audioUnlocked = false;
    let currentQuestion = 0;
    let correctAnswers = 0;
    let num1, num2, operator;
    const totalQuestions = 10;
    let score = 0;
    let shurikenCount = 0;

    const target = { x: logicalWidth / 2, y: 80, radius: 30, dx: 5 };
    const launcher = { x: logicalWidth / 2, y: logicalHeight * 0.8, angle: 0 };
    const shurikens = [];
    const shurikenImage = new Image();
    shurikenImage.src = 'kunai_syuri.png';

    // --- Audio Unlock Logic ---
    function unlockAndLoadAudio() {
        if (audioUnlocked) return;
        // Attempt to play and pause all audio elements to unlock them
        const audioElements = [bgm, hitSound, quizBGM];
        audioElements.forEach(audio => {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
            }).catch(e => console.error("Audio unlock failed for", audio.id, ":", e));
        });
        audioUnlocked = true;
    }

    // --- Quiz Logic ---
    function generateQuestion() {
        const isAddition = Math.random() < 0.5;
        if (isAddition) {
            operator = '+';
            num1 = Math.floor(Math.random() * 11);
            num2 = Math.floor(Math.random() * (11 - num1));
            quizQuestionEl.textContent = `${num1} + ${num2} = ?`;
        } else {
            operator = '-';
            num1 = Math.floor(Math.random() * 11);
            num2 = Math.floor(Math.random() * (num1 + 1));
            quizQuestionEl.textContent = `${num1} - ${num2} = ?`;
        }
        quizAnswerEl.value = '';
        quizAnswerEl.focus();
        quizBGM.play().catch(e => console.error("Quiz BGM Playback Failed:", e));
    }

    function handleAnswer() {
        unlockAndLoadAudio(); // Unlock audio on the first answer attempt
        if (quizAnswerEl.value === '') return;
        const userAnswer = parseInt(quizAnswerEl.value, 10);
        let correctAnswer = (operator === '+') ? num1 + num2 : num1 - num2;
        if (userAnswer === correctAnswer) {
            correctAnswers++;
        }
        currentQuestion++;
        if (currentQuestion < totalQuestions) {
            generateQuestion();
        } else {
            endQuiz();
        }
    }

    function endQuiz() {
        quizContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        resizeCanvas(); // Call resizeCanvas after gameContainer is visible
        shurikenCount = correctAnswers;
        shurikenCountEl.textContent = shurikenCount;
        quizBGM.pause();
        quizBGM.currentTime = 0;
        bgm.play().catch(e => console.error("BGM Playback Failed in endQuiz:", e));
        gameLoop();
    }

    // --- Game Logic ---
    function drawSingleShuriken(x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const size = 40;
        ctx.drawImage(shurikenImage, -size / 2, -size / 2, size, size);
        ctx.restore();
    }

    function drawTarget() {
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function updateTarget() {
        target.x += target.dx;
        if (target.x + target.radius > logicalWidth || target.x - target.radius < 0) {
            target.dx *= -1;
        }
    }

    function drawShurikens() {
        shurikens.forEach(shuriken => drawSingleShuriken(shuriken.x, shuriken.y, shuriken.angle));
    }

    function drawLauncher() {
        ctx.globalAlpha = 0.5;
        drawSingleShuriken(launcher.x, launcher.y, launcher.angle);
        ctx.globalAlpha = 1.0;
        launcher.angle += 0.02;
    }

    function updateShurikens() {
        shurikens.forEach((shuriken, index) => {
            shuriken.y -= 7;
            shuriken.angle += 0.2;
            if (shuriken.y < -20) {
                shurikens.splice(index, 1);
            }
        });
    }

    function checkCollisions() {
        shurikens.forEach((shuriken, shurikenIndex) => {
            const distance = Math.sqrt(Math.pow(shuriken.x - target.x, 2) + Math.pow(shuriken.y - target.y, 2));
            if (distance < target.radius) {
                shurikens.splice(shurikenIndex, 1);
                score++;
                scoreEl.textContent = score;
                hitSound.currentTime = 0;
                hitSound.play().catch(e => console.error("Hit Sound Playback Failed in checkCollisions:", e));
                scoreEl.classList.add('score-pop');
                setTimeout(() => scoreEl.classList.remove('score-pop'), 200);
                popupContainer.classList.remove('hidden');
                popupContainer.classList.add('show');
                setTimeout(() => {
                    popupContainer.classList.remove('show');
                    setTimeout(() => popupContainer.classList.add('hidden'), 300);
                }, 800);
            }
        });
    }

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        drawTarget();
        updateTarget();
        drawLauncher();
        drawShurikens();
        updateShurikens();
        checkCollisions();
    }

    // --- Event Listeners ---
    quizSubmitBtn.addEventListener('click', handleAnswer);
    quizAnswerEl.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleAnswer();
    });

    canvas.addEventListener('click', () => {
        if (shurikenCount > 0) {
            shurikens.push({ x: launcher.x, y: launcher.y, angle: launcher.angle });
            shurikenCount--;
            shurikenCountEl.textContent = shurikenCount;
        }
    });

    // --- Canvas Resizing ---
    function resizeCanvas() {
        const gameContainerRect = gameContainer.getBoundingClientRect();
        canvas.width = gameContainerRect.width;
        canvas.height = gameContainerRect.height;

        const scaleX = canvas.width / logicalWidth;
        const scaleY = canvas.height / logicalHeight;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset current transform
        ctx.scale(scaleX, scaleY);
    }

    // --- Initialisation ---
    function init() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Ensure shuriken image is loaded before starting quiz/game
        shurikenImage.onload = () => {
            generateQuestion();
        };
        // If image is already loaded (e.g., from cache), call generateQuestion directly
        if (shurikenImage.complete) {
            generateQuestion();
        }
    }

    init();
});
