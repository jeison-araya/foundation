/**
 * Copyright (c) Small Brain Records 2014-2018 Kevin Perdue, James Ryan with contributors Timothy Clemens and Dinh Ngoc Anh
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function () {

    'use strict';

    angular.module('StaffApp')
        .controller('ManageSharingPatientCtrl', function ($scope, $routeParams, ngDialog, staffService, $location, $anchorScroll, toaster, inrService) {

            $scope.patientName = '';
            $scope.patient_id = $routeParams['patientId'];
            $scope.assign_patient_form = {};

            $scope.findPatient = findPatient;
            $scope.add_sharing_patient = add_sharing_patient;
            $scope.remove_sharing_patient = remove_sharing_patient;
            $scope.permitted = permitted;
            $scope.isShared = isShared;

            init();

            function init() {


                staffService.fetchActiveUser().then(function (response) {
                    let data = response.data;
                    $scope.active_user = data['user_profile'];
                });

                staffService.getUserInfo($scope.patient_id).then(function (response) {
                    let data = response.data;
                    $scope.patient = data['user_profile'];
                });

                staffService.getSharingPatients($scope.patient_id).then(function (response) {
                    let data = response.data;
                    $scope.sharing_patients = data['sharing_patients'];
                });

            }

            /**
             *
             * @param sharingPatientId : Patient User Id being shared my profile
             */
            function add_sharing_patient(sharingPatientId) {
                let form = {
                    patient_id: $scope.patient_id,
                    sharing_patient_id: sharingPatientId, // Profile id -> user id
                };

                staffService.addSharingPatient(form).then(function (response) {
                    let data = response.data;
                    if (data['success']) {
                        $scope.sharing_patients.push(data['sharing_patient']);
                        form.sharing_patient_id = '';

                        toaster.pop('success', 'Done', 'Added sharing patient successfully');
                    } else {
                        toaster.pop('error', 'Error', 'Added sharing patient failed!');
                    }
                });
            }

            function remove_sharing_patient(userId) {
                staffService.removeSharingPatient($scope.patient_id, userId)
                    .then(function (response) {
                        let data = response.data;
                        if (data['success']) {
                            $scope.sharing_patients.forEach((p, idx) => {
                                if (p.user.id === userId) {
                                    $scope.sharing_patients.splice(idx, 1);
                                }
                            });

                            toaster.pop('success', 'Done', 'Removed sharing patient successfully');
                        } else {
                            toaster.pop('error', 'Error', 'Removed sharing patient error!');
                        }
                    });
            }

            function isShared(result) {
                let isShared = false;
                $scope.sharing_patients.forEach((patient) => {
                    if (patient.id === result.id) {
                        isShared = true;
                    }
                });
                return isShared;
            }

            function permitted(user) {
                var permitted = true;
                if (user.id === $scope.patient.user.id) {
                    permitted = false;
                }

                angular.forEach($scope.sharing_patients, function (value, key) {
                    if (user.id === value.user.id) {
                        permitted = false;
                    }
                });

                return permitted;

            }

            function findPatient(viewValue) {
                if (viewValue !== '') {
                    return inrService.findPatient(viewValue).then(function (response) {
                        let data = response.data;
                        $scope.results = response.data.patients; // This one return User Profile
                    });
                } else {
                    $scope.results = [];
                }
                return $scope.results;
            }
        });
    /* End of controller */

})();