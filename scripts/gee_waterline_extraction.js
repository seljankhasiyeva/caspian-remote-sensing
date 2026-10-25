// =====================================================================
// Shoreline response to Caspian Sea-level decline, Qizilagac Bay (Azerbaijan)
// Google Earth Engine (Code Editor) script. PRELIMINARY / work in progress.
//
// What it does
//   1. Computes the August-September mean Caspian level for three epochs
//      (YEAR_A, YEAR_B, YEAR_C) from the G-REALM altimetry series and the
//      level drop dH between them (cm).
//   2. Maps water with Sentinel-2 SR (NDWI > 0) for the same epochs and
//      derives "exposed land" = water in the earlier epoch AND land in the
//      later one, inside a hand-defined coastal zone (`zone`).
//   3. Reports exposed area (km2) and km2 per cm of level drop.
//   4. Reports mean horizontal retreat per 0.02-degree latitude band
//      (m/cm) = band area / band height / dH.  NOTE: valid only where the
//      shore runs roughly north-south (see README, Limitations).
//   5. Temporal hold-out test: band coefficients from epoch A->B are used
//      to predict epoch B->C (LOCAL, UNIFORM, ETOPO1 predictors).
//   6. NDWI-threshold sensitivity (-0.1 / 0 / +0.1) and a visual check
//      layer set for one latitude band.
//
// Reference output (22 Oct 2026 run; re-running should reproduce it):
//   dH (cm): 24.25 (2016->2020), 93.00 (2020->2024), 117.25 (2016->2024)
//   Sentinel-2 scenes: 11 (2016), 32 (2020), 30 (2024)
//   Exposed area km2: 47.40 / 201.37 / 247.53 ; km2 per cm: 1.95 / 2.17 / 2.11
//   Band m/cm median (p25-p75): 26.1 (14.4-60.4) ; 35.0 (11.7-69.1)
//   Hold-out RMSE (m): LOCAL 3475, UNIFORM 3858, ETOPO1 3996
//   Additivity check (km2, unfiltered): water->land->water 0.085, land->water->land 2.667,
//     flipA + flipB 2.753 = sum of intervals - direct 2.753 (identity holds)
//
// Sea-level data: NASA/USDA G-REALM, lake 000270 (Caspian Sea), product
//   TPJOJS.2.5, column 15 (EGM2008 datum). One altimetry track averaged
//   over the basin, NOT a local gauge. Source file: data/raw/.
// Run: paste into https://code.earthengine.google.com and press Run.
// =====================================================================

