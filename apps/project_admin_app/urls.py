from django.conf.urls import patterns, include, url

urlpatterns = patterns('project_admin_app.views',

	url(r'^$', 'home', name='pa_home'),

	url(r'^list/users/$', 'list_users', name='pa_list_users'),

)