/* ============================================================
   ЛЕМУРИЯ — charts.js: Chart.js графики + D3 zoomable sunburst
============================================================ */
(function () {
  'use strict';

  const baseFont = { family: "'Manrope', sans-serif" };

  function hexA(hex, a) {
    try {
      if (typeof d3 !== 'undefined' && d3.color) {
        const c = d3.color(hex);
        return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
      }
    } catch (e) { /* noop */ }
    return hex;
  }

  /* ---------- Chart.js ---------- */
  function initCharts() {
    if (typeof Chart === 'undefined') {
      document.querySelectorAll('#radarChart, #barChart, #doughnutChart').forEach(function (c) {
        c.closest('.chart-card').insertAdjacentHTML('beforeend', '<p class="chart-note text-ember">Графики не загрузились (нет доступа к CDN Chart.js).</p>');
      });
      return;
    }
    Chart.defaults.color = '#93a190';
    Chart.defaults.font.family = baseFont.family;

    const R = window.RADAR;
    if (R && document.getElementById('radarChart')) {
      new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
          labels: R.labels,
          datasets: R.sets.map(function (s) {
            return {
              label: s.label, data: s.data,
              borderColor: s.color, backgroundColor: hexA(s.color, 0.16),
              pointBackgroundColor: s.color, pointRadius: 3, borderWidth: 2
            };
          })
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 14, font: { size: 11 } } } },
          scales: {
            r: {
              min: 0, max: 10,
              ticks: { stepSize: 2, display: false },
              grid: { color: 'rgba(255,255,255,.08)' },
              angleLines: { color: 'rgba(255,255,255,.08)' },
              pointLabels: { font: { size: 10 }, color: '#c3ccd9' }
            }
          }
        }
      });
    }

    const B = window.BAR;
    if (B && document.getElementById('barChart')) {
      new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
          labels: B.labels,
          datasets: [{
            label: 'видов', data: B.values,
            backgroundColor: B.colors.map(function (c) { return hexA(c, 0.85); }),
            borderRadius: 10, borderSkipped: false, barThickness: 30
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return ' ' + c.parsed.x + ' видов'; } } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#c3ccd9' } }
          }
        }
      });
    }

    const D = window.DOUGHNUT;
    if (D && document.getElementById('doughnutChart')) {
      new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
          labels: D.labels,
          datasets: [{
            data: D.values, backgroundColor: D.colors, borderColor: '#0b1220', borderWidth: 4, hoverOffset: 10
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: { size: 10.5 } } },
            tooltip: { callbacks: { label: function (c) { return ' ' + c.label + ': ' + c.parsed + '%'; } } }
          }
        },
        plugins: [{
          id: 'centerText',
          afterDraw: function (chart) {
            const meta = chart.getDatasetMeta(0);
            if (!meta.data.length) return;
            const x = meta.data[0].x, y = meta.data[0].y;
            const ctx = chart.ctx;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'italic 800 28px "Playfair Display", serif';
            ctx.fillStyle = '#e07b39';
            ctx.fillText('98%', x, y - 4);
            ctx.font = '700 10px Manrope, sans-serif';
            ctx.fillStyle = '#93a3b8';
            ctx.fillText('под угрозой', x, y + 16);
            ctx.restore();
          }
        }]
      });
    }
  }

  /* ---------- D3 zoomable sunburst ---------- */
  function initSunburst() {
    const box = document.getElementById('sunburst');
    if (!box || !window.SUNBURST) return;
    if (typeof d3 === 'undefined') {
      box.innerHTML = '<p class="text-center text-mist py-20">Древо не загрузилось (нет доступа к D3 CDN).</p>';
      return;
    }
    const tip = document.getElementById('sunburstTooltip');

    const width = box.clientWidth || 900;
    const height = 560;
    const radius = Math.min(width, height) / 2 - 14;

    const root = d3.hierarchy(window.SUNBURST)
      .sum(function (d) { return d.value || 0; })
      .sort(function (a, b) { return (b.value || 0) - (a.value || 0); });

    const svg = d3.select(box).append('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
      .style('font', "12px 'Manrope', sans-serif");

    const partition = function (data) { return d3.partition().size([2 * Math.PI, radius])(data); };
    const arc = d3.arc()
      .startAngle(function (d) { return d.x0; })
      .endAngle(function (d) { return d.x1; })
      .padAngle(function (d) { return Math.min((d.x1 - d.x0) / 2, 0.008); })
      .padRadius(radius / 2)
      .innerRadius(function (d) { return d.y0; })
      .outerRadius(function (d) { return d.y1; });

    const familyPalette = ['#a3c585', '#8bb26c', '#e07b39', '#c2573b', '#c0a8e0'];

    function familyIndex(d) {
      let anc = d;
      while (anc.depth > 1) anc = anc.parent;
      if (anc.depth !== 1) return 0;
      return root.children.indexOf(anc);
    }
    function colorOf(d) {
      const fi = Math.max(0, familyIndex(d));
      const base = d3.color(familyPalette[fi % familyPalette.length]);
      if (d.depth === 0) return '#0b1220';
      if (d.depth === 1) return base.darker(0.45).formatHex();
      if (d.depth === 2) return base.darker(0.15).formatHex();
      return base.brighter(0.18).formatHex();
    }

    const firstPartition = partition(root);
    root.descendants().forEach(function (d) { d.current = d; });

    const nodeG = svg.append('g').selectAll('g')
      .data(firstPartition.descendants())
      .join('g');

    const paths = nodeG.append('path')
      .attr('d', arc)
      .attr('fill', function (d) { return colorOf(d); })
      .attr('fill-opacity', 0.92)
      .attr('stroke', '#04070d')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        tip.classList.add('show');
        tip.innerHTML = '<b>' + d.data.name + '</b>' +
          (d.data.ru ? '<br>' + d.data.ru : '') +
          (d.value ? '<br>Видов: ' + d.value : '');
      })
      .on('mousemove', function (event) {
        const r = box.getBoundingClientRect();
        tip.style.left = (event.clientX - r.left + 16) + 'px';
        tip.style.top = (event.clientY - r.top + 12) + 'px';
      })
      .on('mouseleave', function () { tip.classList.remove('show'); })
      .on('click', function (event, d) {
        if (d.depth === 0) { transition(root); return; }
        transition(d.children && d.children.length ? d : (d.parent || root));
      });

    const labels = nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.32em')
      .style('fill', '#e8eef6')
      .style('font-weight', function (d) { return d.depth < 2 ? 700 : 500; })
      .style('font-size', function (d) { return d.depth === 0 ? 15 : d.depth === 1 ? 12 : 10; })
      .style('pointer-events', 'none')
      .text(function (d) {
        if (d.depth === 0) return '';
        const t = d.data.name;
        const maxLen = d.depth === 1 ? 13 : d.depth === 2 ? 11 : 10;
        if (d.depth === 0) return t;
        return t.length > maxLen ? t.slice(0, maxLen - 1) + '…' : t;
      })
      .attr('transform', function (d) { return 'translate(' + arc.centroid(d) + ')'; });

    svg.append('circle').attr('r', 38).attr('fill', '#0b1220').attr('stroke', 'rgba(224,123,57,.6)');
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '0.34em').style('font-size', 16).text('🐒');

    function transition(newRoot) {
      const p2 = partition(newRoot);
      const t = svg.transition().duration(820).ease(d3.easeCubicInOut);

      paths.data(p2.descendants(), function (d) { return d.data.name; })
        .transition(t)
        .tween('data', function (d) {
          const i = d3.interpolate(d.current, d);
          return function (tt) { d.current = i(tt); };
        })
        .attr('fill', function (d) { return colorOf(d); })
        .attrTween('d', function (d) { return function () { return arc(d.current); }; });

      labels.data(p2.descendants(), function (d) { return d.data.name; })
        .transition(t)
        .tween('data', function (d) {
          const i = d3.interpolate(d.current, d);
          return function (tt) { d.current = i(tt); };
        })
        .attrTween('transform', function (d) {
          return function () { return 'translate(' + arc.centroid(d.current) + ')'; };
        });
    }

    // клик по фону — вернуться к корню
    svg.on('click', function (event) {
      if (event.target.tagName === 'svg' || event.target.tagName === 'circle' || event.target.tagName === 'text' && event.target.textContent === '🐒') {
        transition(root);
      }
    });
  }

  initCharts();
  initSunburst();
})();