// ---- Sea level: [year, month, day, level_m_EGM2008], Aug-Sep only ----
var LEVELS = [
  [2015,8,6,-27.20],
  [2015,8,16,-27.29],
  [2015,8,26,-27.30],
  [2015,9,5,-27.33],
  [2015,9,15,-27.32],
  [2015,9,25,-27.38],
  [2016,8,7,-27.14],
  [2016,8,17,-27.16],
  [2016,8,27,-27.21],
  [2016,9,6,-27.21],
  [2016,9,16,-27.26],
  [2016,9,26,-27.32],
  [2016,8,7,-27.15],
  [2016,8,17,-27.17],
  [2016,8,27,-27.23],
  [2016,9,6,-27.21],
  [2016,9,16,-27.29],
  [2016,9,26,-27.34],
  [2017,8,9,-27.20],
  [2017,8,19,-27.21],
  [2017,8,29,-27.19],
  [2017,9,27,-27.23],
  [2018,8,1,-27.24],
  [2018,8,11,-27.17],
  [2018,8,21,-27.30],
  [2018,8,31,-27.31],
  [2018,9,10,-27.40],
  [2018,9,19,-27.48],
  [2018,9,29,-27.50],
  [2019,8,3,-27.45],
  [2019,8,23,-27.54],
  [2019,9,2,-27.60],
  [2019,9,11,-27.60],
  [2020,8,4,-27.34],
  [2020,8,14,-27.43],
  [2020,8,23,-27.39],
  [2020,9,2,-27.48],
  [2020,9,12,-27.55],
  [2020,9,22,-27.61],
  [2021,8,6,-27.70],
  [2021,8,15,-27.69],
  [2021,8,25,-27.75],
  [2021,9,4,-27.80],
  [2021,9,14,-27.84],
  [2021,9,24,-27.84],
  [2021,8,6,-27.71],
  [2021,8,15,-27.67],
  [2021,8,25,-27.72],
  [2021,9,4,-27.78],
  [2021,9,14,-27.83],
  [2021,9,24,-27.81],
  [2022,8,7,-27.91],
  [2022,8,17,-27.93],
  [2022,8,27,-27.99],
  [2022,9,6,-27.98],
  [2022,9,16,-28.12],
  [2022,9,26,-28.14],
  [2023,8,9,-28.24],
  [2023,8,19,-28.25],
  [2023,8,29,-28.25],
  [2023,9,8,-28.31],
  [2023,9,18,-28.22],
  [2023,9,28,-28.38],
  [2024,8,10,-28.38],
  [2024,8,20,-28.38],
  [2024,8,30,-28.34],
  [2024,9,9,-28.35],
  [2024,9,19,-28.49],
  [2024,9,29,-28.44],
  [2025,8,2,-28.48],
  [2025,8,12,-28.55],
  [2025,8,22,-28.45],
  [2025,9,1,-28.51],
  [2025,9,11,-28.57],
  [2025,9,21,-28.51],
  [2026,8,4,-28.46],
  [2026,8,14,-28.44],
  [2026,8,24,-28.49],
  [2026,9,3,-28.49],
  [2026,9,13,-28.58],
  [2026,9,23,-28.61]
];
// ---- Epochs: change the years only here ----
var YEAR_A = 2016, YEAR_B = 2020, YEAR_C = 2024;

// ---- Mean Aug-Sep level (m) and level drop (cm) ----
function meanLevel(year) {
  var v = LEVELS.filter(function(r){ return r[0] === year; })
                .map(function(r){ return r[3]; });
  if (v.length === 0) { throw new Error('No level data for ' + year); }
  return v.reduce(function(a, b){ return a + b; }, 0) / v.length;
}
function nObs(year) {
  return LEVELS.filter(function(r){ return r[0] === year; }).length;
}
function deltaHcm(y1, y2) {            // a drop gives a positive value
  return (meanLevel(y1) - meanLevel(y2)) * 100;
}

var dH_1 = deltaHcm(YEAR_A, YEAR_B);
var dH_2 = deltaHcm(YEAR_B, YEAR_C);
var dH_total = deltaHcm(YEAR_A, YEAR_C);
print('dH ' + YEAR_A + '->' + YEAR_B + ' (cm):', dH_1);
print('dH ' + YEAR_B + '->' + YEAR_C + ' (cm):', dH_2);
print('dH ' + YEAR_A + '->' + YEAR_C + ' (cm):', dH_total);
print('Level observations per epoch:', nObs(YEAR_A), nObs(YEAR_B), nObs(YEAR_C));

// ---- Study zone: coastal strip, derived from the convex hull of the two
// largest exposed-land components of an earlier (v0) mask. Circular by
// construction: see README, Limitations. ----
var zone = ee.Geometry.Polygon([[
  [49.40, 39.234], [49.104, 39.234], [49.014, 39.218], [48.962, 39.169],
  [48.930, 39.108], [48.831, 38.831], [48.834, 38.803], [49.40, 38.803]
]]);

// ===== Water mask =====
var roi = ee.Geometry.Rectangle([48.75, 38.80, 49.40, 39.30]);
Map.setOptions('SATELLITE');
Map.centerObject(zone, 10);

