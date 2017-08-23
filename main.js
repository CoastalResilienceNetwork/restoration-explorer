require({
    packages: [
        {
            name: "jquery",
            location: "http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/",
            main: "jquery.min"
        }    
    ]
});
define([
        "dojo/_base/declare", "framework/PluginBase", 'plugins/restoration-explorer/ConstrainedMoveable', 'plugins/restoration-explorer/jquery-ui-1.11.0/jquery-ui',
		
		"esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/FeatureLayer", "esri/tasks/QueryTask", "esri/tasks/query", "esri/graphicsUtils", 
		"esri/geometry/Extent", "esri/SpatialReference", "esri/geometry/Point", "esri/graphic",
		
		"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/graphic", "esri/symbols/Font", 
		"esri/symbols/TextSymbol", "esri/symbols/PictureMarkerSymbol", "dojo/_base/Color", "esri/renderers/SimpleRenderer",		
		
		"dijit/registry", "dijit/form/Button", "dijit/form/DropDownButton", "dijit/DropDownMenu", "dijit/MenuItem", "dijit/layout/ContentPane",
		"dijit/form/HorizontalSlider", "dijit/form/CheckBox", "dijit/form/RadioButton", 
		
		"dojo/dom", "dojo/dom-class", "dojo/dom-style", "dojo/_base/window", "dojo/dom-construct", "dojo/dom-attr", "dijit/Dialog", "dojo/dom-geometry",
		"dojo/_base/array", "dojo/_base/lang", "dojo/on", "dojo/parser", "dojo/query", "dojo/NodeList-traverse", "dojo/dnd/Moveable", "dojo/dnd/move",
		
		"dojo/text!./layerviz.json", "jquery"
       ],
       function ( declare, PluginBase, ConstrainedMoveable, ui, 
					ArcGISDynamicMapServiceLayer, FeatureLayer, QueryTask, esriQuery, graphicsUtils, Extent, SpatialReference, Point, Graphic,
					SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Font, TextSymbol, PictureMarkerSymbol, Color, SimpleRenderer,
					registry, Button, DropDownButton, DropDownMenu, MenuItem, ContentPane, HorizontalSlider, CheckBox, RadioButton,
					dom, domClass, domStyle, win, domConstruct, domAttr, Dialog, domGeom, array, lang, on, parser, dojoquery, NodeListtraverse, Moveable, move,
					layerViz, $ ) {
					
			return declare(PluginBase, {
				toolbarName: "Restoration Explorer",
				toolbarType: "sidebar",
				showServiceLayersInLegend: true,
				allowIdentifyWhenActive: false,
				rendered: false,
				width: "295",
				height: "580",
				infoGraphic: "plugins/restoration-explorer/images/infoGraphic.jpg",
				
				initialize: function (frameworkParameters) {
					declare.safeMixin(this, frameworkParameters);
					domClass.add(this.container, "claro");
					con = dom.byId('plugins/restoration-explorer-0');
						domStyle.set(con, "width", "295px");
						domStyle.set(con, "height", "580px");
					con1 = dom.byId('plugins/restoration-explorer-1');
					if (con1 != undefined){
						domStyle.set(con1, "width", "295px");
						domStyle.set(con1, "height", "580px");
					}
					this.config = dojo.eval("[" + layerViz + "]")[0];	
					this.controls = this.config.controls;
					this.changes = { "radio": [], "extent": [], "visibleLayers": [],
					"idenGraphic": [], "selectedCounty": "", "selectedMun": "", "infoContent": "",
					"infoDisplay": "", "infoPicDisplay": "infoPicContent", "": "", "idenVal": "", "idenGroup": "", "idenType": "", "atts": "",
					"techName": ""};
				},
			   
				activate: function () {
					if (this.rendered == false) {
						this.rendered = true;
						this.render();
						this.currentLayer.setVisibility(true);
					} else {
						if (this.currentLayer != undefined)  {
							this.currentLayer.setVisibility(true);	
						}
						this.resize();
					}
			    },
				
				deactivate: function () {

				},	
				hibernate: function () { 	
					if (this.infoarea != undefined){
						this.infoarea.destroy();
					}
					if (this.sliderpane != undefined){
						this.sliderpane.destroy();
					}
					if (this.currentLayer != undefined)  {
						this.currentLayer.setVisibility(false);
						this.map.graphics.clear();
					}
					if (this.idenWin != undefined){
						this.idenWin.destroy();
					}
					if (this.buttonpane !=undefined ){
						this.buttonpane.destroy();
					}
					if (this.map != undefined){
						this.map.graphics.clear();
					}
					if (this.munFL != undefined){
						this.map.removeLayer(this.munFL)
					}
					this.rendered = false;
				},
				
				resize: function(w, h) {
					cdg = domGeom.position(this.container);
					if (cdg.h == 0) {
						this.sph = this.height - 120 	
					} else {
						this.sph = cdg.h-82;
					}
					domStyle.set(this.sliderpane.domNode, "height", this.sph + "px"); 
				},
				
				changeOpacity: function(e) {
					this.currentLayer.setOpacity(1 - e)
				},
				
				render: function() {	
					this.map.on("load", function(){
						this.map.graphics.enableMouseEvents();
					});	
					this.pntSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 8,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
						new Color([0,255,0]), 1.5),
						new Color([255,255,0,0.1]));
					this.highlightSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 8,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
						new Color([0,0,255]), 1.5),
						new Color([255,255,0,0.3]));
					this.sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
						new Color([161,70,18]), 2),new Color([255,255,0,0])
					  );			
					
					this.sliderpane = new ContentPane({});
					parser.parse();
					dom.byId(this.container).appendChild(this.sliderpane.domNode);					
					  
					//info image
					mymap = dom.byId(this.map.id);
					a = dojoquery(mymap).parent();
					this.infopic = new ContentPane({
						style:"z-index:100; !important;position:absolute !important;left:76px !important; top:98px !important;background-color:#FFF !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: " + this.config.infoPicDisplay,
						innerHTML: "<div class='infopiccloser'><a href='#'>✖</a></div>" +
						"<div class='arrow-left'></div><div class='arrow-right'></div>" +
						"<div class='infopiccontent' style='overflow-y: hidden !important;' id='" + this.sliderpane.id + "infoPicHandle'>" + this.config.infoPicContent + "</div>"
					});
					dom.byId(a[0]).appendChild(this.infopic.domNode)
					ina = dojoquery(this.infopic.domNode).children(".infopiccloser");
					this.infoPicCloser = ina[0];
					on(this.infoPicCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.infopic.domNode, 'display', 'none');
						this.config.infoPicDisplay = "none";
						this.config.infoPicContent == "";
					}));
					
					inac = dojoquery(this.infopic.domNode).children(".infopiccontent");
					this.infoPicContent = inac[0];		
					// right and left arrow clicks
					inl = dojoquery(this.infopic.domNode).children(".arrow-left");
					this.infoPicLeft = inl[0];
					on(this.infoPicLeft, "click", lang.hitch(this,function(){
						this.clickDirection = "left";
						this.updateInfoPic();
					}));
					inr = dojoquery(this.infopic.domNode).children(".arrow-right");
					this.infoPicRight = inr[0];
					on(this.infoPicRight, "click", lang.hitch(this,function(){
						this.clickDirection = "right";
						this.updateInfoPic();
					}));
					
										
					
					//info text
					mymap = dom.byId(this.map.id);
					a = dojoquery(mymap).parent();
					this.infoarea = new ContentPane({
						style:"z-index:100; !important;position:absolute !important;left:370px !important; top:65px !important;background-color:#FFF !important;padding:10px !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: " + this.config.infoDisplay,
						innerHTML: "<div class='infoareacloser' style='float:right !important'>" + 
						"<a href='#'>✖</a></div><div class='infoareacontent' style='padding-top:0px'>" + this.config.infoContent + "</div>"
					});
					dom.byId(a[0]).appendChild(this.infoarea.domNode)
					ina = dojoquery(this.infoarea.domNode).children(".infoareacloser");
					this.infoAreaCloser = ina[0];
					inac = dojoquery(this.infoarea.domNode).children(".infoareacontent");
					this.infoareacontent = inac[0];		
					on(this.infoAreaCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.infoarea.domNode, 'display', 'none');
						this.config.infoDisplay = "none";
					}));
					
					//tab container
					mymap = dom.byId(this.map.id);
					a = dojoquery(mymap).parent();
					this.b = makeid();
					
					this.iden2Html = "<p id='" + this.sliderpane.id + "techTitle'; style='font-weight:bold; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "erosion' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "tidal' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "salinity' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "wave' style='display:none; margin-bottom:0px;'></p>" +							
							"<p id='" + this.sliderpane.id + "ice' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "shoreline' style='display:none; margin-bottom:0px;'></p>" +							
							"<p id='" + this.sliderpane.id + "nearshore' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "totalc' style='display:none; margin-bottom:0px;'></p>" 
					
					this.iden1Html = 
							"<p id='" + this.sliderpane.id + "nblsId' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "lreefId' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "msillId' style='display:none; margin-bottom:0px;'></p>" +							
							"<p id='" + this.sliderpane.id + "breakwaterId' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "revetId' style='display:none; margin-bottom:0px;'></p>" +							
							"<p id='" + this.sliderpane.id + "beachId' style='display:none; margin-bottom:0px;'></p>" +
							"<p id='" + this.sliderpane.id + "totaltId' style='display:none; margin-bottom:0px;'></p>" 
					
					this.idenWin = new ContentPane({
					  id: this.b,
					  style:"display:none; z-index:8; position:absolute; right:105px; width:340px; top:60px; background-color:#FFF; border-style:solid; border-width:4px; border-color:#444; border-radius:5px;",
					  innerHTML: "<div class='tabareacloser' style='float:right !important;'><a href='#' style='color:#cecfce'>✖</a></div><div id='" + this.sliderpane.id + "tabHeader' style='background-color:#424542; color:#fff; height:28px; font-size:1em; font-weight:bold; padding:8px 0px 0px 10px; cursor:move;'>Which shoreline enhancement techniques apply here</div>" +	
						"<div id='" + this.sliderpane.id + "idContent' class='idDiv'>" +
						  "<div id='" + this.sliderpane.id + "idResults' style='display:none; class='idResults'>" +
						  "</div>" +
						"</div>" 		
					});
							
					dom.byId(a[0]).appendChild(this.idenWin.domNode)
					
					ta = dojoquery(this.idenWin.domNode).children(".tabareacloser");
						this.idenWincloser = ta[0];
					/*
					tac = dojoquery(this.idenWin.domNode).children(".tabareacontent");
					this.idenWincontent = tac[0];
					*/				
					on(this.idenWincloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.idenWin.domNode, 'display', 'none');
						this.map.graphics.clear();
						$('#' + this.sliderpane.id + 'idResults').hide();
					}));					
					var p = new ConstrainedMoveable(
						dom.byId(this.idenWin.id), {
						handle: dom.byId(this.sliderpane.id + "tabHeader"),	
						within: true
					});
					
					this.idIntro = new ContentPane({
						id: this.sliderpane.id + 'idIntro',
						style: "display:none;position:absolute;right:40%;top:90px;width:380px;background-color:#FFF; border-style:solid; border-width:4px; border-color:#444; border-radius:5px;padding:10px;padding-top:20px;text-align:center;",
						innerHTML: "<div class='idIntroCloser' style='position:absolute;top:5px;right:5px;'><a href='#' style='color:#21658c'>✖</a></div>" +
								   "<div id='" + this.sliderpane.id + "idText' style='font-size:14pt;'></div>"
					});	
					dom.byId(a[0]).appendChild(this.idIntro.domNode)
					ii = dojoquery(this.idIntro.domNode).children(".idIntroCloser");
					this.idIntroCloser = ii[0];
					on(this.idIntroCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.idIntro.domNode, 'display', 'none');
					}));
					
					
					this.map.on ("extent-change", lang.hitch(this,function(e,x,b,l){	 
						this.l = e.lod.level	
						if (this.l < 18){
							this.pntSym.size = 10;
							this.highlightSymbol.size = 10;
							
						}
						if (this.l == 18){
							this.pntSym.size = 20;
							this.highlightSymbol.size = 20;
						}
						if (this.l == 19){
							this.pntSym.size = 42;
							this.highlightSymbol.size = 42;
						}	
						if (this.l > 16){
							$('#' + this.sliderpane.id + 'idIntro').hide();
						}
						
					}));				
					
					this.buttonpane = new ContentPane({
					  style:"border-top-style:groove !important; height:80px;overflow: hidden !important;background-color:#F3F3F3 !important;padding-top:5px !important;"
					});
					dom.byId(this.container).appendChild(this.buttonpane.domNode);	
					/*if (this.config.methods != undefined) {
						methodsButton = new Button({
							label: "Methods",
							style:  "float:right !important; margin-right:-7px !important; margin-top:-7px !important;",
							onClick: lang.hitch(this,function(){window.open(this.config.methods)})  //function(){window.open(this.config.methods)}
							});	
						this.buttonpane.domNode.appendChild(methodsButton.domNode);
					}*/
					moreInfo = domConstruct.create("div",{
						id: this.sliderpane.id + "moreInfo",
						style: "text-align:center;"
					});
					this.buttonpane.domNode.appendChild(moreInfo);		
					menu = new DropDownMenu({ 
						style: "display: none;",
						maxHeight: "150"
					});
					domClass.add(menu.domNode, "claro");
					//infos = ["Community Guide","Methods","User Guide"]
					infos = ["Methods","User Guide","Community Resource Guide"]
					var cl = infos.length - 1;
					array.forEach(infos, lang.hitch(this,function(v, j){
						if (j == cl){
							var sty = "border: 1px solid #d2e6f7; box-shadow: 1px 1px 1px #d2e6f7 !important;";
						}else{
							var sty = "border: 1px solid #d2e6f7; box-shadow: 1px 0px 1px #d2e6f7 !important;";
						}
						menuItem = new MenuItem({
							style: sty,
							label: v,
							onClick: lang.hitch(this,function(e) { 
								if (v == "Methods"){
									window.open(this.config.methods)
								}
								if (v == "User Guide"){
									window.open(this.config.userGuide)
								}
								if (v == "Community Resource Guide"){
									window.open(this.config.comResourceGuide)
								}
							})												
						});
						menu.addChild(menuItem);
					}));
					this.miButton = new DropDownButton({
						label: "Project Information",
						style: "margin-bottom:6px !important;",
						maxHeight: "150",
						dropDown: menu
					});
					
					dojo.byId(this.sliderpane.id + "moreInfo").appendChild(this.miButton.domNode);
					


										
					
					nslidernode = domConstruct.create("div", {});
					this.buttonpane.domNode.appendChild(nslidernode); 
					labelsnode = domConstruct.create("ol", {
						"data-dojo-type":"dijit/form/HorizontalRuleLabels", 
						container:"bottomDecoration", 
						style:"height:0.25em;padding-top: 7px !important;color:black !important", 
						innerHTML: "<li>Opaque</li><li>Transparent</li>"
					})
					nslidernode.appendChild(labelsnode);
					slider = new HorizontalSlider({
						value: 0,
						minimum: 0,
						maximum: 1,
						showButtons:false,
						title: "Change the layer transparency",
						//intermediateChanges: true,
						//discreteValues: entry.options.length,
						onChange: lang.hitch(this,this.changeOpacity),
						style: "width:150px; position:absolute; left:60px; bottom:20px; background-color:#F3F3F3 !important"
					}, nslidernode);
					parser.parse()
					
					array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
						if (entry.type == "group") {		
							if ( entry.control == "dropdown" ) {
								$(document.body).css({ 'cursor': 'wait' })
								this.map.setMapCursor("wait");
								ddHolder = domConstruct.create("div",{
									id: this.sliderpane.id + "buttonDiv"
								});
								this.sliderpane.domNode.appendChild(ddHolder);
								dd1Holder = domConstruct.create("div",{
									id: this.sliderpane.id + "button1Div"
								});
								this.sliderpane.domNode.appendChild(dd1Holder);
								munSum = domConstruct.create("div",{
									id: this.sliderpane.id + "munSum",
									style: "margin-left:8px; margin-bottom:10px; display:none;",
									innerHTML: "<a id='" + this.sliderpane.id + "munSumLink' class='munSum' href='' target='_blank'>View Municipal Summary</a>"
								});
								this.sliderpane.domNode.appendChild(munSum);
								this.field = entry.field;
								this.field1 = entry.field1;
								this.ln = entry.layerNumber;
								this.countyFL = new FeatureLayer(this.config.url + "/" + this.ln, { mode: esri.layers.FeatureLayer.MODE_SELECTION, outFields: "*"});
								dojo.connect(this.countyFL, "onSelectionComplete", lang.hitch(this,function(features){
									this.addFirstDropdown(features, groupid);
								}));
								var selectCounties = new esriQuery();
								selectCounties.where = this.field + " Like '%'";
								this.countyFL.selectFeatures(selectCounties, FeatureLayer.SELECTION_NEW); 
								this.munFL = new FeatureLayer(this.config.url + "/" + this.ln, { mode: esri.layers.FeatureLayer.MODE_SELECTION, outFields: "*"});
								dojo.connect(this.munFL, "onSelectionComplete", lang.hitch(this,function(f){
									this.zoomToSel(f);
								}));
								this.munFL.setSelectionSymbol(this.sfs);
								this.map.addLayer(this.munFL);
								if (this.controls[groupid].selectedMun != ""){
									var selectMun = new esriQuery();
									selectMun.where = this.field  + " = '" + this.controls[groupid].selectedCounty + "' AND " + this.field1 + " = '" + this.controls[groupid].selectedMun + "'";
									this.munFL.selectFeatures(selectMun, FeatureLayer.SELECTION_NEW); 
								}
								
							}
							if (entry.header != undefined){
								// Add header text and info icon
								if (entry.header[0].headerLevel == "main"){
									hhtml = "<b>" + entry.header[0].text + " </b>"
									mar = "margin-left:0px;"
									mar1 = "margin-left:10px;"
								}
								if (entry.header[0].headerLevel == "sub"){
									hhtml = "<hr style='background-color: #4a96de; height:1px; border:0; margin-top:-7px; margin-bottom:7px;" + 
									"background-image: -webkit-linear-gradient(left, #ccc, #4a96de, #ccc);background-image: -moz-linear-gradient(left, #ccc, #4a96de, #ccc);" + 
									"background-image: -ms-linear-gradient(left, #ccc, #4a96de, #ccc); background-image: -o-linear-gradient(left, #ccc, #4a96de, #ccc);'>" + entry.header[0].text + ": "
									mar = "margin-left:15px;"
									mar1 = "margin-left:10px;"
								}
								nslidernodeheader = domConstruct.create("div", {
									id: this.sliderpane.id + "_" + groupid, 
									style:"display:" + entry.display + ';' + mar, 
									innerHTML: hhtml
								});
								this.sliderpane.domNode.appendChild(nslidernodeheader);	
								infoPic = domConstruct.create("a", {
									style: "color:black;",
									href: "#",
									title: "Click for more information",
									innerHTML: "<img src='data:image/png;base64,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'>"
								})
								if (entry.header[0].helpTitle != ""){
									nslidernodeheader.appendChild(infoPic);
								}
								on(infoPic, "click", lang.hitch(this,function(e){
									domStyle.set(this.infoarea.domNode, 'display', 'block');
									this.config.infoDisplay = "block";
									this.infoareacontent.innerHTML = "<b>" + entry.header[0].helpTitle + "</b><div style='height:8px'></div><div style='max-width:300px; max-height:530px;'>" + entry.header[0].helpText + "</div>";
									this.config.infoContent = this.infoareacontent.innerHTML
								}));
							}
			
							if ( entry.control == "radio" ) {
								ncontrolsnode = domConstruct.create("div", {
									id: this.sliderpane.id + entry.header[0].name + "_" + groupid,
									style: "margin-top:5px;margin-left:10px;"
								});
								nslidernodeheader.appendChild(ncontrolsnode);
								rlen = entry.options.length - 1;
								array.forEach(entry.options, lang.hitch(this,function(option, i){
									rorc = RadioButton;
									ncontrolnode = domConstruct.create("div");
									ncontrolsnode.appendChild(ncontrolnode); 
									parser.parse();
									ncontrol = new rorc({
										name: this.map.id + groupid,
										id: this.sliderpane.id + "_radio_" + groupid + "_" + i,
										value: option.value,
										index: this.map.id + groupid,
										title: option.text,
										checked: option.selected,
										onClick: lang.hitch(this,function(e) { 
											if(e) {
												this.radioClick(i, groupid, option.text);
											}
										})
									}, ncontrolnode);	
									if (rlen == i){	
										if (option.helpText != undefined){
											var htbr = "";
											var picbr = "<br><br>";
										}else{
											var htbr = "<br><br>";
										}	
										inhtml = "<span style='color:#000;' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text + "</span>" + htbr
									}else{
										if (option.helpText != undefined){
											var htbr = "";
											var picbr = "<br>";
										}else{
											var htbr = "<br>";
										}
										inhtml = "<span style='color:#000;' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text + "</span>"  + htbr
									}
									nslidernodeheader = domConstruct.create("div", {
										style:"display:inline;", 
										innerHTML: inhtml
									});									
									ncontrolsnode.appendChild(nslidernodeheader);
									
									infoPic = domConstruct.create("a", {
										style: "color:black;margin-left:3px !important;",
										href: "#",
										title: "Click for more information",
										innerHTML: "<img src='data:image/png;base64,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'>" + picbr
									})
									if (option.helpText != undefined){
										nslidernodeheader.appendChild(infoPic);
									}
									on(infoPic, "click", lang.hitch(this,function(e){
										domStyle.set(this.infopic.domNode, 'display', 'block');
										this.config.infoPicDisplay = "block";
										this.infoPicContent.innerHTML = "<img alt='infoPic' src='plugins/restoration-explorer/images/" + option.helpText + ".jpg'>";
										this.config.infoPicContent = this.infoPicContent.innerHTML;
									}));
									
									parser.parse()	
								})); 
							}
							
							if ( entry.control == "checkbox" ) {
								ncontrolsnode = domConstruct.create("div", {
									id: this.sliderpane.id + entry.header[0].name + "_" + groupid,
									style: "margin-top:5px;" + mar1
								});
								nslidernodeheader.appendChild(ncontrolsnode);
								rlen = entry.options.length - 1;
								array.forEach(entry.options, lang.hitch(this,function(option, i){
									ncontrolnode = domConstruct.create("div");
									ncontrolsnode.appendChild(ncontrolnode); 
									parser.parse();
									var sty = "";
									if (option.leaveOn != undefined){
										sty = "margin-left:-10px;"
									}else{
										sty = "margin-left:10px;"	
									}	
									ncontrol = new CheckBox({
										name: this.map.id + groupid,
										id: this.sliderpane.id + "_radio_" + groupid + "_" + i,
										value: option.value,
										title: option.text,
										style: sty,
										checked: option.selected,
										onClick: lang.hitch(this,function(e) { 
											this.cbClick(option.layerNumber, e, i, groupid);
										})
									}, ncontrolnode);
									
									if (i == 0){
										ihtml = "<span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'>" + option.text + "</span><br>"
									}else{
										if (rlen == i){
											ihtml = "<span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'><a class='epa'>" + option.text + "</a></span><br><br>"
										}else{
											ihtml = "<span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'><a class='epa'>" + option.text + "</a></span><br>"
										}
									}
									nslidernodeheader = domConstruct.create("div", {
										style:"display:inline;", 
										innerHTML: ihtml
									});									
									ncontrolsnode.appendChild(nslidernodeheader); 
									
									on(nslidernodeheader, "click", lang.hitch(this,function(e){
										if (option.helpTable != undefined){
											domStyle.set(this.infoarea.domNode, 'display', 'block');
											this.config.infoDisplay = "block";
											this.infoareacontent.innerHTML = "<p style='font-weight:bold;margin-top:10px;margin-left:0px;margin-bottom:0px;text-align:center;'>How each restoration technique meets the " + option.text + " condition</p><table id='" + this.sliderpane.id + "_infoTable' class='tbl'><thead><tr></tr></thead><tbody class='tbodyc'></tbody></table>"
											
											var tblid = this.sliderpane.id + '_infoTable'
											var naPresent = "no"
											$.each(this.config[option.helpTable], function(i, v){
												$.each(v, function(key, valArray){
													if (key == "header"){
														$.each(valArray, function(i2, hval){
															$('#' + tblid + ' thead tr').append("<th class='tbl thc'>" + hval + "</th>")
														});			
													}
													else{
														var tbl = "";
														$.each(valArray, function(i3, rval){
															var sty = "black; font-weight:bold; text-align:left;"
															if (rval == "Yes"){
																sty = "green;"
															}
															if (rval == "No"){
																sty = "red;"
															}
															if (rval == "NA*"){
																sty = "black;"
																naPresent = "yes"
															}
															tbl = tbl + "<td class='tbl tdc' style='color:" + sty + "'>" + rval + "</td>"
														})
														$('#' + tblid + ' tbody').append("<tr>" + tbl + "</tr>")
													}
												});
											});
											if (naPresent == "yes"){
												this.infoareacontent.innerHTML = this.infoareacontent.innerHTML + "<br><div style='width:468px; font-size:11px; margin-left:10px; '>*NA signifies that this environmental parameter is either not applicable for this technique or when a particular parameter value range is not applicable.  Where NA occurs, it is treated as a YES in determining the number of environmental conditions that have been satisfied.</div>"
											}
											this.config.infoContent = this.infoareacontent.innerHTML
										}	
									}));
									parser.parse()	
								})); 
							}
							
							nslidernodeheader = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernodeheader);
						}						
						ncontrolsnode = domConstruct.create("div");
						this.sliderpane.domNode.appendChild(ncontrolsnode);
					}));
					this.currentLayer = new ArcGISDynamicMapServiceLayer(this.config.url);
					this.map.addLayer(this.currentLayer);
					if (this.config.visibleLayers != []){						
						this.currentLayer.setVisibleLayers(this.config.visibleLayers);
					}
					if (this.config.extent != ""){
						this.extentCheck = "first";
						var extent = new Extent(this.config.extent.xmin, this.config.extent.ymin, this.config.extent.xmax, this.config.extent.ymax, new SpatialReference({ wkid:4326 }))
						this.map.setExtent(extent, true);
						this.config.extent = "";
					}else{
						this.extentCheck = "second"	
					}
					if (this.config.munCheck != ""){
						this.munCheck = "second"			
					}else{
						this.munCheck = "first"
					}		
					if (this.config.atts != ""){
					/*	$('#' + this.sliderpane.id + 'idResults').empty();
						$('#' + this.sliderpane.id + 'idResults').append(this.config.idenHTML);
						$('#' + this.b).show();
						$('#' + this.sliderpane.id + 'idIntro').hide();
						$('#' + this.sliderpane.id + 'idResults').show();
					*/	this.identifyFeatures(this.config.idenVal, this.config.idenGroup);
						this.showAttributes(this.config.atts, this.config.idenType);
					}	
					if (this.config.idenVal != ""){
						this.identifyFeatures(this.config.idenVal, this.config.idenGroup);
					}		
					if (this.config.idenGraphic != ""){
						var pt = new Point(this.config.idenGraphic.x,this.config.idenGraphic.y,this.map.spatialReference)
						this.selectedGraphic = new Graphic(pt,this.pntSym);
						this.map.graphics.add(this.selectedGraphic);
					}	
					var e = dojo.query(".epa1")
					on(e, "click", lang.hitch(this,function(e){
						domStyle.set(this.infopic.domNode, 'display', 'block');
						this.config.infoPicDisplay = "block";
						if (e.target.innerHTML == "Nature-Based Living Shoreline"){ht = "NBLS"}	
						if (e.target.innerHTML == "Living Reef Breakwater"){ht = "LivingReef"}	
						if (e.target.innerHTML == "Marsh Sill"){ht = "MarshSill"}	
						if (e.target.innerHTML == "Breakwater"){ht = "Breakwater"}	
						if (e.target.innerHTML == "Ecologically Enhanced Revetment"){ht = "EcoRevetment"}	
						if (e.target.innerHTML == "Beach Restoration"){ht = "BeachRestoration"}	
						this.infoPicContent.innerHTML = "<img alt='infoPic' src='plugins/restoration-explorer/images/" + ht + ".jpg'>";	
						this.config.infoPicContent = this.infoPicContent.innerHTML;				
					}));					
					this.resize();
				},
				
				addFirstDropdown: function(c, groupid){
					var f = this.field;
					var f1 = this.field1;
		
					var c1 = c;
					var county = [];
					for(var i = 0; i < c.length; i++) {
						county.push(c[i].attributes[this.field]);
					}
					var countyDD = unique(county).sort();
					
					menu = new DropDownMenu({ 
						style: "display: none;",
						maxHeight: "150"
					});
					domClass.add(menu.domNode, "claro");
					
					this.button = new DropDownButton({
						label: "Choose a County",
						style: "margin-bottom:6px !important;",
						maxHeight: "150",
						dropDown: menu
					});
					
					dojo.byId(this.sliderpane.id + "buttonDiv").appendChild(this.button.domNode);
					
					this.menu1 = new DropDownMenu({ 
						style: "display: none;",
						maxHeight: "150"							
					});
					domClass.add(this.menu1.domNode, "claro");
					
					this.button1 = new DropDownButton({
						label: "Choose a Municipality",
						style: "margin-bottom:12px !important;",
						maxHeight: "150",
						disabled: "disabled",
						dropDown: this.menu1
					});
					
					dojo.byId(this.sliderpane.id + "button1Div").appendChild(this.button1.domNode);
					
					
					var cl = countyDD.length - 1;
					array.forEach(countyDD, lang.hitch(this,function(v, j){
						if (j == cl){
							var sty = "border: 1px solid #d2e6f7; box-shadow: 1px 1px 1px #d2e6f7 !important;";
						}else{
							var sty = "border: 1px solid #d2e6f7; box-shadow: 1px 0px 1px #d2e6f7 !important;";
						}
						menuItem = new MenuItem({
							style: sty,
							label: v,
							onClick: lang.hitch(this,function(e) { 
								$('#' + this.sliderpane.id + "munSum").hide()

								var mun = [];
								for(var i = 0; i < c1.length; i++) {
									if (v == c1[i].attributes[f]){
										mun.push(c1[i].attributes[f1])
									}
								}
								dojo.byId(this.button).set("label", v + " County")
								dojo.byId(this.button1).set("label", "Choose a Municipality")
								this.updateDD(mun, v, groupid);	
								this.controls[groupid].selectedCounty = v;
								this.controls[groupid].municipalities = mun;
							})												
						});
						menu.addChild(menuItem);
					}));
					
					if (this.controls[groupid].selectedCounty != ""){
						dojo.byId(this.button).set("label", this.controls[groupid].selectedCounty + " County")
						this.updateDD(this.controls[groupid].municipalities, this.controls[groupid].selectedCounty, groupid)
					}
					$(document.body).css({ 'cursor': 'default' })
					this.map.setMapCursor("default");
					//$('#' + this.sliderpane.id + '_1').show()
				},
				
				updateDD: function(mun, v, groupid){
					$('#' + this.sliderpane.id + 'button1Div').show();
					dojo.byId(this.button1).set("label", "Choose a Municipality")
					dojo.byId(this.button1).setAttribute('disabled', false);
					this.menu1.destroyDescendants();
					mun.sort()
					array.forEach(mun, lang.hitch(this,function(m){
						menuItem1 = new MenuItem({
							style: "border: 1px solid #d2e6f7;",
							label: m,
							onClick: lang.hitch(this,function(){
								var selectMun = new esriQuery();
								selectMun.where = this.field  + " = '" + v + "' AND " + this.field1 + " = '" + m + "'";
								this.munFL.selectFeatures(selectMun, FeatureLayer.SELECTION_NEW); 
								dojo.byId(this.button1).set("label", m);
								this.controls[groupid].selectedMun = m;
								this.extentCheck = "second"
								ga('send', 'event', 'NJ Restoration Explorer', 'municipal click', v + ' County - ' + m);
							})
						});
						this.menu1.addChild(menuItem1);
					}));
					if (this.controls[groupid].selectedMun != ""){
						dojo.byId(this.button1).set("label", this.controls[groupid].selectedMun);
					}
				},
				
				zoomToSel: function(f) { 	
					this.munName = f[0].attributes.MUN;
					this.shorelineMiles = f[0].attributes.TotalShorelineMiles;
					if (this.extentCheck == "first"){	
						this.extentCheck = "second"
					}else{
						var munExtent = f[0].geometry.getExtent();				
						this.map.setExtent(munExtent, true); 
					}
					if(this.munCheck == "first"){
						this.munCheck = "second";
						this.config.munCheck = "second"
					}else{
						this.map.graphics.clear();
						if (this.config.techName != ""){
							var slmHtml = ""
							if (this.config.techName == "Show All Techniques in One Map"){
								slmHtml = "<b>" + this.munName + "</b> has " + this.shorelineMiles + " miles of shoreline. Zoom in to see which shoreline enhancement techniques apply here."
							}else{
								slmHtml = "<b>" + this.munName + "</b> has " + this.shorelineMiles + " miles of shoreline. Zoom in to see if the <b>" + $(this.config.techName).html() + "</b> enhancement technique applies here."
							}	
							$('#' + this.sliderpane.id + 'idText').html(slmHtml)
							$('#' + this.sliderpane.id + 'idIntro').show();		
						}
					}		
					var url = "http://www.njfloodmapper.org/snapshot/#/process?action=tncre&mun_code=" + f[0].attributes.MUN_CODE
					$('#' + this.sliderpane.id + "munSumLink").attr("href", url)
					$('#' + this.sliderpane.id + "munSum").show()
					$('#' + this.sliderpane.id + '_1').show();
					domStyle.set(this.idenWin.domNode, 'display', 'none');
				},
				
				radioClick: function(val,group, tech) {
					$('#' + this.sliderpane.id + 'idResults').hide();
					if (this.featureLayer != undefined){
						this.map.removeLayer(this.featureLayer);
					}
					//set all radio buttons in group to false
					var reChanges = [];
					array.forEach(this.controls[group].options, lang.hitch(this,function(option, i){
						option.selected = false;
						for (var i = this.changes.radio.length - 1; i >= 0; i--) {
							var f = this.changes.radio[i].split("_")
							if(f[0] == "s" && f[1] >= group){
								this.changes.radio.splice(i,1)
							}	
						}	
					}));
					this.changes.radio.push("s_" + group + "_" + val)
					//check if show data level
					if (this.controls[group].options[val].showData == "no"){
						$('#' + this.sliderpane.id + 'idIntro').hide();
						this.config.visibleLayers = [];	
						this.currentLayer.setVisibleLayers(this.config.visibleLayers);
						$('#' + this.b).hide();
						this.map.graphics.clear();
						if (this.featureLayerOD != undefined){
							this.map.removeLayer(this.featureLayerOD);			
						}
						this.config.idenVal = "";
						this.config.idenGroup = "";
						this.config.idenType = "";
						this.config.atts = "";
					}
					if (this.controls[group].options[val].showData == "yes"){
						this.config.techName = tech; 
						var slmHtml = ""
						if (this.config.techName == "Show All Techniques in One Map"){
							slmHtml = "<b>" + this.munName + "</b> has " + this.shorelineMiles + " miles of shoreline. Zoom in to see which shoreline enhancement techniques apply here."
						}else{
							slmHtml = "<b>" + this.munName + "</b> has " + this.shorelineMiles + " miles of shoreline. Zoom in to see if the <b>" + $(this.config.techName).html() + "</b> enhancement technique applies here."
						}	
						$('#' + this.sliderpane.id + 'idText').html(slmHtml)
						
						var l = this.map.getLevel()
						if (l < 17){
							$('#' + this.sliderpane.id + 'idIntro').show();
						}
						var selectedLayer = this.controls[group].options[val].layerNumber

						// add newly selected layer to visible layer array
						this.config.visibleLayers = [];	
						this.config.visibleLayers.push(selectedLayer);
						this.currentLayer.setVisibleLayers(this.config.visibleLayers);
						
						// set up identify functionality
						this.identifyFeatures(val, group);
						$('#' + this.b).hide();
					}
					if (this.controls[group].options[val].groupsBelow == "yes"){
						//get value and current level
						this.value = this.controls[group].options[val].value;
						this.level = this.controls[group].level;
						this.childlevel = 99;
						// use parentValue to find child level - clear selections on level greater than clicked level
						array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
							if (entry.parentValue == this.value){
								this.childlevel = entry.level;
							}
							if (entry.level > this.level){
								array.forEach(entry.options, lang.hitch(this,function(option, i){
									if (option.leaveOn === undefined){
										option.selected = false;
										dijit.byId(this.sliderpane.id + "_radio_" + groupid + "_" + i).set('checked', false);
									}
								}));
							}
						}));
						// show groups where value and level match. hide groups that match levels but not parent
						array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
							if (entry.level == this.childlevel && entry.parentValue != this.value){
								$('#' + this.sliderpane.id + "_" + groupid).hide();
								this.controls[groupid].display = "none";
								for (var i = this.changes.radio.length - 1; i >= 0; i--) {
									var f = this.changes.radio[i].split("_")
									if(f[0] == "d" && f[1] == groupid){
										this.changes.radio.splice(i,1)
									}	
								}
							}
							if (entry.level > this.childlevel){
								$('#' + this.sliderpane.id + "_" + groupid).hide();
								this.controls[groupid].display = "none";
								for (var i = this.changes.radio.length - 1; i >= 0; i--) {
									var f = this.changes.radio[i].split("_")
									if(f[0] == "d" && f[1] == groupid){
										this.changes.radio.splice(i,1)
									}	
								}
							}
						}));
						array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
							if (entry.level == this.childlevel && entry.parentValue == this.value){
								$('#' + this.sliderpane.id + "_" + groupid).show('slow');
								this.controls[groupid].display = "block";
								this.changes.radio.push("d_" + groupid)
							}
						}));
					}
				},
				
				cbClick: function(lyrnum, e, val, group) {
					if (e.target.checked == true){
						this.config.visibleLayers.push(lyrnum);
						this.config.visibleLayers = unique(this.config.visibleLayers)
						//this.identifyFeatures(val, group);
						this.changes.radio.push("c_" + group + "_" + val)
					}else{
						var index = this.config.visibleLayers.indexOf(lyrnum)
						this.config.visibleLayers.splice(index, 1);
						this.config.idenVal = "";
						this.config.idenGroup = "";
						for (var i = this.changes.radio.length - 1; i >= 0; i--) {
							var f = this.changes.radio[i].split("_")
							if(f[0] == "c" && f[1] == group && f[2] == val){
								this.changes.radio.splice(i,1)
							}	
						}
					}
					this.currentLayer.setVisibleLayers(this.config.visibleLayers);
					
				},
				
				identifyFeatures: function(val, group){
					if (this.controls[group].options[val].identifyNumber != ""){
						this.config.idenVal = val;
						this.config.idenGroup = group;
						var idenType = this.controls[group].options[val].identifyGroup;
						this.config.idenType = idenType;
						if (this.featureLayerOD != undefined){
							this.map.removeLayer(this.featureLayerOD);			
						}
						//$('#' + this.b).show();
						idLyrNum = "/" + this.controls[group].options[val].identifyNumber;	
						this.featureLayerOD = new FeatureLayer(this.config.url + idLyrNum, {
							mode: esri.layers.FeatureLayer.ONDEMAND,
							opacity: "0",
							outFields: "*"
						});
						this.featureLayerOD.setRenderer(new SimpleRenderer(this.pntSym));
	
						// call function to capture and display selected feature layer attributes
						
						this.featureLayerOD.on("mouse-over", lang.hitch(this,function(evt){
							this.map.setMapCursor("pointer");
						//	this.highlightGraphic = new Graphic(evt.graphic.geometry,this.highlightSymbol);
						//	this.map.graphics.add(this.highlightGraphic);
						}));
						this.featureLayerOD.on("mouse-out", lang.hitch(this,function(evt){
							this.map.setMapCursor("default");
						//	this.map.graphics.remove(this.highlightGraphic);
						}));
						this.featureLayerOD.on("mouse-down", lang.hitch(this,function(evt){
							atts = evt.graphic.attributes;
							this.config.atts = atts;
							this.showAttributes(atts, idenType);
							this.map.graphics.clear();
							this.selectedGraphic = new Graphic(evt.graphic.geometry,this.pntSym);
							this.config.idenGraphic = evt.graphic.geometry;
							this.map.graphics.add(this.selectedGraphic);
						}));
						this.map.addLayer(this.featureLayerOD);
					}else{
						$('#' + this.b).hide();
						this.map.graphics.clear();
						if (this.featureLayerOD != undefined){
							this.map.removeLayer(this.featureLayerOD);
							this.config.idenGraphic = "";							
						}
						this.config.idenType = "";
						this.config.idenVal = "";
						this.config.idenGroup = "";
						this.config.atts = "";
					}
				},
				
				showAttributes: function(atts, idenType) {
					
					$('#' + this.sliderpane.id + 'idResults').empty();
					if (idenType == 2){
						$('#' + this.sliderpane.id + 'idResults').append(this.iden2Html);
						$('#' + this.b).show();
						$('#' + this.sliderpane.id + 'idIntro').hide();
						$('#' + this.sliderpane.id + 'idResults').show();
						$('#' + this.sliderpane.id + 'tabHeader').html("Which Environmental Conditions are Met in this Area?") 
						$('#' + this.sliderpane.id + 'techTitle').html($(this.config.techName).html());
						$('#' + this.sliderpane.id + 'techTitle').show();
						if (atts.ErosionCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'erosion').html('Shoreline Change Rate: <b>Not Appilcable</b>').show();
						}
						if (atts.ErosionCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'erosion').html('Shoreline Change Rate: <b>No - ' +
							atts.ErosionCriteriaValue + ' feet/year</b>').show();
						}
						if (atts.ErosionCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'erosion').html('Shoreline Change Rate: <b>Yes - ' +
							atts.ErosionCriteriaValue + ' feet/year</b>').show();
						}
						if (atts.SalinityCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'salinity').html('Salinity: <b>Not Appilcable</b>').show();
						}
						if (atts.SalinityCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'salinity').html('Salinity: <b>No - ' + 
							Math.round(atts.SalinityCriteriaValue*10)/10 + ' ppt</b>').show();
						}
						if (atts.SalinityCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'salinity').html('Salinity: <b>Yes - ' + 
							Math.round(atts.SalinityCriteriaValue*10)/10 + ' ppt</b>').show();
						}
						if (atts.TidalRangeCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'tidal').html('Tidal Range: <b>Not Appilcable</b>').show();
						}
						if (atts.TidalRangeCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'tidal').html('Tidal Range: <b>No - ' + 
							Math.round(atts.TidalRangeCriteriaValue*10)/10 + ' feet</b>').show();
						}
						if (atts.TidalRangeCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'tidal').html('Tidal Range: <b>Yes - ' + 
							Math.round(atts.TidalRangeCriteriaValue*10)/10 + ' feet</b>').show();
						}
						if (atts.WaveHtMaxCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'wave').html('Wave Height: <b>Not Appilcable</b>').show();
						}
						if (atts.WaveHtMaxCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'wave').html('Wave Height: <b>No - ' + 
							Math.round(atts.WaveHtMaxCriteriaValue*10)/10 + ' feet</b>').show();
						}
						if (atts.WaveHtMaxCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'wave').html('Wave Height: <b>Yes - ' + 
							Math.round(atts.WaveHtMaxCriteriaValue*10)/10 + ' feet</b>').show();
						}
						if (atts.IceCoverCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'ice').html('Ice Cover: <b>Not Appilcable</b>').show();
						}
						if (Math.round(atts.IceCoverCriteriaValue) == "0"){this.icv = "None"}
						if (Math.round(atts.IceCoverCriteriaValue) == "2"){this.icv = "Low"}
						if (Math.round(atts.IceCoverCriteriaValue) == "4"){this.icv = "Moderate"}
						if (Math.round(atts.IceCoverCriteriaValue) == "6"){this.icv = "High"}
						if (Math.round(atts.IceCoverCriteriaValue) == "8"){this.icv = "Higher"}
						if (Math.round(atts.IceCoverCriteriaValue) == "10"){this.icv = "Highest"}
						if (atts.IceCoverCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'ice').html('Ice Cover: <b>No - ' + 
							this.icv + '</b>').show();
						}
						if (atts.IceCoverCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'ice').html('Ice Cover: <b>Yes - ' + 
							this.icv + '</b>').show();
						}
						if (atts.ShorelineSlopeCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'shoreline').html('Shoreline Slope: <b>Not Appilcable</b>').show();
						}
						if (atts.ShorelineSlopeCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'shoreline').html('Shoreline Slope: <b>No - ' +
							Math.round(atts.ShorelineSlopeCriteriaValue*10)/10 + '%</b>').show();
						}
						if (atts.ShorelineSlopeCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'shoreline').html('Shoreline Slope: <b>Yes - ' +
							Math.round(atts.ShorelineSlopeCriteriaValue*10)/10 + '%</b>').show();
						}
						if (atts.NearshoreSlopeCriteriaThreshold == 0){
							$('#' + this.sliderpane.id + 'nearshore').html('Nearshore Slope: <b>Not Appilcable</b>').show();
						}
						if (atts.NearshoreSlopeCriteriaThreshold == 1){
							$('#' + this.sliderpane.id + 'nearshore').html('Nearshore Slope: <b>No - ' +
							Math.round(atts.NearshoreSlopeCriteriaValue*10)/10 + '%</b>').show();
						}
						if (atts.NearshoreSlopeCriteriaThreshold == 2){
							$('#' + this.sliderpane.id + 'nearshore').html('Nearshore Slope: <b>Yes - ' +
							Math.round(atts.NearshoreSlopeCriteriaValue*10)/10 + '%</b>').show();
						}
						$('#' + this.sliderpane.id + 'totalc').html('Total Conditions Satisfied: <b>' + atts.TotalCriteriaSatisfied + '</b>').show();
					}
					if (idenType == 1){
						$('#' + this.sliderpane.id + 'idResults').append(this.iden1Html);
						$('#' + this.b).show();
						$('#' + this.sliderpane.id + 'idIntro').hide();
						$('#' + this.sliderpane.id + 'idResults').show();
						$('#' + this.sliderpane.id + 'tabHeader').html("Which Shoreline Enhancement Techniques Apply Here?") 
						if (atts.NBLSThreshold == 0){
							$('#' + this.sliderpane.id + 'nblsId').html('<a class="epa1">Nature-Based Living Shoreline</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.NBLSThreshold == 1){
							$('#' + this.sliderpane.id + 'nblsId').html('<a class="epa1">Nature-Based Living Shoreline</a>: <b>No - ' + atts.NBLSParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.NBLSThreshold == 2){
							$('#' + this.sliderpane.id + 'nblsId').html('<a class="epa1">Nature-Based Living Shoreline</a>: <b>Yes - ' + atts.NBLSParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.LivingReefThreshold == 0){
							$('#' + this.sliderpane.id + 'lreefId').html('<a class="epa1">Living Reef Breakwater</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.LivingReefThreshold == 1){
							$('#' + this.sliderpane.id + 'lreefId').html('<a class="epa1">Living Reef Breakwater</a>: <b>No - ' + atts.LivingReefParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.LivingReefThreshold == 2){
							$('#' + this.sliderpane.id + 'lreefId').html('<a class="epa1">Living Reef Breakwater</a>: <b>Yes - ' + atts.LivingReefParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.SillThreshold == 0){
							$('#' + this.sliderpane.id + 'msillId').html('<a class="epa1">Marsh Sill</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.SillThreshold == 1){
							$('#' + this.sliderpane.id + 'msillId').html('<a class="epa1">Marsh Sill</a>: <b>No - ' + atts.SillParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.SillThreshold == 2){
							$('#' + this.sliderpane.id + 'msillId').html('<a class="epa1">Marsh Sill</a>: <b>Yes - ' + atts.SillParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.BreakwaterThreshold == 0){
							$('#' + this.sliderpane.id + 'breakwaterId').html('<a class="epa1">Breakwater</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.BreakwaterThreshold == 1){
							$('#' + this.sliderpane.id + 'breakwaterId').html('<a class="epa1">Breakwater</a>: <b>No - ' + atts.BreakwaterParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.BreakwaterThreshold == 2){
							$('#' + this.sliderpane.id + 'breakwaterId').html('<a class="epa1">Breakwater</a>: <b>Yes - ' + atts.BreakwaterParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.RevetmentThreshold == 0){
							$('#' + this.sliderpane.id + 'revetId').html('<a class="epa1">Ecologically Enhanced Revetment</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.RevetmentThreshold == 1){
							$('#' + this.sliderpane.id + 'revetId').html('<a class="epa1">Ecologically Enhanced Revetment</a>: <b>No - ' + atts.RevetmentParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.RevetmentThreshold == 2){
							$('#' + this.sliderpane.id + 'revetId').html('<a class="epa1">Ecologically Enhanced Revetment</a>: <b>Yes - ' + atts.RevetmentParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.BeachThreshold == 0){
							$('#' + this.sliderpane.id + 'beachId').html('<a class="epa1">Beach Restoration</a>: <b>Not Applicable/Not Used</b>').show();
						}
						if (atts.BeachThreshold == 1){
							$('#' + this.sliderpane.id + 'beachId').html('<a class="epa1">Beach Restoration</a>: <b>No - ' + atts.BeachParametersMet + ' Parameters Met</b>').show();
						}
						if (atts.BeachThreshold == 2){
							$('#' + this.sliderpane.id + 'beachId').html('<a class="epa1">Beach Restoration</a>: <b>Yes - ' + atts.BeachParametersMet + ' Parameters Met</b>').show();
						}
						$('#' + this.sliderpane.id + 'totaltId').html('Total Techniques: <b>' + atts.TotalTechniques + '</b>').show();
					}
					var e = dojo.query(".epa1")
					on(e, "click", lang.hitch(this,function(e){
						domStyle.set(this.infopic.domNode, 'display', 'block');
						this.config.infoPicDisplay = "block";
						if (e.target.innerHTML == "Nature-Based Living Shoreline"){ht = "NBLS"}	
						if (e.target.innerHTML == "Living Reef Breakwater"){ht = "LivingReef"}	
						if (e.target.innerHTML == "Marsh Sill"){ht = "MarshSill"}	
						if (e.target.innerHTML == "Breakwater"){ht = "Breakwater"}	
						if (e.target.innerHTML == "Ecologically Enhanced Revetment"){ht = "EcoRevetment"}	
						if (e.target.innerHTML == "Beach Restoration"){ht = "BeachRestoration"}	
						this.infoPicContent.innerHTML = "<img alt='infoPic' src='plugins/restoration-explorer/images/" + ht + ".jpg'>";	
						this.config.infoPicContent = this.infoPicContent.innerHTML;				
					}));
				},
				
				updateInfoPic: function () {
					var picNames = ["NBLS", "LivingReef", "MarshSill", "Breakwater", "EcoRevetment", "BeachRestoration"]
					var picHtml = this.infoPicContent.innerHTML;
					var start_pos = picHtml.lastIndexOf('/') + 1;
					var end_pos = picHtml.indexOf('.',start_pos);
					var picName = picHtml.substring(start_pos,end_pos)
					var sp = 0;
					var pn = "";
					$.each(picNames, function(i,v){
						if (v == picName){
							sp = i;
						}
					})
					if (this.clickDirection == "left"){
						if (sp == 0){
							pn = picNames[5]	
						}else{
							pn = picNames[sp-1]	
						}
					}
					if (this.clickDirection == "right"){
						if (sp == 5){
							pn = picNames[0]	
						}else{
							pn = picNames[sp+1]	
						}
					}					
					this.infoPicContent.innerHTML = "<img alt='infoPic' src='plugins/restoration-explorer/images/" + pn + ".jpg'>";											
					this.config.infoPicContent = this.infoPicContent.innerHTML
				},
				
				getState: function () {
					this.changes.extent = this.map.geographicExtent;
					this.changes.visibleLayers = this.config.visibleLayers;	
					this.changes.idenGraphic = this.config.idenGraphic;
					this.changes.selectedCounty = this.controls[0].selectedCounty;
					this.changes.selectedMun = this.controls[0].selectedMun;
					this.changes.infoContent = this.config.infoContent;
					this.changes.infoDisplay = this.config.infoDisplay;
					this.changes.infoPicDisplay = this.config.infoPicDisplay;
					this.changes.infoPicContent = this.config.infoPicContent;
					console.log(this.changes.infoPicContent + " = "  + this.config.infoPicContent)
					var iden = dom.byId(this.sliderpane.id + 'idResults')
					var isVisible = iden.offsetWidth > 0 || iden.offsetHeight > 0;
					if (isVisible == true){
						this.changes.idenVal = this.config.idenVal;
						this.changes.idenGroup = this.config.idenGroup;
						this.changes.idenType = this.config.idenType;
						this.changes.atts = this.config.atts;
						this.changes.techName = this.config.techName;
					}		
					var state = new Object();
					state = this.changes;
					return state;
				},
				
				setState: function (state) { 
					this.config.extent = state.extent;
					this.config.visibleLayers = state.visibleLayers;
					this.config.idenGraphic = state.idenGraphic;
					this.controls[0].selectedCounty = state.selectedCounty;
					this.controls[0].selectedMun = state.selectedMun;
					this.config.infoContent = state.infoContent;
					this.config.infoDisplay = state.infoDisplay;
					this.config.infoPicDisplay = state.infoPicDisplay;
					this.config.infoPicContent = state.infoPicContent;
					this.config.idenVal = state.idenVal;
					this.config.idenGroup = state.idenGroup;
					this.config.idenType = state.idenType;
					this.config.atts = state.atts;
					this.config.techName = state.techName;
					for (var i = state.radio.length - 1; i >= 0; i--) {
						var f = state.radio[i].split("_")
						if(f[0] == "s"){
							this.controls[f[1]].options[f[2]].selected = true;	
							this.controls[f[1]].display = "block";
						}
						if(f[0] == "c"){
							this.controls[f[1]].options[f[2]].selected = true;	
						}	
						if(f[0] == "d"){
							this.controls[f[1]].display = "block";
						}						
					}					
				}
           });
       });	   
function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function unique(list) {
  var result = [];
  $.each(list, function(i, e) {
    if ($.inArray(e, result) == -1) result.push(e);
  });
  return result;
}
function remove_duplicates(objectsArray) {
    var usedObjects = {};
    for (var i=objectsArray.length - 1;i>=0;i--) {
        var so = JSON.stringify(objectsArray[i]);
        if (usedObjects[so]) {
            objectsArray.splice(i, 1);
        } else {
            usedObjects[so] = true;          
        }
    }
    return objectsArray;
}
