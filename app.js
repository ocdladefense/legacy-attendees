var startClick = 1;
var wasShifting = false;


var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// apex__appPreferences
function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}


function modal(lineId,title,content){ 
	var box = new SimpleDialog("hersh"+Math.random(), true);
	box.sendUserConfirmEmail = function(){testEmails(lineId);};
	box.sendAttendeeConfirmEmail = function(){sendEmails(lineId);};
	parent.box = box;
	box.setTitle(title);
	box.createDialog();
	box.setWidth(800);

	box.setContentInnerHTML(content + "<div class='modal-actions'><button class='btn' onclick='window.parent.box.hide(); return false;'>Cancel</button>"+
	"<button class='btn' onclick='window.parent.box.sendUserConfirmEmail(); window.parent.box.hide();return false;'>Test Email</button>"+
							"<button class='btn' onclick='window.parent.box.sendAttendeeConfirmEmail(); window.parent.box.hide();return false;'>Send Attendee Email</button></div>");
	box.setupDefaultButtons();
	box.show();
}		




// $(function(){});


document.addEventListener("DOMContentLoaded",function() {

	var helper = document.getElementById('attendee-form');
	var buttonTestEmail = document.getElementById('send-tests');//send-tests');
	var buttonSendEmail = document.getElementById('send-emails');//send-tests');
	var buttonDoAutofillNames = document.getElementById('do-autofill-names');//send-tests');

	helper.addEventListener('click',selectRange,true); 

	helper.addEventListener('click',doAction,true);


	buttonTestEmail.addEventListener('click',doTestBatch,true);
	buttonSendEmail.addEventListener('click',doSendBatch,true);
	
	buttonDoAutofillNames.addEventListener('click',doAutofillNames,true);


	let elems = document.querySelectorAll(".event-picker");
	
	for(var i = 0; i<elems.length; i++) {
		elems.item(i).addEventListener("change",loadList,{capture:true});
	}
});


function doAutofillNames(e){
	var status, eventId,
	json, crumb;
	
	e = e || window.event;
	e.stopPropagation();
	e.preventDefault();
	if(!confirm('This will autofill First and Last names for the current event.  Continue?')){
		return false;
	} 
	
	crumb = getCookie("apex__appPreferences");
	
	if(null == crumb || "" == crumb.trim()) {
		eventId = getUrlParameter("eventId");	
	} else {
		json = JSON.parse(crumb);
		eventId = json["listId"];
	}
	

	status = sforce.apex.execute("OcdlaAttendee","doAutofillNames",{eventId:eventId});
	window.location.reload();
	return status;
}







function doTestBatch(e){

	e.stopPropagation();
	e.preventDefault();

	var ids = getSelected();

	testEmails(ids);
	
	return false;
}

function doSendBatch(e) {

	e.stopPropagation();
	e.preventDefault();
	
	var ids = getSelected();
	
	sendEmails(ids);
	
	return true;
}

function getSelected() {
	var $elems, ids = [];
	$elems = $('input:checked');
	$elems.each(function(){
		ids.push($(this).data('lineId'));
	});
	
	console.log(ids);
	return ids;
}


function doAction(e) {
	var target, lineId, action;
	e = e || event;
	
	
	target = e.target || e.srcElement;
	action = target.getAttribute('class');

	
	if(target.nodeName != 'A' || !target.dataset || target.dataset.lineId == null) return false;
	lineId = target.dataset.lineId;
	
	e.preventDefault();
	e.stopPropagation();

	try {
	
	if(action == 'preview-button') {
		previewEmails(lineId);
	} else if(action == 'test-button'){
		testEmails(lineId);
	} else if(action == 'send-button'){
		sendEmails(lineId);
	}
	
	} catch(e) {
		console.log(e);
	}
	
	return false;

}

function selectRange(e){
	var target, lineId, theClass, rowNumber;
	e = e || event;
	
	
	target = e.target || e.srcElement;

	
	theClass = target.getAttribute('class');
	// console.log(target.parentNode.parentNode);
	if('line-checkbox' != theClass) return true;
	
	if(!target.dataset || target.dataset.lineId == null) return false;
	
	lineId = target.dataset.lineId;
	rowNumber = parseInt(target.value);
	
	var previousIndex = startClick;
	startClick = rowNumber;
	startClick = !wasShifting && e.shiftKey ? previousIndex : rowNumber;
	console.log('Start click is: '+startClick);
	console.log('Current click is: '+rowNumber);

	if(!e.shiftKey) {

		if(null != startClick && wasShifting){
			wasShifting = false;
			// uncheckAll(lineId);
		}
		
		if(target.checked) target.parentNode.parentNode.setAttribute('class','selected');
		else target.parentNode.parentNode.setAttribute('class','');

		return false;
	}
	
	
	else {
		wasShifting = true;
		console.log('Shift key was pressed.');
		if(rowNumber > startClick) {
			console.log('Will check boxes '+startClick+' through '+rowNumber);
			for(var i = startClick; i<=rowNumber; i++){
				var box = document.getElementById('checkbox-'+i);
				box.checked = true;
				box.parentNode.parentNode.setAttribute('class','selected');
			}
		}
		else if(rowNumber < startClick) {
			for(var i = startClick; i>=rowNumber; i--){
				var box = document.getElementById('checkbox-'+i);
				box.checked = true;
				box.parentNode.parentNode.setAttribute('class','selected');
			}
		}
		// alert('You pressed the shift key.');

	}

	return false;

}

