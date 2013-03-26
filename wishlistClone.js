/* 
* This is a clone of the Wishlist.js file found at at.eng.carleton.ca/engsched. The Wishlist.js file
* is the code behind the Timetable Whiz tool that can be found by selecting the Timetable Whiz tab at that site.
*
* The Timetable Whiz gets a list of the courses a student is registered in, then 
* takes a list of the courses the student wishes to register in, then the "Build My Timetable" button is clicked
* which generates a list of all the possible non-conflicting timetables or schedules, involving the courses selected. 
*
* WishlistClone.js does not contain all of the code found in Wishlist.js. Instead it highlights the timetable generation functionality, 
* which happens after the "Build My Timetable" button has been clicked.
* I chose to show this part of the code because it gives a good overview of how the Scheduler Tool, Timetable Whiz and Engineering Request Form
* work overall, and because it was the most challenging technical problem that I needed to solve while working on these tools. 
*
* Ive removed the parts of the code that deal with setting up the HTML dropdown menus and buttons in order to shorten the file considerably and 
* focus on the timetable generation functionality that I implemented. 
* 
*
* 
*/
function WishlistClone(){
}

WishlistClone.prototype.initialize=function(crnlist){
	this.wish=this;
	
	//this prototype function sets up the HTML elements on the page.
	this.buildPage();	
	
	// other prototype functions are called with Ajax calls to get information from the server to populate the dropdown menus.  
	//Ajax call made to server 
	new slAjax.AjaxUtil('wishlist.php?&courses='+courses+'&term='+document.getElementById('termDrop').value+'&list='+registered, this.obj.findWorking, true);
}

/*Sets up the basic html structure of the page*/
WishlistClone.prototype.buildPage=fuction() {
	
	//All of the html elements; buttons, dropdown menus at set up here. One group of dropdown menus is for courses that stuents are registered in, 
	//the other for courses the student wishes to register in
	
	// The "Build My Timetable" button is created 
	var buildIt=document.createElement('button');
	buildIt.obj=this;
	buildIt.innerHTML="Build My Timetable";
	buildIt.onclick=this.searchAll; //searchAll function below gets called when the button is clicked
	container.appendChild(buildIt); //Button is appended to the element on the page
	
}

/* Checks to make sure all rows have been filled in correctly and passes the input on to the server*/
Wishlist.prototype.searchAll=function(){

	var registered=document.getElementById('registered'); //gets the DOM element listing the course sections the user is registered in
	var other=document.getElementById('other'); //gets the DOM element listing the courses in which the user wishes to register
	var ignored=new Array();
	var wishes=new Array();
	var registeredCourses=new Array();
	for(var i in registered.childNodes){
		if(registered.childNodes[i]!=undefined){
			if(registered.childNodes[i].className=="queryRow"){ 
				var count=registered.childNodes[i].id.substring('row'.length);
				var section=document.getElementById("sectionSelect"+count).value; //gets the course section info input by the user
				var course=document.getElementById("courseSelect"+count).value; //gets the course number info input by the user
				var dept=document.getElementById("deptSelect"+count).value; //gets the course department info input by the user
				if(course!="NULL"&&dept!="NULL"&&(section=="Null"||section=="NULL")) ignored[ignored.length]=dept+" "+course;
				else if(course=="NULL"||dept=="NULL"||(section=="Null"||section=="NULL")){}
				else{ // course dept, number and section info for registered courses is correctly submitted
					//here in these brackets we check whether theres a lab section that goes with the course that needs to be filled in
					//If it is, then the courses are added to the registeredCourses array. 
					
				}
			}
		}
	}
	for(var i in other.childNodes){ //here we collect a list from the classes that the user wishes to register in 
		if(other.childNodes[i]!=undefined){
			if(other.childNodes[i].className=="queryRow"){
				var count=other.childNodes[i].id.substring('row'.length);
				var course=document.getElementById("wishCourseSelect"+count).value;
				var dept=document.getElementById("wishDeptSelect"+count).value;
				if(course!="Null"&&course!="NULL"&&course!="null") wishes[wishes.length]=dept+course;
				else if(dept!="NULL"){
					ignored[ignored.length]=dept;
				}
			}
		}
	}
	var courses="The following courses have not been filled in correctly:\n";
	for(var x in ignored){
		courses+=ignored[x]+'\n';
	}
	if(ignored.length>0)alert(courses); //here we warn the user with a popup to correctly fill in the information if there is missing information
	else{
		var registered="";
		for(var i in registeredCourses){
			if(registeredCourses[i]!=undefined&&registeredCourses[i]!=null&&registeredCourses[i]!="null")registered+=registeredCourses[i]+',';
		}
		registered=registered.substring(0, registered.length-1); //finalizes the list of course sections that are registered in
	
		courses="";
		for(var x in wishes){
			courses+=wishes[x]+',';
		}
		courses=courses.substring(0, courses.length-1); //finalized the list of courses that the user wishes to register in
		
		//Ajax call is made to the server to acquire info about the coureses that have been input.
		new slAjax.AjaxUtil('wishlist.php?&courses='+courses+'&term='+document.getElementById('termDrop').value+'&list='+registered, this.obj.findWorking, true);
	}
}

