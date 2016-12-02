(function () {

    'use strict';


    angular.module('ManagerApp')
        .controller('EncountersCtrl', function ($scope,$rootScope, $routeParams, patientService, ngDialog, $location, toaster, encounterService, ngAudio, prompt) {


            var patient_id = $('#patient_id').val();
            $scope.patient_id = patient_id;
            var encounter_id = $routeParams.encounter_id;
            $scope.encounter_id = encounter_id;

            patientService.fetchActiveUser().then(function (data) {
                $scope.active_user = data['user_profile'];

            });

            patientService.fetchEncounterInfo(encounter_id).then(function (data) {

                $scope.encounter = data['encounter'];
               $rootScope.encounter_events = $scope.encounter_events = data['encounter_events'];
                $scope.related_problems = data['related_problems'];

                // If encounter include any audio automatically playing this audio
                if ($scope.encounter.audio != null && $routeParams.startAt != null) {
                    // TODO: We have to check that audio1 element must be valid before playing
                    var canPlay = setInterval(function () {
                        console.log("We trying to playing audio again");
                        var myAudio = document.getElementById('audio1');
                        if (myAudio != null) {
                            console.log("Hurray can play audio at position for now");
                            myAudio.currentTime = parseInt($routeParams.startAt);
                            myAudio.play();
                            clearInterval(canPlay);
                        }
                    }, 1000);
                }
            });

            $scope.update_note = function () {

                var form = {};
                form.encounter_id = $scope.encounter_id;
                form.patient_id = $scope.patient_id;
                form.note = $scope.encounter.note;
                encounterService.updateNote(form).then(function (data) {

                    toaster.pop('success', 'Done', 'Updated note!');

                });


            };

            $scope.upload_video = function () {

                var form = {};
                form.encounter_id = $scope.encounter_id;
                form.patient_id = $scope.patient_id;
                var file = $scope.video_file;

                encounterService.uploadVideo(form, file).then(function (data) {

                    if (data['success'] == true) {

                        toaster.pop('success', 'Done', 'Uploaded Video!');
                    }
                });

            };

            $scope.upload_audio = function () {

                var form = {};
                form.encounter_id = $scope.encounter_id;
                form.patient_id = $scope.patient_id;
                var file = $scope.audio_file;

                encounterService.uploadAudio(form, file).then(function (data) {
                    if (data['success'] == true) {
                        toaster.pop('success', 'Done', 'Uploaded Audio!');
                    }
                });
            };

            /**
             *
             * Add an timestamp event
             * Get timestamp of current playing audio.
             * TODO:1. Ask @Jim for default timestamp will be added if there is any error
             * TODO:2. Ask @Rohit for adding support we can add timestamp from client.Currently not supported yet
             * Default timestamp: 0
             */
            $scope.add_timestamp = function () {
                // Get default encounter element page
                var myAudio = document.getElementById('audio1');

                var form = {};
                form.encounter_id = $scope.encounter_id;
                form.patient_id = $scope.patient_id;
                form.timestamp = (myAudio != undefined && myAudio !=null)? myAudio.currentTime : 0;
                // form.summary = $scope.summary;
                encounterService.addTimestamp(form).then(function (data) {
                    if (data['success'] == true) {
                        $scope.encounter_events.push(data['encounter_event']);
                        toaster.pop('success', 'Done', 'Added timestamp!');
                    } else {
                        toaster.pop('error', 'Warning', 'Something went wrong!');
                    }
                });
            };

            $scope.markFavoriteEvent = function (encounter_event) {
                var form = {};
                form.encounter_event_id = encounter_event.id;
                form.is_favorite = true;
                encounterService.markFavoriteEvent(form).then(function (data) {
                    encounter_event.is_favorite = true;
                    toaster.pop('success', 'Done', 'Marked favorite!');
                });
            };

            $scope.unmarkFavoriteEvent = function (encounter_event) {
                var form = {};
                form.encounter_event_id = encounter_event.id;
                form.is_favorite = false;
                encounterService.markFavoriteEvent(form).then(function (data) {
                    encounter_event.is_favorite = false;
                    toaster.pop('success', 'Done', 'Unmarked favorite!');
                });
            };

            $scope.nameFavoriteEvent = function (encounter_event) {
                var form = {};
                form.encounter_event_id = encounter_event.id;
                form.name_favorite = encounter_event.name_favorite;
                encounterService.nameFavoriteEvent(form).then(function (data) {
                    encounter_event.is_named = false;
                    toaster.pop('success', 'Done', 'Named favorite!');
                });
            };

            $scope.deleteEncounter = function () {
                prompt({
                    "title": "Are you sure?",
                    "message": "This is irreversible."
                }).then(function (result) {
                    var form = {};
                    form.encounter_id = $scope.encounter_id;
                    form.patient_id = $scope.patient_id;
                    encounterService.deleteEncounter(form).then(function (data) {
                        toaster.pop('success', 'Done', 'Deleted encounter!');
                        $location.url('/');
                    });
                }, function () {
                    return false;
                });
            };


            $scope.permitted = function (permissions) {

                if ($scope.active_user == undefined) {
                    return false;
                }

                var user_permissions = $scope.active_user.permissions;

                for (var key in permissions) {

                    if (user_permissions.indexOf(permissions[key]) < 0) {
                        return false;
                    }
                }

                return true;
            };


        });
    /* End of controller */


})();
