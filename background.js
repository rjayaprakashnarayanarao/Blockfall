const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const lines = [];
for (let i = 0; i < 15; i++) {
  lines.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    length: Math.random() * 200 + 100,
    speed: Math.random() * 0.5 + 0.2,
    color: `hsla(${Math.random() * 360}, 100%, 70%, 0.2)`
  });
}

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 30, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  lines.forEach(line => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x + line.length, line.y + line.length);
    ctx.stroke();

    line.x += line.speed;
    line.y += line.speed;

    if (line.x > canvas.width || line.y > canvas.height) {
      line.x = -line.length;
      line.y = Math.random() * canvas.height;
    }
  });

  requestAnimationFrame(animate);
}

animate();

// Responsive: resize canvas on window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}); 