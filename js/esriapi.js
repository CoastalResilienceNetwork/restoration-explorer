define([
	"esri/layers/ArcGISDynamicMapServiceLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/query" ,"esri/tasks/QueryTask", "dojo/_base/declare", "esri/layers/FeatureLayer", 
	"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", "dojo/_base/lang",
	"esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters",
],
function ( 	ArcGISDynamicMapServiceLayer, Extent, SpatialReference, Query, QueryTask, declare, FeatureLayer, 
			SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color, lang,
			IdentifyTask, IdentifyParameters) {
        "use strict";

        return declare(null, {
			esriApiFunctions: function(t){	
				// Add dynamic map service
				t.dynamicLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.7});
				t.dynamicLayer1 = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.7});
				t.map.addLayer(t.dynamicLayer);
				t.map.addLayer(t.dynamicLayer1);
				if (t.obj.visibleLayers1.length > 0){	
					t.dynamicLayer1.setVisibleLayers(t.obj.visibleLayers1);
				}
				if (t.obj.visibleLayers.length > 0){	
					t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
				}
				t.dynamicLayer.on("load", function () { 			
					t.layersArray = t.dynamicLayer.layerInfos;
					t.lyr = ""
					$.each(t.types, function(i,v){
						if(t.obj[v]){
							if (t.lyr.length == 0){
								t.lyr = v;
							}else{
								t.lyr = t.lyr + "_" + v;
							}
						}
					})					
					if (t.obj.stateSet == "no"){
						
					}
					// Save and Share Handler					
					if (t.obj.stateSet == "yes"){
						//extent
						var extent = new Extent(t.obj.extent.xmin, t.obj.extent.ymin, t.obj.extent.xmax, t.obj.extent.ymax, new SpatialReference({ wkid:4326 }))
						t.map.setExtent(extent, true);
						t.obj.stateSet = "no";
					}	
				});		
				// query to populate chosen menu
				var q = new Query();
				var qt = new QueryTask(t.url + "/" + t.lyrs.bounds );
				q.where = "OBJECTID > -1";
				q.returnGeometry = false;
				q.outFields = ["*"];
				var c = [];
				qt.execute(q, function(e){
					$.each(e.features, function(i,v){
						$('#' + t.id + 'selectCounty').append("<option value='" + v.attributes.Group_ + "'>"+ v.attributes.Group_ +"</option")
					})
					$('#' + t.id + 'selectCounty').trigger("chosen:updated");			
				});
				// handle map clicks
				t.map.setMapCursor("pointer")
				var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,255]), 2),new Color([255,255,255,0]));
				var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,0]), 2), new Color([174,68,82,1]));
				t.map.on("click", lang.hitch(t, function(evt) {
					t.map.setMapCursor("pointer")
					if (t.open == "yes"){
						t.map.graphics.clear();
						var pnt = evt.mapPoint;
						var q1 = new Query();
						var qt1 = new QueryTask(t.url + "/" + t.lyrs.DL_DT_ER_UV);
						q1.geometry = pnt;
						q1.outFields = ["*"];
						q1.returnGeometry = true;
						qt1.execute(q1, function(e){
							if (e.features.length > 0){
								t.atts = e.features[0].attributes;
								var geo = e.features[0].geometry;
								t.map.graphics.add(new Graphic(geo,sfs))													
								$("#" + t.id + "ind-att-wrap span").each(function(i,v){
									var n = t.clicks.roundTo(t.atts[$(v).attr("class")], 1)
									$(v).html(n);
								})
								$("#" + t.id + "click-selected").html("Selected Area Attributes");	
								$("#" + t.id + "me-sh-atts").slideDown();	
							}else{
								t.esriapi.clearAtts(t);
							}
						})	
						var scIndex = t.obj.visibleLayers1.indexOf("21");
						if (scIndex > -1) {
							var scq = new Query();
							var scqt = new QueryTask(t.url + "/21")
							var centerPoint = new esri.geometry.Point(evt.mapPoint.x,evt.mapPoint.y,evt.mapPoint.spatialReference);
							var mapWidth = t.map.extent.getWidth();
							var mapWidthPixels = t.map.width;
							var pixelWidth = mapWidth/mapWidthPixels;
							// change the tolerence below to adjust how many pixels will be grabbed when clicking on a point or line
							var tolerance = 10 * pixelWidth;
							var pnt1 = evt.mapPoint;
							var ext = new esri.geometry.Extent(1,1, tolerance, tolerance, evt.mapPoint.spatialReference);
							scq.geometry = ext.centerAt(centerPoint);
							scq.outFields = ["*"];
							scq.returnGeometry = true;
							scqt.execute(scq, function(e){
								if (e.features.length > 0){
									t.scAtts = e.features[0].attributes;
									var geo = e.features[0].geometry;
									t.map.graphics.add(new Graphic(geo,sms))
									$(".sc-att-wrap span").each(function(i,v){
										var field = v.id.split("-").pop()
										var val = t.scAtts[field]
										if (val == -99){
											val = "N/A"
										}else{
											val = t.clicks.roundTo(val,1)
											val = val + "%"
										}
										$("#" + v.id).html(val)
										$("#" + t.id + "scLabel").html("<b>Selected Core</b>")
										$(".sc-att-wrap").show()
									})
								}else{
									$("#" + t.id + "scLabel").html("Click points for more info")
									$(".sc-att-wrap").hide()
								}	
							})	 
						}
						var scIndex = t.obj.visibleLayers1.indexOf("23");
						if (scIndex > -1) {
							//create identify tasks and setup parameters
							var identifyTask = new IdentifyTask(t.url);
							var identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 1;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [23];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
							identifyParams.width = t.map.width;
							identifyParams.height = t.map.height;
							identifyParams.geometry = evt.mapPoint;
          					identifyParams.mapExtent = t.map.extent;
          					
          					var deferred = identifyTask.execute(identifyParams);
            				deferred.addCallback(function (response) {
            					if (response[0]){
	            					var pv = response[0].feature.attributes['Pixel Value'];
    	        					if (isNaN(pv)){
										$("#" + t.id + "sdLabel").html("Click raster for more info")
    	        						$(".sd-att-wrap").hide()
    	        					}else{
    	        						pv = t.clicks.roundTo(pv,1)  
    	        						$("#" + t.id + "PixelValue").html(pv + "%")
    	        						$("#" + t.id + "sdLabel").html("Selected Pixel Value");
    	        						$(".sd-att-wrap").show()
    	        					}	
    	        				}else{
    	        					$("#" + t.id + "sdLabel").html("Click raster for more info")
    	        					$(".sd-att-wrap").hide()
    	        				}
            				});	
						}	
					}
				}))
				$("#" + t.id + "close-atts").click(function(){
					t.esriapi.clearAtts(t);
				})
			},
			clearAtts: function(t){
				t.map.graphics.clear();
				$("#" + t.id + "click-selected").html("Click individual rankings for more info");
				$("#" + t.id + "me-sh-atts").slideUp();
			} 				
		});
    }
);