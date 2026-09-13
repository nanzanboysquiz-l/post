var wms_layers = [];


        var lyr_GoogleMaps_0 = new ol.layer.Tile({
            'title': 'Google Maps',
            'type':'base',
            'opacity': 0.500000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            })
        });
var format_P3013_36_1 = new ol.format.GeoJSON();
var features_P3013_36_1 = format_P3013_36_1.readFeatures(json_P3013_36_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_P3013_36_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_P3013_36_1.addFeatures(features_P3013_36_1);
var lyr_P3013_36_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_P3013_36_1, 
                style: style_P3013_36_1,
                popuplayertitle: 'P30-13_36',
                interactive: true,
    title: 'P30-13_36<br />\
    <img src="styles/legend/P3013_36_1_0.png" /> 風景印なし<br />\
    <img src="styles/legend/P3013_36_1_1.png" /> 風景印未取得<br />\
    <img src="styles/legend/P3013_36_1_2.png" /> 風景印取得済<br />' });
var group_36_ = new ol.layer.Group({
                                layers: [lyr_P3013_36_1,],
                                fold: 'open',
                                title: '36_徳島'});

lyr_GoogleMaps_0.setVisible(true);lyr_P3013_36_1.setVisible(true);
var layersList = [lyr_GoogleMaps_0,group_36_];
lyr_P3013_36_1.set('fieldAliases', {'P30_001': 'P30_001', 'P30_002': 'P30_002', 'P30_003': 'P30_003', 'P30_004': 'P30_004', 'P30_005': 'P30_005', 'P30_006': 'P30_006', 'P30_007': 'P30_007', '風景印_36(徳島県)_自治体': '風景印_36(徳島県)_自治体', '風景印_36(徳島県)_取得': '風景印_36(徳島県)_取得', });
lyr_P3013_36_1.set('fieldImages', {'P30_001': 'TextEdit', 'P30_002': 'TextEdit', 'P30_003': 'TextEdit', 'P30_004': 'TextEdit', 'P30_005': 'TextEdit', 'P30_006': 'TextEdit', 'P30_007': 'Range', '風景印_36(徳島県)_自治体': 'TextEdit', '風景印_36(徳島県)_取得': 'TextEdit', });
lyr_P3013_36_1.set('fieldLabels', {'P30_001': 'hidden field', 'P30_002': 'hidden field', 'P30_003': 'hidden field', 'P30_004': 'hidden field', 'P30_005': 'no label', 'P30_006': 'hidden field', 'P30_007': 'hidden field', '風景印_36(徳島県)_自治体': 'no label', '風景印_36(徳島県)_取得': 'no label', });
lyr_P3013_36_1.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});