var S2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
function s2Filtered(year) {
  return S2.filterBounds(roi)
    .filterDate(year + '-08-01', year + '-10-01')      // 1 Aug - 30 Sep
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));
}
[YEAR_A, YEAR_B, YEAR_C].forEach(function(y) {
  print('Sentinel-2 scenes ' + y + ':', s2Filtered(y).size());
});
function waterMask(year) {
  var img = s2Filtered(year).median().clip(roi);
  return img.normalizedDifference(['B3', 'B8']).gt(0).rename('water');
}
var wA = waterMask(YEAR_A);
var wB = waterMask(YEAR_B);
var wC = waterMask(YEAR_C);

// ===== Exposed land: water in epoch 1, land in epoch 2, inside the zone;
// connected patches smaller than 256 pixels are removed =====
function gained(w1, w2) {
  var g = w1.and(w2.not()).clip(zone).rename('gained');
  var cnt = g.selfMask().connectedPixelCount(256, true);
  return g.updateMask(cnt.gte(256)).unmask(0).rename('gained');
}
var g1 = gained(wA, wB);
var g2 = gained(wB, wC);
var gT = gained(wA, wC);

Map.addLayer(zone, {color: 'white'}, 'Zone', true, 0.3);
Map.addLayer(g1.selfMask(), {palette: ['yellow']}, 'Exposed ' + YEAR_A + '->' + YEAR_B);
Map.addLayer(g2.selfMask(), {palette: ['orange']}, 'Exposed ' + YEAR_B + '->' + YEAR_C);

function sumOver(img, band) {
  return ee.Number(img.reduceRegion({
    reducer: ee.Reducer.sum(), geometry: zone, scale: 10,
    maxPixels: 1e10, tileScale: 8}).get(band));
}
function areaKm2(g) {
  return sumOver(g.multiply(ee.Image.pixelArea()).rename('a'), 'a').divide(1e6);
}

// ===== Area per cm of level drop =====
function report(g, dH, label) {
  var A = areaKm2(g);
  print(label + ' exposed area km2:', A);
  print(label + ' km2 per cm:', A.divide(dH));
}
report(g1, dH_1, YEAR_A + '->' + YEAR_B);
report(g2, dH_2, YEAR_B + '->' + YEAR_C);
report(gT, dH_total, YEAR_A + '->' + YEAR_C);

// ===== Latitude bands (0.02 deg ~ 2.22 km high) =====
var STEP = 0.02;
var bandH = STEP * 111195;   // metres
var lats = ee.List.sequence(38.80, 39.24, STEP);
var bands = ee.FeatureCollection(lats.map(function(lat) {
  lat = ee.Number(lat);
  return ee.Feature(
    ee.Geometry.Rectangle([48.76, lat, 49.39, lat.add(STEP)], null, false),
    {lat: lat});
}));

function bandStats(g, dH) {
  var a = g.multiply(ee.Image.pixelArea()).rename('a');
  var fc = a.reduceRegions({
    collection: bands, reducer: ee.Reducer.sum(),
    scale: 10, tileScale: 8});
  return fc.map(function(f) {
    var d = ee.Number(f.get('sum')).divide(bandH);   // mean retreat, m
    return f.set({retreat_m: d, m_per_cm: d.divide(dH)});
  });
}

function summary(fc, label) {
  var f = fc.filter(ee.Filter.gt('retreat_m', 0));
  print(label + ': bands with gain', f.size());
  print(label + ' m/cm (p25, p50, p75):',
        f.reduceColumns(ee.Reducer.percentile([25, 50, 75]), ['m_per_cm']));
}

var b1 = bandStats(g1, dH_1);
var b2 = bandStats(g2, dH_2);
summary(b1, YEAR_A + '->' + YEAR_B);
summary(b2, YEAR_B + '->' + YEAR_C);

// ===== Temporal hold-out: predict B->C from the A->B coefficients =====
// b1 and b2 must be defined above this block.
var ETOPO_K = 22.898;   // m/cm = 0.01 / tan(0.02502 deg): ETOPO1 ROI-mean slope
                        // (see scripts/etopo1_roi_mean_slope.js)