/* Receives the response back from the server*/
WishlistClone.prototype.findWorking=function(response){
	response=response.substring(0, response.indexOf('<html'));
	if(response!="[[]]"){
		var courses=eval('('+response+')');
		
		//Info about registered courses is in array position 0, info about desired courses is in array position 1
		var listArray=this.wish.buildList(courses[0], courses[1]); //this function will run the timetable generation functionality
		if(listArray.length>=1){
			this.wish.populateList(listArray); //displays the results to the user
		}
	}
	// leave in for case where response is empty
	else alert(" 0 conflict-free timetables were generated");
	// Tell the user how many timetables were found
	alert(listArray.length+" conflict-free timetables were generated");
}

/* This is the main function for timetable generation. Implements a graph (depth-first) search algorithm*/
WishlistClone.prototype.buildList=function(addedCourses, courses){
	var currentTimetable = new Array();
	if (addedCourses.length > 0) {
		for (var a=0; a<addedCourses[0].length-1; a++) { //checking against conflicts in registered courses
			for (var b=a+1; b<addedCourses[0].length; b++) {
				var compare1 = new OfferingClone(addedCourses[0][a]); //OfferingClone objects represent a course section
				var compare2 = new OfferingClone(addedCourses[0][b]);
				if (compare1.overlaps(compare2)) { //check whether there is a timeing conflict between the OfferingClone objects
					return currentTimetable;
				}
			}
		}
	}
	currentTimetable = addedCourses; //list of possible timetables has one timetable consisting of registered courses

	for (var i=0; i<courses.length; i++) { 
		
		//each element of courses array contains all the possible course and lab sections for the course that the student wants to get into 
		var nextTimetable = new Array();
		var combos = this.implementCombos(courses[i]); //returns array of all the possible course/lab combinations
		
		for (var j=0; j<combos.length; j++) {
			if (currentTimetable.length != 0) {
				for (var k=0; k<currentTimetable.length; k++) { //checks whether course/lab combo is in conflict with each existing timetable in list 
					if (!this.isInConflict(currentTimetable[k], combos[j])) { 
						var temp = this.addToList(currentTimetable[k], combos[j]); //creates new timetable with non-conflicting courses
						nextTimetable.push(temp); //add new timetable to list
					}
				}
			}
			else {
				var temp = new Array();
				for (var t=0; t<combos[j].length; t++) {
					temp.push(combos[j][t]);
				}
				nextTimetable.push(temp);
			}	
		}
		currentTimetable = nextTimetable; //new list of timetables becomes the current list of timetables

		//If the current list of timetables is empty, this means that one of the requested courses could not be acommodated without conflicts. 
		//Thus return 0 conflict free timetables. 
		if (currentTimetable.length < 1) { 
			return currentTimetable;
		}
		
	}
	return currentTimetable; //return the created list of timetables. 
}

/*Adds conflict free timetable to an array*/
Wishlist.prototype.addToList=function(row, combination)
{
	var tempArray = new Array();
	
	for (var i=0; i<row.length; i++) {
		tempArray.push(row[i]);
		
	}
	
	for (var j=0; j<combination.length; j++) {
		tempArray.push(combination[j]);
		
	}
	return tempArray;
}

/*checks if there is a conflict*/
WishlistClone.prototype.isInConflict=function(row, combination)
{
	//checks whether each offering in course/lab combination is in conflict with any other offerings in the row 
	for (var i=0; i<row.length; i++) {
		for (var j=0; j<combination.length; j++) {
			var existc = new OfferingClone(row[i]);
			var newc = new OfferingClone(combination[j]);
			if (existc.overlaps(newc)) { //if offering times are overlapping, this indicates a conflict
				return true;
			}
		
		}
	
	}
	return false;
}

