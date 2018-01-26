define([
	"dojo/_base/declare", "esri/tasks/query", "esri/tasks/QueryTask", "esri/graphicsUtils"
],
function ( declare, Query, QueryTask, graphicsUtils ) {
        "use strict";

        return declare(null, {
			eventListeners: function(t){
				t.county = "";
				t.atts = [];
				// counties select
				$("#" + t.id + "selectCounty").chosen({allow_single_deselect:false, width:"240px"})
					.change(function(c){
						t.county = c.target.value;
						$('#' + t.id + 'selectMuni').empty()
						$('#' + t.id + 'selectMuni').append("<option></option")
						var m = [];
						$.each(t.atts, function(i,v){
							if (v.COUNTY == t.county){
								m.push(v.MUN)
							}
						})
						var ms = m.sort();
						$.each(ms,function(i,v){
							$('#' + t.id + 'selectMuni').append("<option value='" + v + "'>" + v + "</option")	
						})
						$('#' + t.id + 'selectMuni').trigger("chosen:updated");
						$(c.target).parent().next().show()
					});
				// municipalities select
				$("#" + t.id + "selectMuni").chosen({allow_single_deselect:false, width:"240px"})
					.change(function(c){
						$(".ls-choice-wraps").hide()
						$(".ls-first-choice-wrap").css("display", "flex")
					})
				// first choice radios
				$("#" + t.id + "sl-type input").click(function(c){
					t.slType= c.currentTarget.value;
					$(".ls-choice-wraps").hide()
					$(".dis-pro").css("display", "flex")
					$("#" + t.id + "dis-pro input").prop("checked", false)
					$("#" + t.id + "view-results input:radio[name='techs']").prop("checked", false)
				})
				// second choice radios	
				$("#" + t.id + "dis-pro input").click(function(c){
					$(".ls-choice-wraps").hide()
					$(".dis-pro").css("display", "flex")
					$(".view-results").css("display", "flex")
					$(".ls-results-wrap").hide();
					$("#" + t.id + "view-results input:radio[name='techs']").prop("checked", false)
				})
				// third choice radios
				$("#" + t.id + "view-results input").click(function(c){
					t.viewResults = c.currentTarget.value;
					if (t.viewResults == "all-tech"){
						$("#" + t.id + "all-tech-info").slideDown();
						if (t.slType == "tidal-marsh"){
							// show tidal-marsh layer
						}
						if (t.slType == "forest-beach-bulk"){
							// show forest-beach-bulk layer
						}
					}
					if (t.viewResults == "ind-tech"){
						$("#" + t.id + "all-tech-info").slideUp();
						// show forth choice
					}
				})
			},
			clearInputs: function(t){

			}
        });
    }
);