function uncheckAll(omitLineId){
	var boxes;
	
	boxes = document.getElementsByClassName('line-checkbox');
	for(var i = 0; i<boxes.length; i++){
		if(boxes[i].dataset.lineId == omitLineId) continue;
		boxes[i].checked = false;
		boxes[i].parentNode.parentNode.setAttribute('class','');
	}
}




function setConfirmSentDate(lineId, d){
	var $date = $(".line-id-" +"[name='confirmationsentdate-c']");
}


function hasErrors(statuses){
	for(var i = 0; i<statuses.length; i++){
		if(!statuses[i].isSuccess) return true;
	}
	
	return false;
}

    

function sendEmails(lineIds){
	if(null == lineIds) throw new Error("No lines were accepted.");
	
	if(!Array.isArray(lineIds)){
		lineIds = [lineIds];
	}
	var config = new sforce.Xml("MailApiConfig");
	config.generator = "AttendeeConfirmationEmail";

	var statuses = sforce.apex.execute("OcdlaMail","sendEmails",{recordIds:lineIds,config:config});
	
	console.log(statuses);


	var hasErrors = false;
	var messages = "";
	
	var d = new Date();
	console.log(d.toISOString());
	
	if(statuses.length) {
	 	for(var i = 0; i<statuses.length; i++){
	 		var selector = ".line-id-"+statuses[i].whatId;
	 		var $parent = $(selector).parent();
	 		var $date = $parent.find("input[name='confirmationsentdate-c']");
			
			if(!statuses[i].isSuccess){
				hasErrors = true;
				messages += statuses[i].message+"\n";
				$parent.addClass("error");
				$date.val("ERROR: "+statuses[i].message);
			} else {
				$date.val(d.toISOString().slice(0,10));
			}
		}
	}
	
	if(hasErrors){
		alert("Some emails could not be sent:\n"+messages);
	}
	
	return false;		
}


    
function testEmails(lineIds) {
	var status, config;
	if(!Array.isArray(lineIds)){
		lineIds = [lineIds];
	}
	config = new sforce.Xml("MailApiConfig");
	config.generator = "AttendeeConfirmationEmail";

	status = sforce.apex.execute("OcdlaMail","testEmails",{recordIds:lineIds,config:config});
	console.log(status);
	alert("Test emails sent to your email address.");
	
	return false;
}



function previewEmails(lineIds) {
	if(!Array.isArray(lineIds)){
		lineIds = [lineIds];
	}
	console.log(lineIds);

	var config = new sforce.Xml("MailApiConfig");
	config.generator = "AttendeeConfirmationEmail";
	config.sample = false;

	var emailBody = sforce.apex.execute("OcdlaMail","previewEmails",{recordIds:lineIds,config:config});
	modal(lineIds,"Email Preview",emailBody);

	return false;
}





function loadList(e) {
	e.preventDefault();
	e.stopPropagation();
	var target = e.target;
		$eventId = $(target).val();
		console.log("Selected event is: ",$eventId);
	window.location.href="/apex/ClickpdxOrderItems?eventId="+$eventId;
		return false;
}



function filterByProduct2Id(product2Id) {
	$eventId = $('select[id*="event-picker"]').val();
	window.location.href="/apex/ClickpdxOrderItems?eventId="+$eventId+"&product2Id="+product2Id;
}


function orderBy(orderBy) {
	$eventId = $('select[id*="event-picker"]').val();
	
	$product2Id = getUrlParameter('product2Id');
	if(null == $eventId) {
		window.location.href="/apex/ClickpdxOrderItems?orderBy="+orderBy;        	   
	} else if( null == $product2Id) {
		window.location.href="/apex/ClickpdxOrderItems?eventId="+$eventId+"&orderBy="+orderBy;
	} else {
		window.location.href="/apex/ClickpdxOrderItems?eventId="+$eventId+"&product2Id="+$product2Id+"&orderBy="+orderBy;        
	}
}