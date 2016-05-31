
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


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

var pacienti = [{}, {ime: "Janez", priimek: "Novak", datumRojstva: "1968-02-12T10:05", naslov: "Slovenia", 
						meritve: [	{ datum: "1968-03-16T12:07", sistolicni: 110, diastolicni: 90},
									{ datum: "1978-04-10T14:06", sistolicni: 100, diastolicni: 90},
									{ datum: "1988-05-11T18:03", sistolicni: 120, diastolicni: 90},
									{ datum: "1998-06-30T22:04", sistolicni: 125, diastolicni: 90},
									{ datum: "2008-07-02T13:25", sistolicni: 121, diastolicni: 90},
									]},
                    {ime: "Mojca", priimek: "Kovač", datumRojstva: "1977-02-10T01:10", naslov: "Austria", 
						meritve: [	{ datum: "1978-03-11T05:15", sistolicni: 118, diastolicni: 90},
									{ datum: "1989-02-12T10:35", sistolicni: 110, diastolicni: 90},
									{ datum: "1999-02-12T10:54", sistolicni: 105, diastolicni: 90},
									{ datum: "2000-02-12T10:36", sistolicni: 115, diastolicni: 90},
									{ datum: "2012-02-12T10:48", sistolicni: 120, diastolicni: 90},
									]},
                    {ime: "Peter", priimek: "Kos", datumRojstva: "1966-03-05T22:28", naslov: "Canada", 
						meritve: [	{ datum: "1969-12-12T13:39", sistolicni: 108, diastolicni: 90},
									{ datum: "1970-02-12T15:18", sistolicni: 105, diastolicni: 90},
									{ datum: "1990-02-12T16:05", sistolicni: 104, diastolicni: 90},
									{ datum: "1991-02-12T17:29", sistolicni: 107, diastolicni: 90},
									{ datum: "1993-02-12T14:35", sistolicni: 110, diastolicni: 90},
									]}];
/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
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
	        var ehrId = data.ehrId;
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
								// Struktura predloge je na voljo na naslednjem spletnem naslovu:
					      		// https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
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
							        msg(res.meta.href);
							    },
							    error: function(err) {
							    	msg("Napaka '" + JSON.parse(err.responseText).userMessage + "'!", true);
							    }
							});
	                	}
	                    msg("EHR kreiran "+ehrId );
	                }
	            },
	            error: function(err) {
	            	msg("Napaka", true);
	            }
	        });
	    }
	});
    return ehrId;
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
});

function displayPatient(patient){
	var ehrId;
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
		}
	}
	displayBloodPressureMesasurements(ehrId);
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

function getValues(address) {
	$.get("http://apps.who.int/gho/athena/data/GHO/BP_06.json?profile=simple&filter=AGEGROUP:*;SEX:*;COUNTRY:*", function(result){
		var data = JSON.parse(result).fact;
		var patt = /(\d{1,3}.\d) \[(\d{1,3}.\d)-(\d{1,3}.\d)\]/i
		for(var i = 0; i < data.length; i++){
			if(address == data[i].dim.COUNTRY == address && address == data[i].dim.SEX == "Both sexes")
			{
				var res = data[i].Value.match(patt);
				return [res[1], res[2], res[3]];
			}
		}
	});
}

function displayBloodPressureMesasurements(ehrId){
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
	    		
	    		for(var i = 0; i < res.length; i++){
	    			$(".meritve tbody").append("<tr><td>"+chDate(res[i].time)+"</td><td>"+res[i].systolic+"</td><td>"+res[i].diastolic+"</td></tr>");
	    		}
	    		
	    		
	    		displayChart(res, getValues("Slovenia"));
	    	}
	    },
	    error: function() {
	    	msg("Napaka '" +JSON.parse(err.responseText).userMessage + "'!", true);
	    }
	});
}

