// =====================================================================
// Zone-definition sensitivity of km2 per cm (2016 -> 2024).
// Standalone Earth Engine script: run it in a NEW, empty script (it reuses the
// variable names of gee_waterline_extraction.js). PRELIMINARY.
//
// Compares the exposed-land area (and km2/cm) obtained with four zone definitions:
//   current zone | current zone + 3 km buffer | current zone + southern strip
//   (38.60-38.80 N) | full ROI rectangle (48.75-49.40 E, 38.80-39.30 N)
//
// Reference output (run of 25 Oct 2026), dH = 117.25 cm:
//   current zone               247.53 km2   2.111 km2/cm
//   zone + 3 km buffer         256.40 km2   2.187 km2/cm   (+3.6%)
//   zone + south strip         248.60 km2   2.120 km2/cm   (+0.4%)
//   full ROI rectangle         262.17 km2   2.236 km2/cm   (+5.9%)
// The first line reproduces the main script (247.53 km2, 2.11 km2/cm).
// Whether the extra area outside the current zone is real exposed seabed or
// inland false positives has not been checked (inspect the raw layer on the map).
// =====================================================================
var YEAR_A = 2016, YEAR_C = 2024;
var dH_total = 117.25;   // cm, from the main script

var roiBig = ee.Geometry.Rectangle([48.60, 38.50, 49.60, 39.50]);
var roiOld = ee.Geometry.Rectangle([48.75, 38.80, 49.40, 39.30]);   // ROI of the main script
var zone = ee.Geometry.Polygon([[
  [49.40, 39.234], [49.104, 39.234], [49.014, 39.218], [48.962, 39.169],
  [48.930, 39.108], [48.831, 38.831], [48.834, 38.803], [49.40, 38.803]
]]);

var S2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
function water(year) {
  var img = S2.filterBounds(roiBig)
    .filterDate(year + '-08-01', year + '-10-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5))
    .median().clip(roiBig);
  return img.normalizedDifference(['B3', 'B8']).gt(0).rename('water');
}
var wA = water(YEAR_A), wC = water(YEAR_C);

function areaIn(region) {
  var g = wA.and(wC.not()).clip(region).rename('gained');
  var cnt = g.selfMask().connectedPixelCount(256, true);
  var gf = g.updateMask(cnt.gte(256)).unmask(0).rename('gained');
  return ee.Number(gf.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(), geometry: region, scale: 10,
    maxPixels: 1e10, tileScale: 8}).get('gained')).divide(1e6);
}

var southStrip = ee.Geometry.Rectangle([48.75, 38.60, 49.40, 38.80]);
var variants = [
  ['current zone', zone],
  ['zone + 3 km buffer', zone.buffer(3000)],
  ['zone + south strip', zone.union(southStrip, 1)],
  ['full ROI rectangle', roiOld]
];
variants.forEach(function(v) {
  var a = areaIn(v[1]);
  print('Zone sensitivity | ' + v[0] + ' | km2:', a, '| km2/cm:', a.divide(dH_total));
});
Map.setOptions('SATELLITE');
Map.centerObject(zone, 10);
var chk = wA.and(wC.not()).selfMask().clip(roiBig);
Map.addLayer(chk, {palette: ['orange']}, 'Raw exposed 2016->2024 (no zone, no filter)');
Map.addLayer(zone, {color: 'white'}, 'Zone', true, 0.3);
Map.addLayer(southStrip, {color: 'cyan'}, 'South strip', true, 0.3);
