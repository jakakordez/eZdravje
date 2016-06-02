
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var meritve;
/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

var pacienti = [{}, {ime: "Janez", priimek: "Novak", datumRojstva: "1968-02-12T10:05", naslov: "Serbia", 
						meritve: [	{ datum: "1969-12-12T13:39", sistolicni: 129, diastolicni: 91},
									{ datum: "1980-02-12T15:18", sistolicni: 130, diastolicni: 92},
									{ datum: "1990-02-12T16:05", sistolicni: 129, diastolicni: 93},
									{ datum: "1991-02-12T17:29", sistolicni: 128, diastolicni: 94},
									{ datum: "1993-02-12T14:35", sistolicni: 130, diastolicni: 95},
									]},
                    {ime: "Mojca", priimek: "Kovač", datumRojstva: "1977-02-10T01:10", naslov: "Austria", 
						meritve: [	{ datum: "1978-03-11T05:15", sistolicni: 118, diastolicni: 95},
									{ datum: "1989-02-12T10:35", sistolicni: 120, diastolicni: 94},
									{ datum: "1999-02-12T10:54", sistolicni: 122, diastolicni: 93},
									{ datum: "2000-02-12T10:36", sistolicni: 121, diastolicni: 92},
									{ datum: "2012-02-12T10:48", sistolicni: 120, diastolicni: 91},
									]},
                    {ime: "Peter", priimek: "Kos", datumRojstva: "1966-03-05T22:28", naslov: "Turkey", 
						meritve: [	{ datum: "1969-12-12T13:39", sistolicni: 129, diastolicni: 91},
									{ datum: "1980-02-12T15:18", sistolicni: 130, diastolicni: 92},
									{ datum: "1990-02-12T16:05", sistolicni: 129, diastolicni: 93},
									{ datum: "1991-02-12T17:29", sistolicni: 128, diastolicni: 94},
									{ datum: "1993-02-12T14:35", sistolicni: 130, diastolicni: 95},
									]}];
/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta, callback) {
    var ehrId = "";
    var sessionId = getSessionId();
    var p = pacienti[stPacienta];
	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	$.ajax({
	    url: baseUrl + "/ehr",
	    type: 'POST',
	    success: function (data) {
	        ehrId = data.ehrId;
	        var partyData = {
	            firstNames: p.ime,
	            lastNames: p.priimek,
	            dateOfBirth: p.datumRojstva,
	            partyAdditionalInfo: [{key: "ehrId", value: ehrId}, {key: "address", value: p.naslov}]
	        };
	        
	        $.ajax({
	            url: baseUrl + "/demographics/party",
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify(partyData),
	            success: function (party) {
	                if (party.action == 'CREATE') {
	                	for(var i = 0; i < p.meritve.length; i++){
	                		var m = p.meritve[i];
		                	var podatki = {
							    "ctx/language": "en", "ctx/territory": "SI", "ctx/time": m.datum,
							    "vital_signs/blood_pressure/any_event/systolic": m.sistolicni,
							    "vital_signs/blood_pressure/any_event/diastolic": m.diastolicni
							};
							var parametriZahteve = {
							    ehrId: ehrId,
							    templateId: 'Vital Signs',
							    format: 'FLAT',
							    committer: ""
							};
							$.ajax({
							    url: baseUrl + "/composition?" + $.param(parametriZahteve),
							    type: 'POST',
							    contentType: 'application/json',
							    data: JSON.stringify(podatki),
							    success: function (res) {
							        //msg(res.meta.href);
							    },
							    error: function(err) {
							    	msg("Napaka '" + JSON.parse(err.responseText).userMessage + "'!", true);
							    }
							});
	                	}
	                    msg("EHR kreiran "+ehrId );
	                    callback(ehrId, p.ime+" "+p.priimek);
	                }
	            },
	            error: function(err) {
	            	msg("Napaka", true);
	            }
	        });
	    }
	});
}

function msg(message, danger = false){
    var m = $("#msg");
    if(danger) m.html("<span class='obvestilo label label-danger fade-in'>"+message+"</span>");
    else m.html("<span class='obvestilo label label-success fade-in'>"+message+"</span>");
    m.fadeIn();
    setTimeout(function(){ m.fadeOut(2000); }, 3000);
}