/*returns a collection of course/lab combinations*/
WishlistClone.prototype.implementCombos=function(course){
	var collection = new Array();
	for (var j=0; j<course.length; j++) {
		var numLabs = course[j].labs.length;
		if (numLabs>0) {
			if (numLabs>1 && course[j].dept!="CHEM") { //exception here for CHEM department courses
				for (var i=0; i<course[j].labs[0].length; i++){
					for (var k=0; k<course[j].labs[1].length; k++){
						var combo = new Array();
						combo.push(course[j]);
						combo.push(course[j].labs[0][i]);
						combo.push(course[j].labs[1][k]);
						collection.push(combo);	
					}
				}
			} else {
				for (var i=0; i<course[j].labs[0].length; i++){
					var combo = new Array();
					combo.push(course[j]);
					combo.push(course[j].labs[0][i]);
					collection.push(combo);
				}
			}
		}
		else {
			var single = new Array();
			single.push(course[j]);
			collection.push(single);
		}
	}
	return collection;
}
/*Displays the results of the search to the user*/
WishlistClone.prototype.populateList=function(list){
	container=document.getElementById('resultsContainer');
	container.innerHTML="<p>Built Timetables:</p>";

	var i = list.length;
	if( i == 0 ) alert( "A conflict-free timetable cannot be generated" );
	while ( --i ) {
		var j = Math.floor( Math.random() * ( i + 1 ));
		var tempi = list[i];
		var tempj = list[j];
		list[i] = tempj;
		list[j] = tempi;
	}
	//creating a set
	var listSet = {};
	var temp = new Array();
	//end shuffle
	for(var x=list.length-1;x>-1;x--){
		var crns="";
		var courses="";
		for (var i in list[x]){
			if(list[x][i]!=undefined){
				courses+=list[x][i].dept+' '+list[x][i].course+' '+list[x][i].section+',';
				crns+=list[x][i].crn+',';
			}
		}	

		courses=courses.substring(0,courses.length-1);
		crns=crns.substring(0,crns.length-1);
		var divclass = "red";
		if ( x % 2 == 0 ) {
			divclass = "wishResult";
		}

		//we want this link to open in new tab
		//each timetable in the list gets one link
		var node = $('<div class="mydata ' + divclass + '"><a href="index.php?&list=1&crnlist=' + crns + '" target="_blank">' + courses + '</a></div>' );
		node.appendTo(container);
	}
	$( '.mydata:gt(4)' ).hide();
	$( '.mydata:gt(4):last' ).after(
		$( '<a />' ).attr( 'href', '#' ).text( 'Show more' ).click( function() {
			var a = this;
			$( '.mydata:not(:visible):lt(5)' ).fadeIn( function() {
				if ( $( '.mydata:not(:visible)' ).length == 0 ) $(a).remove();   
			}); return false;
		})
	);
}

/*
 *	The OfferingClone class represents one course/lab/tutorial section. 
 *  It is therefore the data model for each entry in the Courses table from the database.
 */

function OfferingClone (obj)
{
	if (!obj['title'] && obj['ttl']) { obj['title'] = obj['ttl']; }
	if(obj['link_con']!=null){
		this.link_con=obj['link_con'];
		this.link_id=obj['link_id'];
	}
	if(obj['labs']!=null)this.labs=obj['labs'];
   this.crn=obj['crn'];
   this.term=obj['term'];
   this.conflicts = false;
   this.days = new String(obj['days']);
   this.dept = obj['dept'];
   this.course = obj['course'];
   this.section = obj['section'];
   this.space=obj['space'];
   this.owningDivs = new Array();
   this.ghostDivs = false;
   this.searched=false;
   
   this.ttl = obj['title'];
   this.displayed=false;
   this.isSelected=false;
   this.timeslots = obj['timeslots'];
   this.roundSlots();
   this.start_date = obj['start_date'];
   this.end_date = obj['end_date'];
}

