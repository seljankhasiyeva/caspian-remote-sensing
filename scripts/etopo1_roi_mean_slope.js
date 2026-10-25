// ETOPO1 ROI-mean slope -> theoretical sensitivity (m per cm).
// Reproduces the 22.898 m/cm constant (ETOPO_K) used in gee_waterline_extraction.js.
// Taken from the first (v0) analysis; the value 0.02502 deg was produced by that run
// and has NOT yet been re-run with this standalone file.
//
// CAVEATS (see README):
//  * Dataset is NOAA/NGDC/ETOPO1 (1 arc-minute, ~1.85 km), not GEBCO ~450 m.
//  * The slope is averaged over the whole rectangle (land, shallow sea and
//    deeper sea together), not over the coastal strip between the two levels.
//  * ETOPO1 elevations are probably stored as integer metres, which is coarse
//    relative to a 1.17 m level drop (to be verified in the catalogue).
var roi = ee.Geometry.Rectangle([48.75, 38.80, 49.20, 39.30]);   // v0 ROI
var etopo = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock').clip(roi);
var slope = ee.Terrain.slope(etopo);
var meanSlope = slope.reduceRegion({
  reducer: ee.Reducer.mean(), geometry: roi, scale: 450, maxPixels: 1e9
}).get('slope');
print('ETOPO1 ROI-mean slope (deg):', meanSlope);
var slopeRad = ee.Number(meanSlope).multiply(Math.PI).divide(180);
// horizontal distance per 1 cm of level change = 0.01 m / tan(slope)
print('Theoretical sensitivity (m per cm):', ee.Number(0.01).divide(slopeRad.tan()));
