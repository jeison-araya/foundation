(function () {
    'use strict';
    var ManagerApp = angular.module('ManagerApp',
        ['ngRoute', 'ngCookies', 'ngDialog', 'ngAnimate', 'ngSanitize',
            'httpModule', 'sharedModule', 'colon_cancers', 'a1c', 'medication', 'problems',
            'todos', 'medication-component', 'inr', 'myTools', 'document', 'TemplateCache',
            'timeLine', 'chart.js', 'toaster', 'ui.sortable', 'angular-click-outside', 'pickadate',
            'cgPrompt', 'angularAudioRecorder', 'ngFileUpload', 'ngAudio', 'webcam', 'color.picker',
            'cfp.hotkeys', 'ui.bootstrap', 'view.file', 'angularMoment', 'indexedDB', 'angular-spinkit', 'infinite-scroll']);
    ManagerApp.config(function ($routeProvider, recorderServiceProvider, ChartJsProvider, $httpProvider, $indexedDBProvider) {
        $indexedDBProvider.connection('andromedaHealthIndexedDB')
            .upgradeDatabase(1, function (event, db, tx) {
                let objStore = db.createObjectStore('encounter', {keyPath: 'id'});
                objStore.createIndex('audio_idx', 'audio', {unique: false});
            });
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

        /**
         * Configuration for recording service
         */
        recorderServiceProvider.forceSwf(false)
            .withMp3Conversion(true, {
                bitRate: 32
            });
        /**
         * Global chart configuration
         */
        ChartJsProvider.setOptions({
            chartColors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']
        });
        /**
         * Application route
         */
        $routeProvider
            .when('/', {
                templateUrl: '/static/apps/patient_manager/partials/home.html',
                controller: 'HomeCtrl'
            })
            .when('/edit/', {
                templateUrl: '/static/apps/patient_manager/partials/edit.html',
                controller: 'EditUserCtrl'
            })
            .when('/problem/:problem_id', {
                templateUrl: '/static/apps/patient_manager/partials/problem.html',
                controller: 'ProblemsCtrl'
            })
            .when('/goal/:goal_id', {
                templateUrl: '/static/apps/patient_manager/partials/goal.html',
                controller: 'GoalsCtrl'
            })
            .when('/encounter/:encounter_id', {
                templateUrl: '/static/apps/patient_manager/partials/encounter-page.template.html',
                controller: 'EncounterPageCtrl'
            })
            .when("/todo/:todo_id", {
                templateUrl: '/static/apps/patient_manager/partials/patient-todo-page.template.html',
                controller: 'TodoCtrl'
            })
            .when("/a1c/:a1c_id/add_different_order", {
                templateUrl: '/static/apps/patient_manager/partials/a1c/add_different_order.html',
                controller: 'AddDifferentOrderCtrl'
            })
            .when("/a1c/:a1c_id/enter_new_value", {
                templateUrl: '/static/apps/patient_manager/partials/a1c/enter_new_value.html',
                controller: 'EnterNewValueCtrl'
            })
            .when("/a1c/:a1c_id/edit_or_delete_values", {
                templateUrl: '/static/apps/patient_manager/partials/a1c/edit_or_delete_values.html',
                controller: 'EditOrDeleteValuesCtrl'
            })
            .when("/observation_value/:value_id/edit_value", {
                templateUrl: '/static/apps/patient_manager/partials/a1c/edit_value.html',
                controller: 'EditValueCtrl'
            })
            .when('/manage/sharing', {
                templateUrl: '/static/apps/patient_manager/partials/manage_sharing_patient.html',
                controller: 'ManageSharingPatientCtrl'
            })
            .when('/manage/sharing/problem/:sharing_patient_id', {
                templateUrl: '/static/apps/patient_manager/partials/manage_sharing_problem.html',
                controller: 'ManageSharingProblemCtrl'
            })
            .when("/colon_cancer/:colon_id/add_new_study", {
                templateUrl: '/static/apps/patient_manager/partials/colon_cancer/add_new_study.html',
                controller: 'AddNewStudyCtrl'
            })
            .when("/colon_cancer/:colon_id/edit_study/:study_id", {
                templateUrl: '/static/apps/patient_manager/partials/colon_cancer/edit_study.html',
                controller: 'EditStudyCtrl'
            })
            .when("/colon_cancer/:colon_id/add_new_order", {
                templateUrl: '/static/apps/patient_manager/partials/colon_cancer/add_new_order.html',
                controller: 'AddNewOrderCtrl'
            })
            .when('/data/:data_id', {
                templateUrl: '/static/apps/patient_manager/partials/data/data.html',
                controller: 'DataCtrl'
            })
            .when('/data/:data_id/add_data', {
                templateUrl: '/static/apps/patient_manager/partials/data/add_data.html',
                controller: 'AddDataCtrl'
            })
            .when('/data/:data_id/show_all_data', {
                templateUrl: '/static/apps/patient_manager/partials/data/show_all_data.html',
                controller: 'ShowAllDataCtrl'
            })
            .when('/data/:dataId/edit/:componentValueIds', {
                templateUrl: '/static/apps/patient_manager/partials/data/edit_data.html',
                controller: 'IndividualDataCtrl'
            })
            .when('/data/:data_id/settings', {
                templateUrl: '/static/apps/patient_manager/partials/data/settings.html',
                controller: 'DataSettingsCtrl'
            })
            .when('/medication/:medication_id', {
                templateUrl: '/static/apps/patient_manager/partials/medication-page.html',
                controller: 'MedicationCtrl'
            })
            .when('/document/:documentId', {
                templateUrl: '/static/apps/document/document-page.template.html',
                controller: 'ViewDocumentCtrl'
            })
            .otherwise('/');
    });
    ManagerApp.run(function (CollapseService, sharedService) {
        // Loading general setting, risk setting is failed to load -> deferred setting value
        sharedService.getSettings().then(function (response) {
            angular.forEach(response.data.settings, function (value, key) {
                sharedService.settings[key] = JSON.parse(value);
            });
        });
        CollapseService.initHotKey();
    });
    ManagerApp.factory('CollapseService', function (hotkeys, $location, $timeout, $rootScope) {
        let CollapseService = {
            show_homepage_tab: 'problems',
            show_colon_collapse: false,
            show_a1c_collapse: false,
            show_inr_collapse: false,
            innerProblemTabSetActive: 0,
            ChangeColonCollapse: ChangeColonCollapse,
            ChangeA1cCollapse: ChangeA1cCollapse,
            ChangeHomepageTab: ChangeHomepageTab,
            ChangeInrCollapse: ChangeInrCollapse,
            initHotKey: initHotKey
        };
        return CollapseService;

        function ChangeColonCollapse() {
            CollapseService.show_colon_collapse = !CollapseService.show_colon_collapse;
        }

        function ChangeA1cCollapse() {
            CollapseService.show_a1c_collapse = !CollapseService.show_a1c_collapse;
        }

        function ChangeHomepageTab(tab) {
            CollapseService.show_homepage_tab = tab;
        }

        function ChangeInrCollapse() {
            CollapseService.show_inr_collapse = !CollapseService.show_inr_collapse;
        }

        function initHotKey() {
            hotkeys.add({
                combo: 'ctrl+shift+h',
                description: 'Open Fit & Well',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    $location.path(`/problem/${$('#fit_and_well').val()}`);
                }
            });

            hotkeys.add({
                combo: 'ctrl+i',
                description: 'Go to Problem tab',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('problems');
                    CollapseService.innerProblemTabSetActive = 0;

                    $location.path('/');

                    setTimeout(() => {
                        window.scrollTo(0, $(".tab-problems").position().top);
                    }, 100);
                }
            });

            hotkeys.add({
                combo: 'ctrl+s',
                description: 'Go to My story tab',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('mystory');

                    $location.path('/');

                    $rootScope.$broadcast('tabPressed', {});
                }
            });
            hotkeys.add({
                combo: 'ctrl+d',
                description: 'Go to Data tab',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('data');
                    $location.path('/');
                }
            });
            hotkeys.add({
                combo: 'ctrl+m',
                description: 'Go to Medication tab',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('medication');
                    $location.path('/');
                }
            });
            hotkeys.add({
                combo: 'ctrl+shift+i',
                description: 'Go to add new problem',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('problems');
                    CollapseService.innerProblemTabSetActive = 2;
                    $location.path('/');
                }
            });
            hotkeys.add({
                combo: 'ctrl+shift+m',
                description: 'Go to add new medication',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    CollapseService.ChangeHomepageTab('medication');
                    $location.path('/');
                    $timeout(function () {
                        $('medication input[type=text]').focus();
                    }, 500);
                }
            });
            hotkeys.add({
                combo: 'ctrl+c',
                description: 'Copy most recent encounter to clipboard',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    $location.path('/');
                    $rootScope.$broadcast('copyEncounter', {});
                }
            });
            hotkeys.add({
                combo: 'tab',
                description: 'Navigate through My Story text component',
                allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                callback: function (event, hotkey) {
                    $rootScope.$broadcast('tabPressed', null);
                }
            });
        }
    });
    ManagerApp.constant('RECORDER_STATUS', {
        isRecording: 0,
        isPaused: 1,
        isStopped: 2
    }).constant('AUDIO_UPLOAD_STATUS', {
        isInitialize: 0,
        isUploading: 1,
        isUploaded: 2
    }).constant('LABELS', [
        {name: 'green', css_class: 'todo-label-green'},
        {name: 'yellow', css_class: 'todo-label-yellow'},
        {name: 'orange', css_class: 'todo-label-orange'},
        {name: 'red', css_class: 'todo-label-red'},
        {name: 'purple', css_class: 'todo-label-purple'},
        {name: 'blue', css_class: 'todo-label-blue'},
        {name: 'sky', css_class: 'todo-label-sky'},
    ]).constant('VIEW_MODES', [
        {label: 'All', value: 0},
        {label: 'Week', value: 1},
        {label: 'Month', value: 2},
        {label: 'Year', value: 3},
    ]).constant('TODO_LIST', {
        'NONE': 0,
        'INR': 1,
        'A1C': 2,
        'COLON_CANCER_SCREENING': 3
    });
})();