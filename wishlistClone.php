<?php
	/*
	* 
	* WishlistClone.php is a clone of wishlist.php which serves the functionality of the Timetable Whiz tool at at.eng.carleton.ca/engsched 
	* under the Timetable Whiz tab.
	*
	* Here is the php code that retreives and formats information about the courses requested and registered from the database. In order to
	* highlight the timetable generation functionality, parts of the wishlist.php code dealing with retreiving the departments, course numbers and 
	* sections for the dropdown menus are omitted. 
	*/
	include('includes/db.php');
	include('includes/JSON.php');
	
	$courses=Array();
	$registered=Array();
	$row=Array();
	$completeList=Array();
	if(isset($_GET['courses'])){
		if(strpos($_GET['courses'],',')===false)$coursesArray=Array($_GET['courses']);
		else $coursesArray=preg_split('/,/', $_GET['courses']);
		foreach($coursesArray as $courseElement){
			$course=DB_DataObject::factory('Courses');
			$course->dept=substr($courseElement, 0, 4);
			$course->course=substr($courseElement, 4);
			$course->term=$_GET['term'];
			$course->whereAdd('LENGTH(courses.section)=1');
			//$course->whereAdd('courses.enr < courses.max_enr');
			if($course->find()>0){ //retreive all of the course lecture sections
				$foundArray=Array();
				while($course->fetch()){
					$foundArray[]=buildCourseArray($course); //format the course data from each lecture section
				}
				$courses[]=$foundArray;
			}
		}
		$registeredArray=preg_split('/,/', $_GET['list']);
		
		foreach($registeredArray as $regElement) { //
			
			$reg=DB_DataObject::factory('Courses');
			$reg->crn=$regElement;
			$reg->term=$_GET['term'];
			if($reg->find()>0) {
				$reg->fetch();
				$regTemp=buildRegisteredArray($reg); //format the course data from each registered course section
				$registered[]=$regTemp;
			}
		}
		
		$row[]=$registered;
		$completeList[]=$row;
		$completeList[]=$courses;
		printJSON($completeList);
	}
	function printJSON($ret) //returns the data to javascipt in JSON format
	{
		$json = new Services_JSON();
		$out = $json->encode($ret);
		print($out);
	}
	//formats course data for wishlist courses
	function buildCourseArray($course)
	{
		$timeslots=DB_DataObject::factory('Timeslots');
		$timeslots->crn=$course->crn;  //find corresponding timeslot entry
		$timeslots->term=$_GET['term'];
		$timeslots->find();
		$timeslotsArray=buildTimeslotArray($timeslots);
		$labs=Array();
		if($course->link_id!=null){
			if(strpos($course->link_con,',')===false)$linksArray=Array($course->link_con);
			else $linksArray=split(',', $course->link_con);
			foreach($linksArray as $link){ //put together the labs/tutorials corresponding to the lecture section
				$labs[]=buildLinksArray($link, $course->dept, $course->course);
			}
		}

		$courseArray= Array (
			"crn" => $course->crn, "term" => $course->term,
			"dept" => $course->dept, "course" => $course->course, 
			"section" => $course->section, "title" => $course->title,
			"room" => $course->room, "days" => $course->days, 
			"start" => $course->start, "end" => $course->end, "space"=>($course->max_enr-$course->enr),
			"start_date" => $course->start_date, "end_date" => $course->end_date,  
			"link_con" => $course->link_con, "link_id"=>$course->link_id, "timeslots"=>$timeslotsArray, "labs"=>$labs, "searched"=>false
		);
		return $courseArray; //returns formatted course data
	}
	//formats course data for registered courses
	function buildRegisteredArray($registered) 
	{
		$timeslots=DB_DataObject::factory('Timeslots');
		$timeslots->crn=$registered->crn; //find corresponding timeslot entry
		$timeslots->term=$_GET['term'];
		$timeslots->find();

		$timeslotsArray=buildTimeslotArray($timeslots);
		
		$registeredArray= Array (
			"crn" => $registered->crn, "term" => $registered->term,
			"dept" => $registered->dept, "course" => $registered->course, 
			"section" => $registered->section, "title" => $registered->title,
			"days" => $registered->days, "start" => $registered->start, "end" => $registered->end,
			"start_date" => $registered->start_date, "end_date" => $registered->end_date,
			"link_con" => $registered->link_con, "link_id"=>$registered->link_id, "timeslots"=>$timeslotsArray
		);
		return $registeredArray; //returns formatted course data for courses/labs the user is already registered in
		
	}
	//Returns formatted data from timeslots entry
	function buildTimeslotArray($timeslots){
		
		$timeslotArray=Array();
		while($timeslots->fetch()){
			$timeslotArray[]=Array(
				"crn"=>$timeslots->crn, "term"=>$timeslots->term,
				"days"=>$timeslots->days, "start"=>$timeslots->start,
				"end"=>$timeslots->end, "room"=>$timeslots->room, "prof"=>$timeslots->prof);
		}
		return $timeslotArray;
	}
	//Retreives lab/tutorial data for corresponding course section 
	function buildLinksArray($link, $dept, $course){
		$link=str_replace(' ', '', $link);
		$labs=Array();
		$labCourses=DB_DataObject::factory('Courses');
		$labCourses->term=$_GET['term'];
		$labCourses->dept=$dept;
		$labCourses->course=$course;
		$labCourses->link_id=$link;
		$labCourses->find();
		while($labCourses->fetch()){
			$timeslots=DB_DataObject::factory('Timeslots');
			$timeslots->crn=$labCourses->crn;
			$timeslots->find();
			$timeslotsArray=buildTimeslotArray($timeslots);
			$courseArray= Array (
			"crn" => $labCourses->crn, "term" => $labCourses->term,
			"dept" => $labCourses->dept, "course" => $labCourses->course, 
			"section" => $labCourses->section, "title" => $labCourses->title,
			"room" => $labCourses->room, "days" => $labCourses->days, 
			"start" => $labCourses->start, "end" => $labCourses->end, "space"=>($labCourses->max_enr-$labCourses->enr),
			"start_date" => $labCourses->start_date, "end_date" => $labCourses->end_date, 
			"link_con" => $labCourses->link_con, "link_id"=>$labCourses->link_id, "timeslots"=>$timeslotsArray,"searched"=>false);
			$labs[]=$courseArray;
		}
		return $labs;
	}
?>