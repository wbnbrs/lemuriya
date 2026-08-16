/* ============================================================
   ЛЕМУРИЯ — map.js: интерактивная карта Мадагаскара (Leaflet)
============================================================ */
(function () {
  'use strict';

  const mapEl = document.getElementById('leafletMap');
  if (!mapEl) return;

  function init() {
    if (typeof L === 'undefined') {
      mapEl.innerHTML = '<p class="text-center text-mist py-24">Карта не загрузилась (нет доступа к Leaflet CDN).</p>';
      return;
    }

    const map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true }).setView([-19.2, 46.9], 6);

    // тёмные тайлы CARTO
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 12
    }).addTo(map);

    // контур острова
    const outline = window.MADAGASCAR_OUTLINE;
    if (outline) {
      L.polygon(outline.map(function (p) { return [p[0], p[1]]; }), {
        color: '#a3c585', weight: 1.6, fillColor: '#a3c585', fillOpacity: 0.05, dashArray: '4 4'
      }).addTo(map);
    }

    // слои ареалов
    const layers = {};
    const groups = {};
    (window.MAP_LAYERS || []).forEach(function (layer) {
      const g = L.layerGroup().addTo(map);
      const rect = L.rectangle(layer.bounds, {
        color: layer.color, weight: 2, fillColor: layer.color, fillOpacity: 0.14
      });
      const label = L.marker([layer.bounds[0][0], (layer.bounds[0][1] + layer.bounds[1][1]) / 2], {
        icon: L.divIcon({ className: '', html: '<div style="color:' + layer.color + ';font-weight:800;font-size:11px;text-shadow:0 1px 4px #000;white-space:nowrap">' + layer.label + '</div>', iconSize: [0, 0] })
      });
      rect.bindPopup('<b>' + layer.name + '</b><br>' + layer.range + '<br><span style="font-size:11px;color:#93a3b8">ареал показан приблизительно</span>');
      g.addLayer(rect); g.addLayer(label);
      groups[layer.id] = g;
      layers[layer.id] = layer;
    });

    // маркеры парков
    (window.MAP_PARKS || []).forEach(function (p) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="pin" style="font-size:26px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.7))">' + p.e + '</div>',
        iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -16]
      });
      L.marker([p.lat, p.lon], { icon: icon })
        .bindPopup('<b>' + p.name + '</b><br>🐒 ' + p.who + '<br><span style="font-size:11px;color:#93a3b8">' + p.text + '</span>')
        .addTo(map);
    });

    // переключатели слоёв
    const box = document.getElementById('mapToggles');
    const ids = Object.keys(groups);
    let active = new Set(ids);

    function applyToggles() {
      ids.forEach(function (id) {
        if (active.has(id)) { if (!map.hasLayer(groups[id])) groups[id].addTo(map); }
        else { if (map.hasLayer(groups[id])) map.removeLayer(groups[id]); }
      });
      if (active.size > 0) {
        const bounds = [];
        ids.forEach(function (id) { if (active.has(id)) bounds.push(layers[id].bounds[0], layers[id].bounds[1]); });
        map.fitBounds(L.latLngBounds(bounds).pad(0.25));
      }
    }

    box.innerHTML = '<button class="map-toggle active" data-map="all">Все ареалы</button>' +
      (window.MAP_LAYERS || []).map(function (l) {
        return '<button class="map-toggle" data-map="' + l.id + '" style="color:' + l.color + '">' + l.label + '</button>';
      }).join('');

    box.addEventListener('click', function (e) {
      const btn = e.target.closest('.map-toggle');
      if (!btn) return;
      const v = btn.getAttribute('data-map');
      if (v === 'all') {
        active = new Set(ids);
        box.querySelectorAll('.map-toggle').forEach(function (b) { b.classList.add('active'); });
      } else {
        // клик по отдельному виду = только он; повторный клик = вернуть все
        if (active.size === 1 && active.has(v)) {
          active = new Set(ids);
          box.querySelectorAll('.map-toggle').forEach(function (b) { b.classList.add('active'); });
        } else {
          active = new Set([v]);
          box.querySelectorAll('.map-toggle').forEach(function (b) { b.classList.toggle('active', b === btn); });
        }
      }
      applyToggles();
    });
  }

  init();
})();
