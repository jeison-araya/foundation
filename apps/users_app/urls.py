from django.conf.urls import patterns, url


urlpatterns = patterns(
    'users_app.views',
    url(r'^login/$', 'login_user'),
    url(r'^logout/$', 'logout_user'),
    url(r'^register/$', 'register_user'),
    url(r'^home/$', 'home'),
    url(r'^staff/$', 'staff'),
    url(r'^patient/manage/(?P<user_id>\d+)/$', 'manage_patient'),
    url(r'^patient/(?P<patient_id>\d+)/info$', 'get_patient_info'),
    url(r'^patient/(?P<patient_id>\d+)/timelineinfo$', 'get_timeline_info'),
    url(r'^patient/(?P<patient_id>\d+)/patient_todos_info$', 'get_patient_todos_info'),
    url(r'^user_info/(?P<user_id>\d+)/info/$', 'user_info'),

    url(
        r'^patient/(?P<patient_id>\d+)/profile/update_summary$',
        'update_patient_summary'),
    url(
        r'^patient/(?P<patient_id>\d+)/profile/update_password$',
        'update_patient_password'),
    url(
        r'^patient/(?P<patient_id>\d+)/update/basic$',
        'update_basic_profile'),
    url(
        r'^patient/(?P<patient_id>\d+)/update/profile$',
        'update_profile'),
    url(
        r'^patient/(?P<patient_id>\d+)/update/email$',
        'update_patient_email'),

    url(r'^active/user/$', 'fetch_active_user'),
    url(r'^members/(?P<user_id>\d+)/getlist/$','get_patient_members'),
    url(r'^patients/$', 'get_patients_list'),
    url(r'^patient/add_sharing_patient/(?P<patient_id>\d+)/(?P<sharing_patient_id>\d+)$', 'add_sharing_patient'),
    url(r'^patient/remove_sharing_patient/(?P<patient_id>\d+)/(?P<sharing_patient_id>\d+)$', 'remove_sharing_patient'),
    url(r'^sharing_patients/(?P<patient_id>\d+)$', 'get_sharing_patients'),
    url(
        r'^patient/(?P<patient_id>\d+)/profile/update_note$',
        'update_patient_note'),
    url(r'^todos_physicians/(?P<user_id>\d+)$', 'get_todos_physicians'),
    )
