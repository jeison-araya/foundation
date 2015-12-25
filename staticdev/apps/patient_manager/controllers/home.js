(function(){

	'use strict';


	angular.module('ManagerApp')
		.controller('HomeCtrl', function( $scope, $routeParams, patientService, problemService, ngDialog, toaster, $location){

			

			patientService.fetchActiveUser().then(function(data){
				$scope.active_user = data['user_profile'];

			});

			var patient_id = $('#patient_id').val();
			$scope.patient_id = patient_id;
			$scope.show_accomplished_todos = false;
			$scope.problem_terms = [];
			$scope.new_problem = {set:false};

			$scope.timelineSave = function (newData) { console.log(JSON.stringify(newData)); };

			// $scope.timeline = {
	  //           Name: 'testing', birthday: '30/11/1970 12:00:00', 
	  //           problems: [
	  //            {
	  //                name: 'Test problem01', 
	  //                events: [
	  //                           { event_id: 123, startTime: '30/11/2000 12:00:00', state: 'inactive' },
	  //                ]
	  //            },
	  //            {
	  //                name: 'Test problem02', 
	  //                events: [
	  //                           { event_id: 123, startTime: '30/11/2000 12:00:00', state: 'inactive' },
	  //                ]
	  //            },
	  //            {
	  //                name: 'Test problem03', 
	  //                events: [
	  //                           { event_id: 127, startTime: '01/02/2008 12:00:00', state: 'inactive' },
   //                             { event_id: 128, startTime: '15/04/2015 12:00:00', state: 'uncontrolled' },
   //                             { event_id: 129, startTime: '25/10/2015 12:00:00', state: 'controlled' },
	  //                ]
	  //            },
	  //            {
	  //                name: 'Test problem04', 
	  //                events: [
	  //                           { event_id: 123, startTime: '30/11/2000 12:00:00', state: 'inactive' },
	  //                ]
	  //            },
	  //            {
	  //                name: 'Test problem05', 
	  //                events: [
	  //                           { event_id: 123, startTime: '30/11/2000 12:00:00', state: 'inactive' },
	  //                ]
	  //            },
	  //            {
	  //                name: 'Test problem03', 
	  //                events: [
	  //                           { event_id: 123, startTime: '30/11/2000 12:00:00', state: 'inactive' },
	  //                ]
	  //            }
	  //           ]
	  //       };

	  		function convertDateTime(dateTime){
			    var date = dateTime.split("-");
			    var yyyy = date[0];
			    var mm = date[1]-1;
			    var dd = date[2];

			    return dd + '/' + mm + '/' + yyyy + ' 12:00:00';
			}

			patientService.fetchPatientInfo(patient_id).then(function(data){
				$scope.patient_info = data['info'];
				$scope.problems = data['problems'];
				$scope.inactive_problems = data['inactive_problems'];
				$scope.goals = data['goals'];
				$scope.completed_goals = data['completed_goals'];
				$scope.pending_todos = data['pending_todos'];
				$scope.accomplished_todos = data['accomplished_todos'];
				$scope.encounters = data['encounters'];

				// problem timeline
				var timeline_problems = [];
				angular.forEach(data['problems'], function(value, key) {
					var timeline_problem = {};
				  	timeline_problem['name'] = value.problem_name;
				  	var events = [];
				  	var state;
				  	if (value.is_controlled) {
				  		state = 'controlled';
				  	} else if (value.is_active) {
				  		state = 'uncontrolled';
				  	} else {
				  		state = 'inactive';
				  	}

				  	events.push({event_id: null, startTime: convertDateTime(value.start_date), state: state});
				  	timeline_problem['events'] = events;
				  	timeline_problems.push(timeline_problem);
				});

				$scope.timeline = {
					Name: data['info']['user']['first_name'] + data['info']['user']['last_name'], 
					birthday: data['info']['date_of_birth'], 
					problems: timeline_problems
				}
			});


			patientService.fetchPainAvatars(patient_id).then(function(data){
				$scope.pain_avatars = data['pain_avatars'];
			});


			$scope.update_patient_summary = function(){

					var form = {
						'patient_id': $scope.patient_id,
						'summary' : $scope.patient_info.summary
					};

					patientService.updatePatientSummary(form).then(function(data){
						toaster.pop('success', 'Done', 'Patient summary updated!');
					});

			};


			$scope.toggle_accomplished_todos  = function(){

				var flag = $scope.show_accomplished_todos;

				if(flag==true){
					flag = false;
				}else{
					flag=true;
				}

				$scope.show_accomplished_todos = flag;
			}







			$scope.add_goal = function(form){

				form.patient_id = $scope.patient_id;
				patientService.addGoal(form).then(function(data){

					
					var new_goal = data['goal'];

					$scope.goals.push(new_goal);

					toaster.pop('success', "Done", "New goal created successfully!");
					console.log('pop');
					
				});
				
			}


			$scope.add_todo = function(form){

				form.patient_id = $scope.patient_id;

				patientService.addToDo(form).then(function(data){

					
					var new_todo = data['todo'];
					$scope.pending_todos.push(new_todo);

					$scope.new_todo = {};

					toaster.pop('success', 'Done', 'New Todo added successfully');

					/* Not-angular-way */
					$('#todoNameInput').focus();
				});

			};




			$scope.$watch('problem_term', function(newVal, oldVal){

				console.log(newVal);
				if (newVal==undefined){
					return false;
				}

				$scope.unset_new_problem();

				if(newVal.length>2){

					patientService.listTerms(newVal).then(function(data){

						$scope.problem_terms = data;

					});
				}else{

					$scope.problem_terms = [];

				}

			});



			

			$scope.set_new_problem = function(problem){

					$scope.new_problem.set = true;
					$scope.new_problem.active = problem.active;
					$scope.new_problem.term = problem.term;
					$scope.new_problem.code = problem.code;


			};


			$scope.unset_new_problem = function(){

				$scope.new_problem.set = false;

			};


			$scope.add_problem = function(){

				var c = confirm("Are you sure?");

				if(c==false){
					return false;
				}

				var form = {};
				form.patient_id = $scope.patient_id;
				form.term = $scope.new_problem.term;
				form.code = $scope.new_problem.code;
				form.active = $scope.new_problem.active;

				patientService.addProblem(form).then(function(data){

					if(data['success']==true){
						toaster.pop('success', 'Done', 'New Problem added successfully');
						$scope.problems.push(data['problem']);
						$scope.problem_term = '';
						$scope.unset_new_problem();
						/* Not-angular-way */
						$('#problemTermInput').focus();

					}else if(data['success']==false){
						alert(data['msg']);
					}else{
						alert("Something went wrong");
					}


				});


			}

			$scope.add_new_problem = function(problem_term) {
				var c = confirm("Are you sure?");

				if(c==false){
					return false;
				}

				var form = {};
				form.patient_id = $scope.patient_id;
				form.term = problem_term;

				patientService.addProblem(form).then(function(data){

					if(data['success']==true){
						toaster.pop('success', 'Done', 'New Problem added successfully');
						$scope.problems.push(data['problem']);
						$scope.problem_term = '';
						$scope.unset_new_problem();
						/* Not-angular-way */
						$('#problemTermInput').focus();
					}else if(data['success']==false){
						toaster.pop('error', 'Error', data['msg']);
					}else{
						toaster.pop('error', 'Error', 'Something went wrong');
					}
				});
			}

			$scope.update_todo_status = function(todo){

				patientService.updateTodoStatus(todo).then(function(data){

					if(data['success']==true){
						$scope.pending_todos = data['pending_todos'];
						$scope.accomplished_todos = data['accomplished_todos'];
						toaster.pop('success', "Done", "Updated Todo status !");
					}else{
						alert("Something went wrong!");
					}
					
				});				

			}

			$scope.open_problem = function(problem){

				var form = {};
				form.problem_id = problem.id;
				problemService.trackProblemClickEvent(form).then(function(data){

					$location.path('/problem/'+problem.id);

				});
				

			};


			$scope.permitted = function(permissions){

				if($scope.active_user==undefined){
					return false;
				}

				var user_permissions = $scope.active_user.permissions;

				for(var key in permissions){

					if(user_permissions.indexOf(permissions[key])<0){
						return false;
					}
				}

				return true;

			};


		}); /* End of controller */


})();