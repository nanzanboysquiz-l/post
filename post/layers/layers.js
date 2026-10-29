var wms_layers = [];


        var lyr__0 = new ol.layer.Tile({
            'title': '地理院淡色地図',
            'type':'base',
            'opacity': 0.500000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
            })
        });
var format_post_All_1 = new ol.format.GeoJSON();
var features_post_All_1 = format_post_All_1.readFeatures(json_post_All_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_post_All_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_post_All_1.addFeatures(features_post_All_1);
var lyr_post_All_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_post_All_1, 
                style: style_post_All_1,
                popuplayertitle: 'post_All',
                interactive: true,
    title: 'post_All<br />\
    <img src="styles/legend/post_All_1_0.png" /> 収集済<br />\
    <img src="styles/legend/post_All_1_1.png" /> 未収集<br />' });

lyr__0.setVisible(true);lyr_post_All_1.setVisible(true);
var layersList = [lyr__0,lyr_post_All_1];
lyr_post_All_1.set('fieldAliases', {'P30_001': 'P30_001', 'P30_002': 'P30_002', 'P30_003': 'P30_003', 'P30_004': 'P30_004', 'P30_005': 'P30_005', 'P30_006': 'P30_006', 'P30_007': 'P30_007', 'X': 'X', 'Y': 'Y', 'No': 'No', 'FLG': 'FLG', 'join_key': 'join_key', 'Memo': 'Memo', 'Memo2': 'Memo2', 'memo3': 'memo3', '行政コード': '行政コード', 'post_offices_id': 'post_offices_id', 'post_offices_prefecture': 'post_offices_prefecture', 'post_offices_name': 'post_offices_name', 'post_offices_is_collected': 'post_offices_is_collected', 'post_offices_collected_date': 'post_offices_collected_date', 'post_offices_memo': 'post_offices_memo', 'post_offices_collector_name': 'post_offices_collector_name', 'post_offices_created_at': 'post_offices_created_at', 'post_offices_municipality': 'post_offices_municipality', 'post_offices_municipality_code': 'post_offices_municipality_code', 'post_offices_collection_status': 'post_offices_collection_status', });
lyr_post_All_1.set('fieldImages', {'P30_001': 'Range', 'P30_002': 'Range', 'P30_003': 'Range', 'P30_004': 'Range', 'P30_005': 'TextEdit', 'P30_006': 'TextEdit', 'P30_007': 'CheckBox', 'X': 'TextEdit', 'Y': 'TextEdit', 'No': 'Range', 'FLG': 'Range', 'join_key': 'TextEdit', 'Memo': 'TextEdit', 'Memo2': 'TextEdit', 'memo3': 'TextEdit', '行政コード': 'Range', 'post_offices_id': 'TextEdit', 'post_offices_prefecture': 'TextEdit', 'post_offices_name': 'TextEdit', 'post_offices_is_collected': 'CheckBox', 'post_offices_collected_date': 'DateTime', 'post_offices_memo': 'TextEdit', 'post_offices_collector_name': 'TextEdit', 'post_offices_created_at': 'DateTime', 'post_offices_municipality': 'TextEdit', 'post_offices_municipality_code': 'Range', 'post_offices_collection_status': 'TextEdit', });
lyr_post_All_1.set('fieldLabels', {'P30_001': 'hidden field', 'P30_002': 'hidden field', 'P30_003': 'hidden field', 'P30_004': 'hidden field', 'P30_005': 'no label', 'P30_006': 'hidden field', 'P30_007': 'hidden field', 'X': 'hidden field', 'Y': 'hidden field', 'No': 'hidden field', 'FLG': 'hidden field', 'join_key': 'hidden field', 'Memo': 'hidden field', 'Memo2': 'hidden field', 'memo3': 'hidden field', '行政コード': 'hidden field', 'post_offices_id': 'hidden field', 'post_offices_prefecture': 'no label', 'post_offices_name': 'hidden field', 'post_offices_is_collected': 'hidden field', 'post_offices_collected_date': 'no label', 'post_offices_memo': 'no label', 'post_offices_collector_name': 'no label', 'post_offices_created_at': 'hidden field', 'post_offices_municipality': 'no label', 'post_offices_municipality_code': 'hidden field', 'post_offices_collection_status': 'no label', });
lyr_post_All_1.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});