$(function(){
   $("#btnIzborPacienta").click(function(){
       if($(this).html() == "Izberi pacienta"){
       		sessionId = getSessionId();
			var ehrId = $("#ehrId").val();
		
			if (!ehrId || ehrId.trim().length == 0) {
				msg("Prosim vnesite zahtevan podatek!", true);
			} else {
				$.ajax({
					url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
					type: 'GET',
					headers: {"Ehr-Session": sessionId},
			    	success: function (data) {
						var party = data.party;
		          		$("#btnIzborPacienta").html("Zamenjaj pacienta");
       					$(".polja").slideUp();
       					displayPatient(party);
					},
					error: function(err) {
						msg("Napaka '" + JSON.parse(err.responseText).userMessage + "'!", true);
					}
				});
			}
       }
       else{
           $(this).html("Izberi pacienta");
           $(".polja").slideDown();
       }
   });
   
   $("#generirajPodatke").click(function(){
   	for(var i = 1; i <= 3; i++){
	   	generirajPodatke(i, function(ehrId, ime){
	   		$("#drpPacienti").append("<option value='"+ehrId+"'>"+ime+"</option>");
	   	});
   	}
   });
   
	$("#drpPacienti").on('change', function() {
		$("#ehrId").val( this.value );
	});
});

function displayPatient(patient){
	var ehrId;
	var address;
	$("#patientName").html(patient.firstNames+" "+patient.lastNames);
	$("#patientBirthday").html(chDateTime(patient.dateOfBirth));
	$("#patientEHR").html("Neznan");
	$("#patientAddress").html("Neznan");
	
	for(var i = 0; i < patient.partyAdditionalInfo.length; i++){
		if(patient.partyAdditionalInfo[i].key == "ehrId"){
			ehrId = patient.partyAdditionalInfo[i].value;
			$("#patientEHR").html(patient.partyAdditionalInfo[i].value);
		}
		if(patient.partyAdditionalInfo[i].key == "address"){
			$("#patientAddress").html(patient.partyAdditionalInfo[i].value);
			address = patient.partyAdditionalInfo[i].value;
		}
	}
	displayMesasurements(ehrId, address);
}

function chDate(d){
	var patt = /(\d{4})-(\d{2})-(\d{2}).(\d{2}):(\d{2}):(\d{2})/i
	var res = d.match(patt); 
	console.log(res);
	return res[3]+"."+res[2]+"."+res[1];
}

function chDateTime(d){
	var patt = /(\d{4})-(\d{2})-(\d{2}).(\d{2}):(\d{2}):(\d{2})/i
	var res = d.match(patt); 
	return res[3]+"."+res[2]+"."+res[1]+" "+res[4]+":"+res[5]+":"+res[6];
}

function displayMesasurements(ehrId, address){
	$("#graph").html("");
	$("#measurementDate").html("/");
	$("#measurementSystolic").html("/");
	$("#measurementDiastolic").html("/");
	var sessionId = getSessionId();
	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	$.ajax({
  	    url: baseUrl + "/view/" + ehrId + "/blood_pressure",
	    type: 'GET',
	    headers: {"Ehr-Session": sessionId},
	    success: function (res) {
	    	if (res.length > 0) {
	    		console.log(res);
	    		$(".meritve tbody").html("");
	    		meritve = res;
	    		for(var i = 0; i < res.length; i++){
	    			$(".meritve tbody").append("<tr meritev='"+i+"'><td>"+chDate(res[i].time)+"</td><td>"+res[i].systolic+"</td><td>"+res[i].diastolic+"</td></tr>");
	    		}
	    		$("tr[meritev]").click(function() {
	    			$("tr").removeClass("selected");
	    			$(this).addClass("selected");
	    			
	    			var id = parseInt($(this).attr("meritev"));
	    			console.log(id);
	    			$("#measurementDate").html(chDateTime(meritve[id].time));
	    			$("#measurementSystolic").html(meritve[id].systolic+" "+meritve[id].unit);
	    			$("#measurementDiastolic").html(meritve[id].diastolic+" "+meritve[id].unit);
	    		});
	    		if(address){
	    			$.get("https://jsonp.afeld.me/?url=http%3A%2F%2Fapps.who.int%2Fgho%2Fathena%2Fdata%2FGHO%2FBP_06.json%3Fprofile%3Dsimple%26filter%3DAGEGROUP%3A*%3BSEX%3A*%3BCOUNTRY%3A*", function( result ) {
						console.log(result);
						var data = result.fact;
						var patt = /(\d{1,3}.\d) \[(\d{1,3}.\d)-(\d{1,3}.\d)\]/i
						for(var i = 0; i < data.length; i++){
							if(address.indexOf(data[i].dim.COUNTRY) != -1 && data[i].dim.SEX == "Both sexes")
							{
								var vrednosti = data[i].Value.match(patt);
			    				displayChart(res, [parseFloat(vrednosti[1]), parseFloat(vrednosti[2]), parseFloat(vrednosti[3])]);
			    				return;
							}
						}
	    			});
	    		}
	    		else {
	    			msg("Naslov ni na voljo!", true);
	    			displayChart(res, [res[0].systolic, res[0].systolic, res[0].systolic]);
    				return;
	    		}
			}
	    },
	    error: function() {
	    	msg("Napaka '" +JSON.parse(err.responseText).userMessage + "'!", true);
	    }
	});
}