/*Rounds times to the nearest half hour*/
OfferingClone.prototype.roundSlots = function()
{
	var rounded = { "00" : "00", "30" : "30", "25" : "30", "35" : "30", "05" : "00", "55" : "00" };
	for (var i in this.timeslots)
	{
		this.timeslots[i]['roundStart'] = this.timeslots[i]['start'].split(':');
		this.timeslots[i]['roundEnd'] = this.timeslots[i]['end'].split(':');
		
		// If we start at something like 08:55 we need to round up to 09:00
		if (this.timeslots[i]['roundStart'][1] == "55")
		{
			// Add 1 to the integer start time.
			this.timeslots[i]['roundStart'][0]=slParseInt(this.timeslots[i]['roundStart'][0])+1;
			// If our start time is under ten, add the leading 0.
			if (this.timeslots[i]['roundStart'][0]<10) { this.timeslots[i]['roundStart'][0]="0"+this.timeslots[i]['roundStart'][0]; }
		}
		// Round the second part using the simple hash lookup.
		this.timeslots[i]['roundStart'][1] = rounded[this.timeslots[i]['roundStart'][1]];

		// Do it all again for the end time.
		if (this.timeslots[i]['roundEnd'][1]=="55") 
		{ 
			this.timeslots[i]['roundEnd'][0]=slParseInt(this.timeslots[i]['roundEnd'][0])+1;
			if (this.timeslots[i]['roundEnd'][0]<10) { this.timeslots[i]['roundEnd'][0]="0"+this.timeslots[i]['roundEnd'][0]; } 
		}
		this.timeslots[i]['roundEnd'][1] = rounded[this.timeslots[i]['roundEnd'][1]];
		
		this.timeslots[i]['roundStart'] = this.timeslots[i]['roundStart'][0]+":"+this.timeslots[i]['roundStart'][1];
		this.timeslots[i]['roundEnd'] = this.timeslots[i]['roundEnd'][0]+":"+this.timeslots[i]['roundEnd'][1];
	}
}
/*Checks whether dates and times between offerings are overlapping*/
OfferingClone.prototype.overlaps=function(off)
{
	for (var i in this.timeslots)
	{
		for (var j in off.timeslots)
		{	
			if (this.crn!=off.crn && 
					this.timeslots[i]['roundStart'] < off.timeslots[j]['roundEnd'] && 
					this.timeslots[i]['roundEnd'] > off.timeslots[j]['roundStart'])
			{
		 		if (this.timeslots[i]['days'].length==1)
				{
					if (off.timeslots[j]['days'].indexOf(this.timeslots[i]['days'])>= 0)
					{
						if (this.overlapEvenOdd(this.section, off.section) || this.overlapSummer(this.start_date, this.end_date, off.start_date, off.end_date)) {
							this.conflicts = false;
							return false;
						}
						else {
							this.conflicts = true;
							return true;
						}
					}
				}
				for (var k=0; k < this.timeslots[i]['days'].length; k++)
				{
					// IE has a problem with this.  Use substring?
					var day = this.timeslots[i]['days'].charAt(k);
					if (off.timeslots[j]['days'].indexOf(day)>=0)
					{
						if (this.overlapEvenOdd(this.section, off.section) || this.overlapSummer(this.start_date, this.end_date, off.start_date, off.end_date)) {
							this.conflicts = false;
							return false;
						}
						else {
							this.conflicts = true;
							return true;
						}
					}
				}		
			}
		}
	}
	this.conflicts = false;
	return false;
}

/*
* Checks whether the overlap involves an odd and even section which
* means the offerings run on seperate weeks and are therefore not conflicting
*/
OfferingClone.prototype.overlapEvenOdd=function(section1, section2) 
{
	var temp1 = section1.length;
	var temp2 = section2.length;
	if (temp1 > 1) {
		if (temp2 > 1) {
			if (section1.charAt(temp1 - 1)=="O") {
				if (section2.charAt(temp2 - 1)=="E") {
					return true;
				}
			}
			else if (section1.charAt(temp1 - 1)=="E") {
				if (section2.charAt(temp2 - 1)=="O") {
					return true;
				}
			}
		}
	}
	return false;
}

/*
* Checks wether the overlap involves an early summer course and a late summer course. 
* Early summer courses run from May to June, late summer courses run from July to August. 
* However a full summer course runs from May to August and will be in conflict if it is overlapping
* any summer offering.
*/
OfferingClone.prototype.overlapSummer=function(start_date1, end_date1, start_date2, end_date2) 
{
	var monthPos = 5;
	var halfTermMonths = 2;
	var startMonth1 = parseInt(start_date1.substr(monthPos, 2));
	var startMonth2 = parseInt(start_date2.substr(monthPos, 2));
	var diffMonths1 = parseInt(end_date1.substr(monthPos, 2) - startMonth1);
	var diffMonths2 = parseInt(end_date2.substr(monthPos, 2) - startMonth2);
	
	if ((startMonth1 != startMonth2) && (diffMonths1<halfTermMonths) && (diffMonths2<halfTermMonths)) {
		return true;
	}
	return false;
}