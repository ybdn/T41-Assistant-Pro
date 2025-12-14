// T41 Asteroids - Easter Egg Game
// Classic Asteroids with pixel-art style and Delta Time physics

class AsteroidsGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 294;
        this.height = 432;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.animationFrame = null;
        this.lastTime = 0;

        // Player ship (speeds in units/second)
        this.ship = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 12,
            angle: -Math.PI / 2, // Pointing up
            rotation: 0,
            rotationSpeed: 300,     // degrees/second
            thrust: 300,            // pixels/second²
            maxSpeed: 250,          // pixels/second
            friction: 0.98,         // Per-second friction factor
            vx: 0,
            vy: 0,
            thrusting: false,
            invincible: false,
            invincibleTime: 0
        };

        // Game objects
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        this.stars = [];

        // Bullet settings (speeds in pixels/second)
        this.bulletSpeed = 400;
        this.bulletLifetime = 1.5; // seconds
        this.shootCooldown = 0.25; // seconds
        this.lastShot = 0;

        // Input
        this.keys = {};

        // High score
        this.highScore = parseInt(localStorage.getItem('t41AsteroidsHighScore') || '0');

        // Difficulty settings
        this.difficulty = 'normal';
        this.difficultySettings = {
            easy: {
                rotationSpeed: 350,
                thrust: 350,
                maxSpeed: 280,
                bulletSpeed: 450,
                asteroidSpeed: 40,
                startingAsteroids: 3
            },
            normal: {
                rotationSpeed: 300,
                thrust: 300,
                maxSpeed: 250,
                bulletSpeed: 400,
                asteroidSpeed: 60,
                startingAsteroids: 4
            },
            hard: {
                rotationSpeed: 250,
                thrust: 250,
                maxSpeed: 220,
                bulletSpeed: 350,
                asteroidSpeed: 80,
                startingAsteroids: 5
            }
        };

        this.init();
    }

    init() {
        this.createStars();
        this.createAsteroids(this.difficultySettings[this.difficulty].startingAsteroids);
        this.setupEventListeners();
        this.setupDifficultySelector();
        this.applyDifficulty('normal');
        this.updateHUD();
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }

    createAsteroids(count, x = null, y = null, size = 'large') {
        const sizes = {
            large: { radius: 35, speed: 1, points: 20 },
            medium: { radius: 20, speed: 1.5, points: 50 },
            small: { radius: 10, speed: 2, points: 100 }
        };

        const sizeConfig = sizes[size];
        const baseSpeed = this.difficultySettings[this.difficulty].asteroidSpeed;

        for (let i = 0; i < count; i++) {
            let ax, ay;

            if (x !== null && y !== null) {
                // Spawn from destroyed asteroid
                ax = x;
                ay = y;
            } else {
                // Spawn at edges, away from player
                const edge = Math.floor(Math.random() * 4);
                switch (edge) {
                    case 0: ax = 0; ay = Math.random() * this.height; break;
                    case 1: ax = this.width; ay = Math.random() * this.height; break;
                    case 2: ax = Math.random() * this.width; ay = 0; break;
                    case 3: ax = Math.random() * this.width; ay = this.height; break;
                }
            }

            const angle = Math.random() * Math.PI * 2;
            const speed = (baseSpeed + Math.random() * 30) * sizeConfig.speed;

            this.asteroids.push({
                x: ax,
                y: ay,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: sizeConfig.radius + Math.random() * 5,
                size: size,
                points: sizeConfig.points,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 180, // degrees/second
                vertices: this.generateAsteroidShape()
            });
        }
    }

    generateAsteroidShape() {
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const variance = 0.6 + Math.random() * 0.4;
            vertices.push({
                angle: angle,
                distance: variance
            });
        }
        return vertices;
    }

    setupEventListeners() {
        this.keyDownHandler = (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            if (e.key === 'Escape') {
                this.close();
            }
        };

        this.keyUpHandler = (e) => {
            this.keys[e.key] = false;
        };

        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
    }

    setupDifficultySelector() {
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.applyDifficulty(e.target.value);
                difficultySelect.blur();
            });

            difficultySelect.addEventListener('keydown', (e) => {
                if (e.key.startsWith('Arrow')) {
                    e.preventDefault();
                    difficultySelect.blur();
                }
            });
        }
    }

    applyDifficulty(difficulty) {
        this.difficulty = difficulty;
        const settings = this.difficultySettings[difficulty];

        this.ship.rotationSpeed = settings.rotationSpeed;
        this.ship.thrust = settings.thrust;
        this.ship.maxSpeed = settings.maxSpeed;
        this.bulletSpeed = settings.bulletSpeed;
    }

    shoot() {
        if (this.gameOver) return;

        const now = performance.now() / 1000;
        if (now - this.lastShot < this.shootCooldown) return;
        this.lastShot = now;

        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * this.ship.radius,
            y: this.ship.y + Math.sin(this.ship.angle) * this.ship.radius,
            vx: Math.cos(this.ship.angle) * this.bulletSpeed,
            vy: Math.sin(this.ship.angle) * this.bulletSpeed,
            lifetime: this.bulletLifetime
        });

        this.playSound('shoot');
    }

    update(dt) {
        if (this.gameOver || this.paused) return;

        // Handle input
        this.handleInput(dt);

        // Update ship
        this.updateShip(dt);

        // Update bullets
        this.updateBullets(dt);

        // Update asteroids
        this.updateAsteroids(dt);

        // Update particles
        this.updateParticles(dt);

        // Check collisions
        this.checkCollisions();

        // Check level complete
        if (this.asteroids.length === 0) {
            this.nextLevel();
        }

        // Update invincibility
        if (this.ship.invincible) {
            this.ship.invincibleTime -= dt;
            if (this.ship.invincibleTime <= 0) {
                this.ship.invincible = false;
            }
        }
    }

    handleInput(dt) {
        // Rotation
        if (this.keys['ArrowLeft']) {
            this.ship.angle -= (this.ship.rotationSpeed * Math.PI / 180) * dt;
        }
        if (this.keys['ArrowRight']) {
            this.ship.angle += (this.ship.rotationSpeed * Math.PI / 180) * dt;
        }

        // Thrust
        this.ship.thrusting = this.keys['ArrowUp'];

        // Shoot
        if (this.keys[' ']) {
            this.shoot();
        }
    }

    updateShip(dt) {
        // Apply thrust
        if (this.ship.thrusting) {
            this.ship.vx += Math.cos(this.ship.angle) * this.ship.thrust * dt;
            this.ship.vy += Math.sin(this.ship.angle) * this.ship.thrust * dt;

            // Create thrust particles
            if (Math.random() < 0.5) {
                this.createThrustParticle();
            }
        }

        // Apply friction (frame-rate independent)
        const frictionFactor = Math.pow(this.ship.friction, dt * 60);
        this.ship.vx *= frictionFactor;
        this.ship.vy *= frictionFactor;

        // Limit speed
        const speed = Math.sqrt(this.ship.vx ** 2 + this.ship.vy ** 2);
        if (speed > this.ship.maxSpeed) {
            this.ship.vx = (this.ship.vx / speed) * this.ship.maxSpeed;
            this.ship.vy = (this.ship.vy / speed) * this.ship.maxSpeed;
        }

        // Update position
        this.ship.x += this.ship.vx * dt;
        this.ship.y += this.ship.vy * dt;

        // Screen wrapping
        this.wrapPosition(this.ship);
    }

    updateBullets(dt) {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.lifetime -= dt;

            // Screen wrapping
            this.wrapPosition(bullet);

            return bullet.lifetime > 0;
        });
    }

    updateAsteroids(dt) {
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx * dt;
            asteroid.y += asteroid.vy * dt;
            asteroid.rotation += (asteroid.rotationSpeed * Math.PI / 180) * dt;

            // Screen wrapping
            this.wrapPosition(asteroid);
        });
    }

    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.lifetime -= dt;
            return p.lifetime > 0;
        });
    }

    wrapPosition(obj) {
        const margin = obj.radius || 5;
        if (obj.x < -margin) obj.x = this.width + margin;
        if (obj.x > this.width + margin) obj.x = -margin;
        if (obj.y < -margin) obj.y = this.height + margin;
        if (obj.y > this.height + margin) obj.y = -margin;
    }

    checkCollisions() {
        // Bullets vs Asteroids
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                const dist = Math.sqrt((bullet.x - asteroid.x) ** 2 + (bullet.y - asteroid.y) ** 2);

                if (dist < asteroid.radius) {
                    // Remove bullet
                    this.bullets.splice(i, 1);

                    // Split or destroy asteroid
                    this.destroyAsteroid(j);

                    this.playSound('explosion');
                    break;
                }
            }
        }

        // Ship vs Asteroids
        if (!this.ship.invincible) {
            for (let asteroid of this.asteroids) {
                const dist = Math.sqrt((this.ship.x - asteroid.x) ** 2 + (this.ship.y - asteroid.y) ** 2);

                if (dist < this.ship.radius + asteroid.radius - 5) {
                    this.shipHit();
                    break;
                }
            }
        }
    }

    destroyAsteroid(index) {
        const asteroid = this.asteroids[index];

        // Add score
        this.score += asteroid.points;
        this.updateHUD();

        // Create explosion particles
        this.createExplosion(asteroid.x, asteroid.y, asteroid.radius);

        // Split asteroid if not small
        if (asteroid.size === 'large') {
            this.createAsteroids(2, asteroid.x, asteroid.y, 'medium');
        } else if (asteroid.size === 'medium') {
            this.createAsteroids(2, asteroid.x, asteroid.y, 'small');
        }

        // Remove asteroid
        this.asteroids.splice(index, 1);
    }

    shipHit() {
        this.lives--;
        this.updateHUD();

        // Create explosion
        this.createExplosion(this.ship.x, this.ship.y, 20);
        this.playSound('hit');

        if (this.lives <= 0) {
            this.endGame();
        } else {
            // Reset ship position
            this.ship.x = this.width / 2;
            this.ship.y = this.height / 2;
            this.ship.vx = 0;
            this.ship.vy = 0;
            this.ship.angle = -Math.PI / 2;
            this.ship.invincible = true;
            this.ship.invincibleTime = 3; // 3 seconds of invincibility
        }
    }

    createExplosion(x, y, size) {
        const particleCount = Math.floor(size / 2);
        const colors = ['#ff3333', '#ff8800', '#ffff00', '#ffffff'];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3,
                lifetime: 0.5 + Math.random() * 0.5
            });
        }
    }

    createThrustParticle() {
        const backAngle = this.ship.angle + Math.PI;
        const spread = (Math.random() - 0.5) * 0.5;

        this.particles.push({
            x: this.ship.x + Math.cos(backAngle) * this.ship.radius,
            y: this.ship.y + Math.sin(backAngle) * this.ship.radius,
            vx: Math.cos(backAngle + spread) * 100 + this.ship.vx * 0.5,
            vy: Math.sin(backAngle + spread) * 100 + this.ship.vy * 0.5,
            color: Math.random() > 0.5 ? '#ff8800' : '#ffff00',
            size: 2 + Math.random() * 2,
            lifetime: 0.2 + Math.random() * 0.2
        });
    }

    nextLevel() {
        this.level++;
        this.score += 500 * this.level;

        const asteroidCount = this.difficultySettings[this.difficulty].startingAsteroids + this.level - 1;
        this.createAsteroids(Math.min(asteroidCount, 8));

        this.updateHUD();
        this.playSound('levelup');
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw stars
        this.drawStars();

        // Draw particles
        this.drawParticles();

        // Draw asteroids
        this.drawAsteroids();

        // Draw bullets
        this.drawBullets();

        // Draw ship
        if (!this.gameOver) {
            this.drawShip();
        }
    }

    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    drawShip() {
        // Blinking when invincible
        if (this.ship.invincible && Math.floor(this.ship.invincibleTime * 10) % 2 === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);

        // Ship body (triangle)
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -10);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 10);
        this.ctx.closePath();
        this.ctx.stroke();

        // Thrust flame
        if (this.ship.thrusting) {
            this.ctx.strokeStyle = '#ff8800';
            this.ctx.beginPath();
            this.ctx.moveTo(-5, -5);
            this.ctx.lineTo(-15 - Math.random() * 5, 0);
            this.ctx.lineTo(-5, 5);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawAsteroids() {
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;

        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);

            this.ctx.beginPath();
            asteroid.vertices.forEach((vertex, i) => {
                const x = Math.cos(vertex.angle) * asteroid.radius * vertex.distance;
                const y = Math.sin(vertex.angle) * asteroid.radius * vertex.distance;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawBullets() {
        this.ctx.fillStyle = '#00ff88';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            const alpha = p.lifetime / 0.5;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.min(1, alpha);
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
    }

    updateHUD() {
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('level-display').textContent = this.level;

        const livesDisplay = document.getElementById('lives-display');
        livesDisplay.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            livesDisplay.innerHTML += '🚀';
        }
    }

    endGame() {
        this.gameOver = true;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('t41AsteroidsHighScore', this.highScore.toString());
        }

        const gameOverScreen = document.getElementById('game-over-screen');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score-display').textContent = this.highScore;
        gameOverScreen.classList.add('active');
    }

    restart() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];

        // Reset ship
        this.ship.x = this.width / 2;
        this.ship.y = this.height / 2;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.ship.angle = -Math.PI / 2;
        this.ship.invincible = false;

        // Reapply difficulty
        this.applyDifficulty(this.difficulty);
        this.createAsteroids(this.difficultySettings[this.difficulty].startingAsteroids);
        this.updateHUD();

        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('active');
    }

    playSound(type) {
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

        let duration = 0.3; // Default duration

        switch (type) {
            case 'shoot':
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                duration = 0.1;
                break;
            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                duration = 0.3;
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                duration = 0.4;
                break;
            case 'levelup':
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(500, audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                duration = 0.4;
                break;
        }

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }

    gameLoop(currentTime) {
        // Calculate delta time in seconds, cap at 100ms to prevent huge jumps
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    close() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        const overlay = document.getElementById('game-overlay');
        overlay.classList.remove('active');
    }
}