b1.evaluate(function(r1) {
  b2.evaluate(function(r2) {
    var k1 = r1.features.map(function(f){ return f.properties.m_per_cm; });
    var obs = r2.features.map(function(f){ return f.properties.retreat_m; });
    var lat = r2.features.map(function(f){ return f.properties.lat; });

    // bands with exposed land in at least one of the two intervals
    var idx = [];
    for (var i = 0; i < obs.length; i++) {
      if (k1[i] > 0 || obs[i] > 0) { idx.push(i); }
    }

    var pos = k1.filter(function(v){ return v > 0; }).sort(function(a,b){return a-b;});
    var kMed = pos[Math.floor(pos.length / 2)];

    function metrics(predFn, name) {
      var n = idx.length, sse = 0, sae = 0, bias = 0, so = 0;
      idx.forEach(function(i){ so += obs[i]; });
      var mo = so / n, sst = 0, sp = 0;
      var P = idx.map(function(i){ return predFn(i); });
      P.forEach(function(p){ sp += p; });
      var mp = sp / n, sxy = 0, sxx = 0, syy = 0;
      idx.forEach(function(i, j){
        var e = P[j] - obs[i];
        sse += e*e; sae += Math.abs(e); bias += e;
        sst += (obs[i]-mo)*(obs[i]-mo);
        sxy += (P[j]-mp)*(obs[i]-mo);
        sxx += (P[j]-mp)*(P[j]-mp); syy += (obs[i]-mo)*(obs[i]-mo);
      });
      var r = (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx*syy) : NaN;
      return name + ': n=' + n +
        ' | bias=' + (bias/n).toFixed(0) + ' m' +
        ' | MAE=' + (sae/n).toFixed(0) + ' m' +
        ' | RMSE=' + Math.sqrt(sse/n).toFixed(0) + ' m' +
        ' | R2(1:1)=' + (1 - sse/sst).toFixed(2) +
        ' | r=' + r.toFixed(2);   // r is undefined for constant predictions
    }

    var out = [];
    out.push('Mean observed retreat (m): ' +
             (idx.reduce(function(s,i){return s+obs[i];},0)/idx.length).toFixed(0));
    out.push(metrics(function(i){ return k1[i] * dH_2; }, 'LOCAL (own k1)'));
    out.push(metrics(function(i){ return kMed * dH_2; }, 'UNIFORM (median k1=' + kMed.toFixed(1) + ')'));
    out.push(metrics(function(i){ return ETOPO_K * dH_2; }, 'ETOPO1 (22.9 m/cm)'));

    var area = obs.reduce(function(s,v){ return s + v; }, 0) * bandH / 1e6;
    out.push('Area check from bands (km2): ' + area.toFixed(1) + '  [expected ~201]');

    out.push('\nlat | k1 (m/cm) | observed (m) | LOCAL prediction (m)');
    idx.forEach(function(i){
      out.push(lat[i].toFixed(2) + ' | ' + k1[i].toFixed(1) + ' | ' +
               obs[i].toFixed(0) + ' | ' + (k1[i]*dH_2).toFixed(0));
    });
    print(out.join('\n'));
  });
});

// ===== Map legend =====
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 12px', backgroundColor: 'white'}});
function legendRow(color, text) {
  return ui.Panel([
    ui.Label({style: {backgroundColor: color, padding: '8px', margin: '2px 6px 2px 0'}}),
    ui.Label(text, {margin: '4px 0'})
  ], ui.Panel.Layout.Flow('horizontal'));
}
legend.add(ui.Label('Qizilagac Bay: exposed land', {fontWeight: 'bold'}));
legend.add(legendRow('#ffff00', YEAR_A + '->' + YEAR_B + ' (' + dH_1.toFixed(0) + ' cm drop)'));
legend.add(legendRow('#ffa500', YEAR_B + '->' + YEAR_C + ' (' + dH_2.toFixed(0) + ' cm drop)'));
legend.add(legendRow('#dddddd', 'Study zone'));
legend.add(ui.Label('Sentinel-2, Aug-Sep median, NDWI > 0', {fontSize: '11px'}));
Map.add(legend);

