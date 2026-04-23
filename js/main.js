/* ═══════════════════════════════════════════════════════
   SPARKPAGES — ОПИСАТЕЛНА СТАТИСТИКА
   main.js — All interactive logic & Chart.js charts
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── Utilities ─────────────────────────────────────── */
function parseNumbers(str) {
  return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr) {
  const freq = {};
  arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const max = Math.max(...Object.values(freq));
  const modes = Object.keys(freq).filter(k => freq[k] === max).map(Number);
  return modes.length === arr.length ? ['N/A'] : modes;
}

function variance(arr, sample = true) {
  const m = mean(arr);
  const sq = arr.map(v => (v - m) ** 2);
  return sq.reduce((a, b) => a + b, 0) / (arr.length - (sample ? 1 : 0));
}

function stdDev(arr, sample = true) {
  return Math.sqrt(variance(arr, sample));
}

function quartile(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function round2(n) { return Math.round(n * 100) / 100; }

/* ─── Navbar scroll effect ──────────────────────────── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

/* ─── Mobile nav ────────────────────────────────────── */
const navBurger = document.getElementById('navBurger');
const navLinks  = document.querySelector('.nav-links');
navBurger.addEventListener('click', () => {
  navLinks.classList.toggle('mobile-open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('mobile-open'));
});

/* ─── Hero Particles ────────────────────────────────── */
(function spawnParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  const colors = ['#60a5fa','#a78bfa','#f472b6','#34d399','#fbbf24'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*10+6}s;
      animation-delay:${Math.random()*8}s;
    `;
    container.appendChild(p);
  }
})();

/* ─── Scroll Reveal ─────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.intro-card, .content-grid, .comparison-box, .calculator-box, ' +
  '.acc-item, .skew-card, .kurt-card, .shape-explorer, .cs-card, ' +
  '.normal-intro-box, .summary-table-wrap, .dispersion-visual-intro'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => revealObserver.observe(el));

/* ─── Tabs (Centralна тенденция) ────────────────────── */
document.querySelectorAll('#tabs-tendency .tab-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#tabs-tendency .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('tab-' + this.dataset.tab).classList.add('active');
  });
});

/* ─── Accordion ─────────────────────────────────────── */
document.querySelectorAll('.acc-header').forEach(header => {
  header.addEventListener('click', function () {
    const id  = this.dataset.acc;
    const body = document.getElementById('acc-' + id);
    const arrow = this.querySelector('.acc-arrow');
    const isOpen = body.classList.contains('open');

    document.querySelectorAll('.acc-body.open').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.acc-arrow.open').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.acc-header.active').forEach(h => h.classList.remove('active'));

    if (!isOpen) {
      body.classList.add('open');
      arrow.classList.add('open');
      this.classList.add('active');
    }
  });
});

/* ════════════════════════════════════════════════════════
   CHARTS
════════════════════════════════════════════════════════ */
const COLORS = {
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  pink:   '#ec4899',
  green:  '#22c55e',
  orange: '#f97316',
  gold:   '#f59e0b',
  red:    '#ef4444',
};

const fontFamily = "'Inter', sans-serif";

// Shared Chart.js defaults
Chart.defaults.font.family = fontFamily;
Chart.defaults.color = '#6b7280';

/* ── Helper: normal distribution PDF ─────────────────── */
function normalPDF(x, mu = 0, sigma = 1) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
         Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

function linspace(start, end, n) {
  const arr = [];
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(start + i * step);
  return arr;
}

/* ── 1. Mean Chart ────────────────────────────────────── */
(function buildMeanChart() {
  const ctx = document.getElementById('meanChart');
  if (!ctx) return;
  const data = [5, 12, 6, 4, 30, 7, 5, 8]; // outlier at 30
  const avg  = mean(data);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((_, i) => `x${i+1}`),
      datasets: [{
        label: 'Стойности',
        data,
        backgroundColor: data.map(v => v === 30 ? 'rgba(239,68,68,.7)' : 'rgba(59,130,246,.7)'),
        borderColor:     data.map(v => v === 30 ? '#ef4444' : COLORS.blue),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: { annotations: {} },
        tooltip: { callbacks: {
          afterBody: () => [`Средна стойност: ${round2(avg)}`]
        }}
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,.06)' }, beginAtZero: true }
      }
    },
    plugins: [{
      afterDraw(chart) {
        const { ctx: c, chartArea: ca, scales: { y } } = chart;
        const yPos = y.getPixelForValue(avg);
        c.save();
        c.strokeStyle = '#ef4444';
        c.lineWidth = 2.5;
        c.setLineDash([6, 4]);
        c.beginPath();
        c.moveTo(ca.left, yPos);
        c.lineTo(ca.right, yPos);
        c.stroke();
        c.fillStyle = '#ef4444';
        c.font = 'bold 12px Inter';
        c.fillText(`x̄ = ${round2(avg)}`, ca.right - 60, yPos - 6);
        c.restore();
      }
    }]
  });
})();

/* ── 2. Mode Chart ────────────────────────────────────── */
(function buildModeChart() {
  const ctx = document.getElementById('modeChart');
  if (!ctx) return;
  const raw  = [2, 4, 4, 6, 8, 4, 10, 6, 4];
  const freq = {};
  raw.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const labels = Object.keys(freq).map(Number).sort((a,b)=>a-b);
  const counts = labels.map(l => freq[l]);
  const modeVal = labels[counts.indexOf(Math.max(...counts))];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(String),
      datasets: [{
        label: 'Честота',
        data: counts,
        backgroundColor: labels.map(l => l === modeVal ? 'rgba(139,92,246,.85)' : 'rgba(59,130,246,.5)'),
        borderColor:     labels.map(l => l === modeVal ? COLORS.purple : COLORS.blue),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,.06)' }, ticks: { stepSize: 1 }, beginAtZero: true }
      }
    }
  });
})();

/* ── 3. Dispersion Comparison Chart ─────────────────── */
(function buildDispCompChart() {
  const ctx = document.getElementById('dispCompChart');
  if (!ctx) return;
  const xs = linspace(0, 10, 80);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => round2(x)),
      datasets: [
        {
          label: 'Малко разсейване (σ=0.8)',
          data: xs.map(x => normalPDF(x, 5, 0.8)),
          borderColor: COLORS.blue,
          backgroundColor: 'rgba(59,130,246,.12)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Голямо разсейване (σ=2)',
          data: xs.map(x => normalPDF(x, 5, 2)),
          borderColor: COLORS.pink,
          backgroundColor: 'rgba(236,72,153,.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(0,0,0,.06)' } }
      }
    }
  });
})();

/* ── 4. Variance Chart ──────────────────────────────── */
(function buildVarianceChart() {
  const ctx = document.getElementById('varianceChart');
  if (!ctx) return;
  const data = [2, 5, 4, 8, 3, 6];
  const m    = mean(data);
  const labels = data.map((_, i) => `x${i+1}`);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Стойности',
          data,
          backgroundColor: 'rgba(59,130,246,.65)',
          borderColor: COLORS.blue,
          borderWidth: 2,
          borderRadius: 5,
        },
        {
          label: 'Отклонение (xᵢ - x̄)²',
          data: data.map(v => round2((v - m) ** 2)),
          backgroundColor: 'rgba(236,72,153,.5)',
          borderColor: COLORS.pink,
          borderWidth: 2,
          borderRadius: 5,
          type: 'bar',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { grid: { color: 'rgba(0,0,0,.06)' } } }
    }
  });
})();

/* ── 5. Standard Deviation (Normal Bell) Chart ─────── */
(function buildStdChart() {
  const ctx = document.getElementById('stdChart');
  if (!ctx) return;
  const xs = linspace(-4, 4, 200);
  const ys = xs.map(x => normalPDF(x));

  // Fill zones via gradient - use multiple datasets
  const zone1  = xs.map((x, i) => (Math.abs(x) <= 1 ? ys[i] : null));
  const zone2  = xs.map((x, i) => (Math.abs(x) > 1 && Math.abs(x) <= 2 ? ys[i] : null));
  const zone3  = xs.map((x, i) => (Math.abs(x) > 2 && Math.abs(x) <= 3 ? ys[i] : null));
  const outline = xs.map((_, i) => ys[i]);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => round2(x)),
      datasets: [
        {
          label: '±3σ (99.7%)',
          data: zone3,
          backgroundColor: 'rgba(139,92,246,.18)',
          borderColor: 'transparent',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: '±2σ (95%)',
          data: zone2,
          backgroundColor: 'rgba(139,92,246,.32)',
          borderColor: 'transparent',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: '±1σ (68%)',
          data: zone1,
          backgroundColor: 'rgba(139,92,246,.55)',
          borderColor: 'transparent',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: 'N(0,1)',
          data: outline,
          backgroundColor: 'transparent',
          borderColor: COLORS.purple,
          borderWidth: 2.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 9 } },
        y: { grid: { color: 'rgba(0,0,0,.06)' } }
      }
    }
  });
})();

/* ── 6. Box Plot (simulated with bar) ───────────────── */
(function buildBoxPlotChart() {
  const ctx = document.getElementById('boxplotChart');
  if (!ctx) return;
  const data = [4, 7, 13, 16, 21, 21, 23, 24, 25, 26, 28, 29, 30, 32, 34];
  const q1   = quartile(data, 0.25);
  const med  = median(data);
  const q3   = quartile(data, 0.75);
  const iqr  = q3 - q1;
  const min  = Math.max(Math.min(...data), q1 - 1.5 * iqr);
  const max  = Math.min(Math.max(...data), q3 + 1.5 * iqr);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Стойности'],
      datasets: [
        { label: 'Min → Q1',  data: [q1 - min],  backgroundColor: 'transparent', base: min, borderColor: 'transparent', borderWidth: 0 },
        { label: 'IQR (Q1–Q3)', data: [iqr],     backgroundColor: 'rgba(139,92,246,.65)', base: q1, borderColor: COLORS.purple, borderWidth: 2 },
        { label: 'Q3 → Max',  data: [max - q3],  backgroundColor: 'transparent', base: q3, borderColor: 'transparent', borderWidth: 0 },
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const map = {
                'Min → Q1': `Q1 = ${round2(q1)}, Min = ${round2(min)}`,
                'IQR (Q1–Q3)': `IQR = ${round2(iqr)}, Me = ${round2(med)}`,
                'Q3 → Max': `Q3 = ${round2(q3)}, Max = ${round2(max)}`,
              };
              return map[ctx.dataset.label] || '';
            }
          }
        }
      },
      scales: {
        x: { stacked: false, grid: { color: 'rgba(0,0,0,.06)' }, title: { display: true, text: 'Стойности' } },
        y: { stacked: false }
      }
    },
    plugins: [{
      afterDraw(chart) {
        const { ctx: c, chartArea: ca, scales } = chart;
        const scaleX = scales.x;
        const yPos = ca.top + (ca.bottom - ca.top) / 2;
        c.save();
        // Whiskers
        c.strokeStyle = COLORS.purple;
        c.lineWidth = 2;
        [min, max].forEach(val => {
          const px = scaleX.getPixelForValue(val);
          c.beginPath();
          c.moveTo(px, yPos - 14);
          c.lineTo(px, yPos + 14);
          c.stroke();
        });
        const pMin = scaleX.getPixelForValue(min);
        const pQ1  = scaleX.getPixelForValue(q1);
        const pQ3  = scaleX.getPixelForValue(q3);
        const pMax = scaleX.getPixelForValue(max);
        c.beginPath(); c.moveTo(pMin, yPos); c.lineTo(pQ1, yPos); c.stroke();
        c.beginPath(); c.moveTo(pQ3, yPos); c.lineTo(pMax, yPos); c.stroke();
        // Median line
        const pMed = scaleX.getPixelForValue(med);
        c.strokeStyle = '#fff';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(pMed, yPos - 14);
        c.lineTo(pMed, yPos + 14);
        c.stroke();
        c.restore();
      }
    }]
  });
})();

/* ── 7. Normal Distribution Chart (shape section) ─── */
(function buildNormalChart() {
  const ctx = document.getElementById('normalChart');
  if (!ctx) return;
  const xs = linspace(-4, 4, 160);
  const ys = xs.map(x => normalPDF(x));
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => round2(x)),
      datasets: [{
        data: ys,
        borderColor: COLORS.pink,
        backgroundColor: 'rgba(236,72,153,.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 5 } },
        y: { display: false }
      }
    }
  });
})();

/* ── 8. Skewness Charts ──────────────────────────────── */
function buildSkewChart(id, skew, color, fillColor) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const xs = linspace(0, 10, 120);

  // Approximate skewed distribution with a log-normal-style transform
  let ys;
  if (skew === 0) {
    ys = xs.map(x => normalPDF(x, 5, 1.5));
  } else if (skew < 0) {
    // Left (negative) skew
    ys = xs.map(x => {
      const t = 10 - x;
      return t > 0 ? normalPDF(Math.log(t), 1.5, 0.7) / t : 0;
    });
  } else {
    // Right (positive) skew
    ys = xs.map(x => {
      return x > 0 ? normalPDF(Math.log(x), 1.5, 0.7) / x : 0;
    });
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => round2(x)),
      datasets: [{
        data: ys,
        borderColor: color,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

buildSkewChart('skewNegChart',  -1, COLORS.blue,   'rgba(59,130,246,.2)');
buildSkewChart('skewZeroChart',  0, COLORS.green,  'rgba(34,197,94,.2)');
buildSkewChart('skewPosChart',   1, COLORS.red,    'rgba(239,68,68,.2)');

/* ── 9. Kurtosis Charts ─────────────────────────────── */
function buildKurtChart(id, sigma, color, fillColor) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const xs = linspace(-5, 5, 160);
  const ys = xs.map(x => normalPDF(x, 0, sigma));
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs.map(x => round2(x)),
      datasets: [{
        data: ys,
        borderColor: color,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

buildKurtChart('kurtLeptoChart', 0.6, COLORS.red,    'rgba(239,68,68,.15)');
buildKurtChart('kurtMesoChart',  1.0, COLORS.pink,   'rgba(236,72,153,.2)');
buildKurtChart('kurtPlatyChart', 1.8, COLORS.blue,   'rgba(59,130,246,.15)');

/* ─── Shape Explorer (Sliders) ──────────────────────── */
let shapeChart = null;
const skewSlider = document.getElementById('skewSlider');
const kurtSlider = document.getElementById('kurtSlider');

function generateSkewedData(skewness, kurtosis) {
  const xs = linspace(-5, 5, 200);
  return xs.map(x => {
    let y = normalPDF(x);
    // Approximate skewness effect
    const phi = normalPDF(x);
    const Phi = 0.5 * (1 + Math.tanh(x * 0.7071));
    y = 2 * phi * Phi;
    // Scale by "kurtosis" — sharpen or flatten
    const scaled = Math.pow(Math.max(y, 0), 1 + kurtosis * 0.3);
    // Apply skewness shift
    const xShift = x - skewness * 0.4;
    return normalPDF(xShift, 0, Math.max(0.5, 1 - kurtosis * 0.15));
  });
}

function updateShapeChart() {
  const skewVal = parseFloat(skewSlider.value);
  const kurtVal = parseFloat(kurtSlider.value);
  document.getElementById('skewVal').textContent = skewVal.toFixed(1);
  document.getElementById('kurtVal').textContent = kurtVal.toFixed(1);
  document.getElementById('seSkew').textContent = skewVal.toFixed(2);
  document.getElementById('seKurt').textContent = kurtVal.toFixed(2);

  let shapeTxt;
  if (Math.abs(skewVal) < 0.3 && Math.abs(kurtVal) < 0.3) shapeTxt = 'Нормална';
  else if (skewVal < -0.3) shapeTxt = 'Лява асиметрия';
  else if (skewVal > 0.3)  shapeTxt = 'Дясна асиметрия';
  else if (kurtVal > 0.5)  shapeTxt = 'Лептокуртична';
  else if (kurtVal < -0.5) shapeTxt = 'Платикуртична';
  else shapeTxt = 'Мезокуртична';
  document.getElementById('seShape').textContent = shapeTxt;

  const xs = linspace(-5, 5, 200);
  const sigma = Math.max(0.4, 1 - kurtVal * 0.2);
  const mu    = -skewVal * 0.35;
  const ys    = xs.map(x => normalPDF(x, mu, sigma));

  if (!shapeChart) {
    const ctx = document.getElementById('shapeExplorerChart');
    if (!ctx) return;
    shapeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: xs.map(x => round2(x)),
        datasets: [
          {
            label: 'Разпределение',
            data: ys,
            borderColor: COLORS.purple,
            backgroundColor: 'rgba(139,92,246,.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Нормално (референция)',
            data: xs.map(x => normalPDF(x)),
            borderColor: 'rgba(200,200,200,.6)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [6,4],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
          y: { grid: { color: 'rgba(0,0,0,.05)' } }
        }
      }
    });
  } else {
    shapeChart.data.datasets[0].data = ys;
    shapeChart.update('active');
  }
}

skewSlider.addEventListener('input', updateShapeChart);
kurtSlider.addEventListener('input', updateShapeChart);
updateShapeChart();

/* ─── Median Visual ─────────────────────────────────── */
function runMedianVisual(nums) {
  const container = document.getElementById('mvNumbers');
  const highlight  = document.getElementById('mvHighlight');
  const result     = document.getElementById('mvResult');
  if (!container) return;

  // Show unsorted
  container.innerHTML = '';
  highlight.textContent = '';
  result.textContent = '';
  nums.forEach(n => {
    const el = document.createElement('div');
    el.className = 'mv-num';
    el.textContent = n;
    container.appendChild(el);
  });

  setTimeout(() => {
    const sorted = [...nums].sort((a, b) => a - b);
    container.innerHTML = '';
    sorted.forEach(n => {
      const el = document.createElement('div');
      el.className = 'mv-num sorted';
      el.textContent = n;
      container.appendChild(el);
    });
    highlight.textContent = '↓ Наредени ↓';

    setTimeout(() => {
      const n   = sorted.length;
      const mid = Math.floor(n / 2);
      const els = container.querySelectorAll('.mv-num');

      if (n % 2 !== 0) {
        els[mid].classList.add('median-highlight');
        result.textContent = `Медиана = ${sorted[mid]}`;
      } else {
        els[mid - 1].classList.add('median-highlight');
        els[mid].classList.add('median-highlight');
        result.textContent = `Медиана = (${sorted[mid-1]} + ${sorted[mid]}) / 2 = ${(sorted[mid-1]+sorted[mid])/2}`;
      }
    }, 600);
  }, 800);
}

document.getElementById('mvBtn').addEventListener('click', () => {
  const nums = parseNumbers(document.getElementById('mvInput').value);
  if (nums.length >= 2) runMedianVisual(nums);
});

// Default demo
runMedianVisual([3, 7, 2, 9, 5]);

/* ─── Tendency Calculator ───────────────────────────── */
let tendencyChartInst = null;

document.getElementById('tendencyCalcBtn').addEventListener('click', () => {
  const nums = parseNumbers(document.getElementById('tendencyInput').value);
  if (nums.length < 2) { alert('Въведи поне 2 числа.'); return; }

  const m   = round2(mean(nums));
  const med = round2(median(nums));
  const mod = mode(nums);

  document.getElementById('vN').textContent    = nums.length;
  document.getElementById('vMean').textContent = m;
  document.getElementById('vMedian').textContent = med;
  document.getElementById('vMode').textContent  = mod.join(', ');

  const res = document.getElementById('tendencyResults');
  const chartWrap = document.getElementById('tendencyChartWrap');
  res.style.display = 'grid';
  chartWrap.style.display = 'block';

  const ctx = document.getElementById('tendencyChart');
  const sorted = [...nums].sort((a, b) => a - b);

  if (tendencyChartInst) tendencyChartInst.destroy();
  tendencyChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map((_, i) => i + 1),
      datasets: [{
        label: 'Стойности',
        data: sorted,
        backgroundColor: 'rgba(59,130,246,.6)',
        borderColor: COLORS.blue,
        borderWidth: 2,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,.06)' } } }
    },
    plugins: [{
      afterDraw(chart) {
        const { ctx: c, chartArea: ca, scales: { y } } = chart;
        const drawLine = (val, color, label) => {
          const yPos = y.getPixelForValue(val);
          if (yPos < ca.top || yPos > ca.bottom) return;
          c.save();
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.setLineDash([5, 3]);
          c.beginPath(); c.moveTo(ca.left, yPos); c.lineTo(ca.right, yPos); c.stroke();
          c.fillStyle = color;
          c.font = 'bold 11px Inter';
          c.fillText(label, ca.left + 6, yPos - 4);
          c.restore();
        };
        drawLine(m,   '#ef4444', `x̄=${m}`);
        drawLine(med, '#8b5cf6', `Me=${med}`);
      }
    }]
  });
});

/* ─── Dispersion Calculator ────────────────────────── */
document.getElementById('dispCalcBtn').addEventListener('click', () => {
  const nums = parseNumbers(document.getElementById('dispersionInput').value);
  if (nums.length < 2) { alert('Въведи поне 2 числа.'); return; }

  const m  = mean(nums);
  const v  = variance(nums);
  const s  = stdDev(nums);
  const r  = Math.max(...nums) - Math.min(...nums);
  const cv = m !== 0 ? round2((s / m) * 100) : 'N/A';
  const q1 = round2(quartile(nums, 0.25));
  const q3 = round2(quartile(nums, 0.75));
  const iqr = round2(q3 - q1);

  document.getElementById('dRange').textContent   = round2(r);
  document.getElementById('dVariance').textContent = round2(v);
  document.getElementById('dStd').textContent      = round2(s);
  document.getElementById('dCV').textContent       = cv + (cv !== 'N/A' ? '%' : '');
  document.getElementById('dQ1').textContent       = q1;
  document.getElementById('dQ3').textContent       = q3;
  document.getElementById('dIQR').textContent      = iqr;

  document.getElementById('dispersionResults').style.display = 'grid';
});

/* ─── Quiz ──────────────────────────────────────────── */
const questions = [
  {
    q: 'Кое от следните НЕ е мярка на централната тенденция?',
    opts: ['Средна аритметична', 'Медиана', 'Дисперсия', 'Мода'],
    correct: 2,
    explanation: 'Дисперсията е мярка на разсейването, не на централната тенденция. Мерките на централната тенденция са: средна стойност, медиана и мода.'
  },
  {
    q: 'Какво измерва стандартното отклонение?',
    opts: [
      'Средната стойност на данните',
      'Разстоянието между максимума и минимума',
      'Средното разстояние на стойностите от средната',
      'Асиметрията на разпределението'
    ],
    correct: 2,
    explanation: 'Стандартното отклонение измерва средното разстояние на стойностите от средната аритметична стойност.'
  },
  {
    q: 'При дясна асиметрия (positive skew) коя е правилната връзка?',
    opts: [
      'Mean = Median = Mode',
      'Mean < Median < Mode',
      'Mean > Median > Mode',
      'Mode > Mean > Median'
    ],
    correct: 2,
    explanation: 'При дясна асиметрия опашката е вдясно, а средната стойност се "изтегля" вдясно от медианата и модата: Mean > Median > Mode.'
  },
  {
    q: 'Какво показва коефициентът на вариация (CV) от 45%?',
    opts: [
      'Слабо вариране — данните са хомогенни',
      'Умерено вариране',
      'Силно вариране — данните са хетерогенни',
      'Данните следват нормалното разпределение'
    ],
    correct: 2,
    explanation: 'CV > 35% показва силно вариране. Данните са хетерогенни (силно разпръснати).'
  },
  {
    q: 'Разпределение с ексцес γ₂ < 0 се нарича:',
    opts: [
      'Лептокуртично (остро)',
      'Мезокуртично (нормално)',
      'Платикуртично (плоско)',
      'Нормално разпределение'
    ],
    correct: 2,
    explanation: 'Платикуртичните разпределения имат отрицателен ексцес (γ₂ < 0) — по-плоски от нормалното, с по-дебели "рамене" и по-тънки опашки.'
  },
  {
    q: 'Кой от следните е устойчив на екстремни стойности (outliers)?',
    opts: [
      'Средна аритметична',
      'Обхват',
      'Дисперсия',
      'Медиана'
    ],
    correct: 3,
    explanation: 'Медианата е устойчива на outliers, защото е средна стойност при наредените данни и не зависи от екстремните стойности.'
  }
];

let currentQ  = 0;
let score     = 0;
let answered  = false;

function loadQuestion() {
  const q = questions[currentQ];
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizCounter').textContent  = `Въпрос ${currentQ + 1} от ${questions.length}`;
  document.getElementById('quizProgress').style.width = `${(currentQ / questions.length) * 100}%`;
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizNext').style.display     = 'none';

  const opts = document.getElementById('quizOptions');
  opts.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className  = 'quiz-option';
    btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
    btn.addEventListener('click', () => handleAnswer(i));
    opts.appendChild(btn);
  });
  answered = false;
}

function handleAnswer(idx) {
  if (answered) return;
  answered = true;
  const q = questions[currentQ];
  const opts = document.querySelectorAll('.quiz-option');

  opts.forEach(btn => btn.disabled = true);
  opts[q.correct].classList.add('correct');

  const fb = document.getElementById('quizFeedback');
  if (idx === q.correct) {
    score++;
    opts[idx].classList.add('correct');
    fb.className = 'quiz-feedback correct-fb';
    fb.innerHTML = `<strong>✓ Правилно!</strong> ${q.explanation}`;
  } else {
    opts[idx].classList.add('incorrect');
    fb.className = 'quiz-feedback incorrect-fb';
    fb.innerHTML = `<strong>✗ Грешно.</strong> ${q.explanation}`;
  }
  fb.style.display = 'block';
  document.getElementById('quizNext').style.display = 'block';
}

document.getElementById('quizNext').addEventListener('click', () => {
  currentQ++;
  if (currentQ < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  document.getElementById('quizContainer').style.display = 'none';
  const res = document.getElementById('quizResult');
  res.style.display = 'block';

  const pct  = Math.round((score / questions.length) * 100);
  document.getElementById('qrScore').textContent = `${score} / ${questions.length}`;
  document.getElementById('quizProgress').style.width = '100%';

  let icon, title, msg;
  if (pct >= 83) {
    icon = '🏆'; title = 'Отлично!';
    msg = `Постигна ${pct}%! Имаш отлично разбиране на описателната статистика.`;
  } else if (pct >= 50) {
    icon = '📊'; title = 'Добре!';
    msg = `Постигна ${pct}%. Прочети отново разделите с грешни отговори.`;
  } else {
    icon = '📖'; title = 'Продължавай!';
    msg = `Постигна ${pct}%. Разгледай отново урока и опитай пак.`;
  }

  document.getElementById('qrIcon').textContent = icon;
  document.getElementById('qrTitle').textContent = title;
  document.getElementById('qrMsg').textContent   = msg;
}

document.getElementById('quizRestart').addEventListener('click', () => {
  currentQ = 0; score = 0; answered = false;
  document.getElementById('quizResult').style.display    = 'none';
  document.getElementById('quizContainer').style.display = 'block';
  loadQuestion();
});

// Init quiz
loadQuestion();

/* ─── Smooth scroll for hero CTA ────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

console.log('✦ Sparkpages — Описателна Статистика зареден успешно!');