// ===== NDWI threshold sensitivity (YEAR_A -> YEAR_C) =====
var ndA = s2Filtered(YEAR_A).median().clip(roi).normalizedDifference(['B3', 'B8']);
var ndC = s2Filtered(YEAR_C).median().clip(roi).normalizedDifference(['B3', 'B8']);
function gainedThr(thr) { return gained(ndA.gt(thr), ndC.gt(thr)); }
var thrImg = gainedThr(-0.1).multiply(ee.Image.pixelArea()).rename('m10')
  .addBands(gainedThr(0.1).multiply(ee.Image.pixelArea()).rename('p10'));
thrImg.reduceRegion({
  reducer: ee.Reducer.sum(), geometry: zone, scale: 10,
  maxPixels: 1e10, tileScale: 8
}).evaluate(function(r) {
  var a1 = r.m10 / 1e6, a2 = r.p10 / 1e6;
  print('NDWI sensitivity, ' + YEAR_A + '->' + YEAR_C + ':\n' +
    'threshold -0.1: ' + a1.toFixed(1) + ' km2 | ' + (a1 / dH_total).toFixed(2) + ' km2/cm\n' +
    'threshold  0.0: baseline (see the exposed-area report above)\n' +
    'threshold +0.1: ' + a2.toFixed(1) + ' km2 | ' + (a2 / dH_total).toFixed(2) + ' km2/cm');
});

// ===== Visual check of the 39.08-39.10 N band (largest hold-out error) =====
// Toggle the RGB layers in the Layers menu and switch on the exposed-land
// layer on top of RGB 2024 to see what NDWI marked as newly exposed.
var chk = ee.Geometry.Rectangle([48.76, 39.08, 49.39, 39.10]);
var rgb = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
Map.addLayer(s2Filtered(2016).median().clip(roi), rgb, 'RGB 2016', false);
Map.addLayer(s2Filtered(2020).median().clip(roi), rgb, 'RGB 2020', false);
Map.addLayer(s2Filtered(2024).median().clip(roi), rgb, 'RGB 2024', false);
Map.addLayer(g2.selfMask(), {palette: ['orange']}, 'Exposed 2020->2024 (check)', false);
Map.addLayer(chk, {color: 'red'}, 'Band 39.08', true, 0.3);

// ===== Additivity check: why (A->B) + (B->C) differs from A->C =====
// Each interval is a separate classification. Pixels that flip back between the
// three epochs enter the sum of the two intervals but not the direct mask.
// Without the small-patch filter, (sum of intervals - direct) equals exactly
// flipA + flipB, so the last two printed numbers must agree.
function areaOf(img) {
  return ee.Number(img.rename('a').multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(), geometry: zone, scale: 10,
    maxPixels: 1e10, tileScale: 8}).get('a')).divide(1e6);
}
var a_ = wA.clip(zone), b_ = wB.clip(zone), c_ = wC.clip(zone);
var flipA = a_.and(b_.not()).and(c_);        // water -> land -> water
var flipB = a_.not().and(b_).and(c_.not());  // land -> water -> land
var flipA_km2 = areaOf(flipA);
var flipB_km2 = areaOf(flipB);
print('Additivity check: water->land->water km2:', flipA_km2);
print('Additivity check: land->water->land km2:', flipB_km2);
print('Additivity check: flipA + flipB km2:', flipA_km2.add(flipB_km2));
print('Additivity check: unfiltered (sum of intervals - direct) km2:',
  areaOf(a_.and(b_.not())).add(areaOf(b_.and(c_.not()))).subtract(areaOf(a_.and(c_.not()))));
