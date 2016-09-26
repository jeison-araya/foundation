from datetime import datetime
from django.db.models import Max
from django.core.servers.basehttp import FileWrapper
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.decorators import api_view
from common.views import *

from emr.models import UserProfile, ToDo, ToDoGroup, ToDoComment, Label, ToDoAttachment, EncounterTodoRecord, \
    Encounter, TodoActivity, TaggedToDoOrder, LabeledToDoList, PhysicianTeam, PatientController, SharingPatient
from emr.operations import op_add_event, op_add_todo_event

from .serializers import TodoSerializer, TodoGroupSerializer, ToDoCommentSerializer, SafeUserSerializer, \
    TodoActivitySerializer, LabelSerializer, LabeledToDoListSerializer
from users_app.serializers import UserProfileSerializer

from problems_app.operations import add_problem_activity
from .operations import add_todo_activity


def is_patient(user):
    try:
        profile = UserProfile.objects.get(user=user)
        return profile.role == 'patient'
    except UserProfile.DoesNotExist:
        return False


# set problem authentication to false if not physician, admin
def set_problem_authentication_false(request, todo):
    if todo.problem:
        problem = todo.problem
        actor_profile = UserProfile.objects.get(user=request.user)
        authenticated = actor_profile.role in ("physician", "admin")
        problem.authenticated = authenticated
        problem.save()


@login_required
def get_todo_activity(request, todo_id, last_id):
    activities = TodoActivity.objects.filter(todo_id=todo_id).filter(id__gt=last_id)
    resp = {}
    resp['activities'] = TodoActivitySerializer(activities, many=True).data
    resp['success'] = True
    return ajax_response(resp)


# Todos
@permissions_required(["add_todo"])
@login_required
def add_patient_todo(request, patient_id):
    todo_name = request.POST.get('name')
    due_date = request.POST.get('due_date', None)
    if due_date:
        due_date = datetime.strptime(due_date, '%m/%d/%Y').date()

    patient = User.objects.get(id=patient_id)
    physician = request.user

    new_todo = ToDo.objects.add_patient_todo(patient, todo_name, due_date)
    if new_todo.problem:
        problem_name = new_todo.problem.problem_name
    else:
        problem_name = ''
    summary = '''Added <u>todo</u> <a href="#/todo/%s"><b>%s</b></a> for <u>problem</u> <b>%s</b>''' % (
        new_todo.id, todo_name, problem_name)

    op_add_todo_event(physician, patient, summary, new_todo)

    actor_profile = UserProfile.objects.get(user=request.user)
    activity = "Added this todo."
    add_todo_activity(new_todo, actor_profile, activity)

    resp = {}
    resp['todo'] = TodoSerializer(new_todo).data
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["set_todo_status"])
@login_required
@api_view(["POST"])
def update_todo_status(request, todo_id):
    accomplished = request.POST.get('accomplished') == 'true'

    todo = ToDo.objects.get(id=todo_id)
    todo.accomplished = accomplished
    # If item is moved to accomplished also remove it from current folder
    if (accomplished):
        todo.group = None
    todo.save(update_fields=["accomplished", "group"])
    # set problem authentication
    set_problem_authentication_false(request, todo)

    physician = request.user
    patient = todo.patient

    problem_name = todo.problem.problem_name if todo.problem else ""
    accomplished_label = 'accomplished' if accomplished else "not accomplished"

    summary = """
    Updated status of <u>todo</u> : <a href="#/todo/%s"><b>%s</b></a> ,
    <u>problem</u> <b>%s</b> to <b>%s</b>
    """ % (todo.id, todo.todo, problem_name, accomplished_label)

    op_add_todo_event(physician, patient, summary, todo)

    actor_profile = UserProfile.objects.get(user=request.user)
    if todo.problem:
        add_problem_activity(todo.problem, actor_profile, summary, 'output')
        if accomplished:
            op_add_event(physician, patient, summary, todo.problem, True)

    # todo activity
    activity = "Updated status of this todo to <b>%s</b>." % (accomplished_label)
    add_todo_activity(todo, actor_profile, activity)

    todos = ToDo.objects.filter(patient=patient)
    accomplished_todos = [todo for todo in todos if todo.accomplished]
    pending_todos = [todo for todo in todos if not todo.accomplished]

    resp = {}
    resp['success'] = True
    resp['accomplished_todos'] = TodoSerializer(accomplished_todos, many=True).data
    resp['pending_todos'] = TodoSerializer(pending_todos, many=True).data
    return ajax_response(resp)


@permissions_required(["set_todo_order"])
@login_required
def update_order(request):
    # TODO: Need to understand the logic behind this API
    resp = {}
    datas = json.loads(request.body)
    id_todos = datas['todos']
    actor_profile = UserProfile.objects.get(user=request.user)
    # patient's todo order
    if datas.has_key('patient_id'):
        patient_id = datas['patient_id']
        patient = User.objects.get(id=patient_id)

        todos = ToDo.objects.filter(id__in=id_todos).order_by('order')
        todos_order = []
        for todo in todos:
            todos_order.append(todo.order)

        key = 0
        for id in id_todos:
            todo = ToDo.objects.get(id=int(id))
            if not todos_order[key]:
                order = ToDo.objects.filter(patient=patient).aggregate(Max('order'))
                if not order['order__max']:
                    order = 1
                else:
                    order = order['order__max'] + 1
                todo.order = order
            else:
                todo.order = todos_order[key]
            todo.save()
            key = key + 1

        # set problem authentication
        set_problem_authentication_false(request, todo)

        # todo activity
        activity = '''
            Updated order of this todo.
        '''
        add_todo_activity(todo, actor_profile, activity)
    # tagged todo order
    if datas.has_key('tagged_user_id'):
        tagged_user_id = datas['tagged_user_id']
        user = User.objects.get(id=tagged_user_id)

        todos = TaggedToDoOrder.objects.filter(todo__id__in=id_todos).order_by('order')
        todos_order = []
        for todo in todos:
            todos_order.append(todo.order)

        key = 0
        for id in id_todos:
            todo = TaggedToDoOrder.objects.get(todo__id=int(id), user=user)
            if not todos_order[key]:
                order = TaggedToDoOrder.objects.filter(user=user).aggregate(Max('order'))
                if not order['order__max']:
                    order = 1
                else:
                    order = order['order__max'] + 1
                todo.order = order
            else:
                todo.order = todos_order[key]
            todo.save()
            key = key + 1
    # staff todo
    if datas.has_key('staff_id'):
        staff_id = datas['staff_id']
        user = User.objects.get(id=staff_id)

        todos = ToDo.objects.filter(id__in=id_todos).order_by('order')
        todos_order = []
        for todo in todos:
            todos_order.append(todo.order)

        key = 0
        for id in id_todos:
            todo = ToDo.objects.get(id=int(id))
            if not todos_order[key]:
                order = ToDo.objects.filter(user=user).aggregate(Max('order'))
                if not order['order__max']:
                    order = 1
                else:
                    order = order['order__max'] + 1
                todo.order = order
            else:
                todo.order = todos_order[key]
            todo.save()
            key = key + 1

        # todo activity
        activity = '''
            Updated order of this todo.
        '''
        add_todo_activity(todo, actor_profile, activity)

    # list todo
    if datas.has_key('list_id'):
        list_id = datas['list_id']
        labeled_list = LabeledToDoList.objects.get(id=int(list_id))
        labeled_list.todo_list = datas['todos']
        labeled_list.save()

    resp['success'] = True
    return ajax_response(resp)


@login_required
def get_todo_info(request, todo_id):
    from encounters_app.serializers import EncounterSerializer
    todo_info = ToDo.objects.get(id=todo_id)
    comments = ToDoComment.objects.filter(todo=todo_info)
    attachments = ToDoAttachment.objects.filter(todo=todo_info)
    attachment_todos_holder = []
    for attachment in attachments:
        attachment_dict = {
            'attachment': attachment.filename(),
            'datetime': datetime.strftime(attachment.datetime, '%Y-%m-%d'),
            'id': attachment.id,
            'user': SafeUserSerializer(attachment.user).data,
            'todo': TodoSerializer(attachment.todo).data,
        }
        attachment_todos_holder.append(attachment_dict)

    encounter_ids = EncounterTodoRecord.objects.filter(todo=todo_info).values_list("encounter__id", flat=True)
    related_encounters = Encounter.objects.filter(id__in=encounter_ids)

    activities = TodoActivity.objects.filter(todo=todo_info)

    sharing_patients = SharingPatient.objects.filter(shared=todo_info.patient).order_by('sharing__first_name',
                                                                                        'sharing__last_name')
    sharing_patients_list = []
    for sharing_patient in sharing_patients:
        user_dict = UserProfileSerializer(sharing_patient.sharing.profile).data
        user_dict['problems'] = [x.id for x in sharing_patient.problems.all()]
        sharing_patients_list.append(user_dict)

    resp = {}
    resp['success'] = True
    resp['info'] = TodoSerializer(todo_info).data
    resp['comments'] = ToDoCommentSerializer(comments, many=True).data
    resp['attachments'] = attachment_todos_holder
    resp['related_encounters'] = EncounterSerializer(related_encounters, many=True).data
    resp['activities'] = TodoActivitySerializer(activities, many=True).data
    resp['sharing_patients'] = sharing_patients_list
    return ajax_response(resp)


@permissions_required(["add_todo_comment"])
@login_required
def add_todo_comment(request, todo_id):
    resp = {}
    comment = request.POST.get('comment')
    todo_comment = ToDoComment.objects.create(todo_id=todo_id, user=request.user, comment=comment)
    resp['comment'] = ToDoCommentSerializer(todo_comment).data
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo_comment"])
@login_required
def edit_todo_comment(request, comment_id):
    resp = {}
    comment = request.POST.get('comment')
    todo_comment = ToDoComment.objects.get(id=comment_id)
    todo_comment.comment = comment
    todo_comment.save(update_fields=["comment"])
    resp['comment'] = ToDoCommentSerializer(todo_comment).data
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["delete_todo_comment"])
@login_required
def delete_todo_comment(request, comment_id):
    resp = {}
    ToDoComment.objects.get(id=comment_id).delete()
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def change_todo_text(request, todo_id):
    resp = {}
    todo_text = request.POST.get('todo')
    todo = ToDo.objects.get(id=todo_id)
    todo.todo = todo_text
    todo.save(update_fields=["todo"])

    # set problem authentication
    set_problem_authentication_false(request, todo)
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def change_todo_due_date(request, todo_id):
    resp = {}
    due_date = request.POST.get('due_date')
    todo = ToDo.objects.get(id=todo_id)
    actor_profile = UserProfile.objects.get(user=request.user)
    if due_date:
        try:
            due_date = datetime.strptime(due_date, '%m/%d/%Y').date()
        except:
            resp['success'] = False
            resp['todo'] = TodoSerializer(todo).data
            return ajax_response(resp)
    else:
        due_date = None

    todo.due_date = due_date
    todo.save(update_fields=["due_date"])

    # set problem authentication
    set_problem_authentication_false(request, todo)

    # todo activity
    if due_date:
        activity = "Changed due date of this todo to <b>%s</b>." % (request.POST.get('due_date'))
    else:
        activity = "Removed due date of this todo."
    add_todo_activity(todo, actor_profile, activity)

    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def add_todo_label(request, label_id, todo_id):
    resp = {}
    todo = ToDo.objects.get(id=todo_id)
    label = Label.objects.get(id=label_id)
    todo.labels.add(label)
    # set problem authentication
    set_problem_authentication_false(request, todo)
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def remove_todo_label(request, label_id, todo_id):
    resp = {}
    label = Label.objects.get(id=label_id)
    todo = ToDo.objects.get(id=todo_id)
    todo.labels.remove(label)
    # set problem authentication
    set_problem_authentication_false(request, todo)
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def new_todo_label(request, todo_id):
    resp = {}
    resp['status'] = False
    resp['new_status'] = False

    name = request.POST.get('name')
    css_class = request.POST.get('css_class')
    is_all = True if request.POST.get('is_all', False) else False

    if not name == 'screening':
        todo = ToDo.objects.get(id=todo_id)
        label = Label.objects.filter(name=name, css_class=css_class).first()
        if not label:
            label = Label.objects.create(name=name, css_class=css_class,
                                         author=request.user, is_all=is_all)
            resp['new_status'] = True
            resp['new_label'] = LabelSerializer(label).data

        if label.is_all or label.author == request.user:
            if label not in todo.labels.all():
                todo.labels.add(label)
                resp['status'] = True
                resp['label'] = LabelSerializer(label).data

        # set problem authentication
        set_problem_authentication_false(request, todo)
        resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def save_edit_label(request, label_id):
    resp = {}
    resp['status'] = False
    name = request.POST.get('name')
    css_class = request.POST.get('css_class')

    if not name == 'screening':
        label = Label.objects.get(id=label_id)
        if not label.name == 'screening':
            if not Label.objects.filter(name=name, css_class=css_class):
                label.name = name
                label.css_class = css_class
                label.save()
                resp['status'] = True

            resp['label'] = LabelSerializer(label).data
            resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def delete_label(request, label_id):
    resp = {}
    resp['status'] = False

    label = Label.objects.get(id=label_id)
    if not label.name == 'screening':
        label.delete()
        resp['success'] = True
    return ajax_response(resp)


@login_required
def todo_access_encounter(request, todo_id):
    resp = {}
    todo = ToDo.objects.get(id=todo_id)
    physician = request.user
    patient = todo.patient

    if todo.problem:
        summary = '''<a href="#/todo/%s"><b>%s</b></a> for <b>%s</b> was visited.''' % (
            todo.id, todo.todo, todo.problem.problem_name)
    else:
        summary = '''<a href="#/todo/%s"><b>%s</b></a> was visited.''' % (todo.id, todo.todo)

    op_add_todo_event(physician, patient, summary, todo)
    if todo.problem:
        op_add_event(physician, patient, summary, todo.problem, True)

    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
@api_view(["POST"])
def add_todo_attachment(request, todo_id):
    attachment = ToDoAttachment.objects.create(todo_id=todo_id, user=request.user, attachment=request.FILES['0'])
    actor_profile = UserProfile.objects.get(user=request.user)
    resp = {}
    resp['success'] = True

    attachment_dict = {
        'attachment': attachment.filename(),
        'datetime': datetime.strftime(attachment.datetime, '%Y-%m-%d'),
        'id': attachment.id,
        'user': SafeUserSerializer(attachment.user).data,
        'todo': TodoSerializer(attachment.todo).data,
    }
    resp['attachment'] = attachment_dict
    # todo activity
    activity = "Attached <b>%s</b> to this todo." % (attachment.filename())
    add_todo_activity(todo, actor_profile, activity, comment=None, attachment=attachment)
    return ajax_response(resp)


def download_attachment(request, attachment_id):
    """
    Create a file to download.
    """
    attachment = ToDoAttachment.objects.get(id=attachment_id)
    wrapper = FileWrapper(attachment.attachment)
    response = HttpResponse(wrapper, content_type='application/%s' % attachment.file_extension_lower())

    filename = '{}.{}'.format(attachment.filename(), attachment.file_extension_lower())
    response['Content-Disposition'] = 'attachment; filename={}'.format(filename)
    return response


@permissions_required(["add_todo"])
@login_required
def delete_attachment(request, attachment_id):
    attachment = ToDoAttachment.objects.get(id=attachment_id)
    actor_profile = UserProfile.objects.get(user=request.user)
    # todo activity
    activity = '''
        Deleted <b>%s</b> from this todo.
    ''' % (attachment.filename())
    add_todo_activity(attachment.todo, actor_profile, activity)
    attachment.delete()

    resp = {}
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def add_todo_member(request, todo_id):
    resp = {}
    actor_profile = UserProfile.objects.get(user=request.user)
    member_id = request.POST.get('id')
    todo = ToDo.objects.get(id=todo_id)
    member = UserProfile.objects.get(id=int(member_id))
    todo.members.add(member)

    tagged_todo = TaggedToDoOrder.objects.create(todo=todo, user=member.user)
    # set problem authentication
    set_problem_authentication_false(request, todo)

    # todo activity
    activity = '''
        <b>%s %s - %s</b> joined this todo.
    ''' % (member.user.first_name, member.user.last_name, member.role)
    add_todo_activity(todo, actor_profile, activity)

    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def remove_todo_member(request, todo_id):
    resp = {}
    actor_profile = UserProfile.objects.get(user=request.user)
    member_id = request.POST.get('id')
    todo = ToDo.objects.get(id=todo_id)
    member = UserProfile.objects.get(id=int(member_id))
    todo.members.remove(member)
    tagged_todo = TaggedToDoOrder.objects.filter(todo=todo, user=member.user).first()
    if tagged_todo:
        tagged_todo.delete()

    # set problem authentication
    set_problem_authentication_false(request, todo)

    # todo activity
    activity = '''
        <b>%s %s - %s</b> left this todo.
    ''' % (member.user.first_name, member.user.last_name, member.role)
    add_todo_activity(todo, actor_profile, activity)

    resp['success'] = True
    return ajax_response(resp)


@login_required
def get_labels(request, user_id):
    labels = Label.objects.filter(Q(is_all=True) | (Q(is_all=False) & Q(author_id=user_id)))
    resp = {}
    resp['labels'] = LabelSerializer(labels, many=True).data
    return ajax_response(resp)


@login_required
def get_user_todos(request, user_id):
    tagged_todo_order = TaggedToDoOrder.objects.filter(user_id=user_id).order_by('order', 'todo__due_date')
    tagged_todos = [t.todo for t in tagged_todo_order]
    personal_todos = ToDo.objects.filter(user_id=user_id).order_by('order', 'due_date')

    resp = {}
    resp['tagged_todos'] = TodoSerializer(tagged_todos, many=True).data
    resp['personal_todos'] = TodoSerializer(personal_todos, many=True).data
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def add_staff_todo(request, user_id):
    todo_name = request.POST.get('name')
    due_date = request.POST.get('due_date', None)
    if due_date:
        due_date = datetime.strptime(due_date, '%m/%d/%Y').date()

    actor_profile = UserProfile.objects.get(user=request.user)
    new_todo = ToDo.objects.add_staff_todo(user_id, todo_name, due_date)
    # todo activity
    activity = "Added this todo."
    add_todo_activity(new_todo, actor_profile, activity)

    resp = {}
    resp['todo'] = TodoSerializer(new_todo).data
    resp['success'] = True
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def add_staff_todo_list(request, user_id):
    resp = {}
    data = json.loads(request.body)
    list_name = data['name']
    labels = data['labels']
    user = User.objects.get(id=user_id)

    new_list = LabeledToDoList.objects.create(user_id=user_id, name=list_name)

    label_ids = []
    for label in labels:
        l = Label.objects.get(id=label['id'])
        new_list.labels.add(l)
        label_ids.append(l.id)

    todos = ToDo.objects.filter(labels__id__in=label_ids).distinct().order_by('due_date')

    new_list_dict = LabeledToDoListSerializer(new_list).data
    new_list_dict['todos'] = TodoSerializer(todos, many=True).data
    new_list_dict['expanded'] = new_list.expanded

    resp['new_list'] = new_list_dict
    resp['success'] = True
    return ajax_response(resp)


@login_required
def get_user_label_lists(request, user_id):
    resp = {}
    user = User.objects.get(id=user_id)
    lists = LabeledToDoList.objects.filter(user=user)
    lists_holder = []
    for label_list in lists:
        list_dict = LabeledToDoListSerializer(label_list).data

        # TODO: Have to simplify the below logic, after understand what is being done here.
        label_ids = [l.id for l in label_list.labels.all()]
        if label_list.todo_list:
            todos_qs = ToDo.objects.filter(labels__id__in=label_ids).distinct()
            todos = []
            for id in label_list.todo_list:
                if todos_qs.filter(id=id):
                    todos.append(todos_qs.get(id=id))
            for todo in todos_qs:
                if not todo in todos:
                    todos.append(todo)

        else:
            todos = ToDo.objects.filter(labels__id__in=label_ids).distinct().order_by('due_date')

        list_dict['todos'] = TodoSerializer(todos, many=True).data
        list_dict['expanded'] = label_list.expanded
        lists_holder.append(list_dict)

    resp['todo_lists'] = lists_holder
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def delete_todo_list(request, list_id):
    LabeledToDoList.objects.get(id=list_id).delete()
    resp = {}
    resp['success'] = True
    return ajax_response(resp)


@login_required
def staff_all_todos(request, user_id):
    resp = {}
    staff = User.objects.get(id=user_id)
    team_members = PhysicianTeam.objects.filter(member_id=user_id)
    physician_ids = [x.physician.id for x in team_members]
    patient_controllers = PatientController.objects.filter(physician__id__in=physician_ids)
    patient_ids = [x.patient.id for x in patient_controllers]
    todos = ToDo.objects.filter(accomplished=False, patient__id__in=patient_ids,
                                due_date__lte=datetime.now()).order_by('-due_date')
    resp['all_todos_list'] = TodoSerializer(todos, many=True).data
    return ajax_response(resp)


@permissions_required(["add_todo"])
@login_required
def open_todo_list(request, list_id):
    resp = {}
    todo_list = LabeledToDoList.objects.get(id=list_id)
    expanded = todo_list.expanded
    data = json.loads(request.body)
    todos = data['todos']

    for todo in todos:
        if not todo['id'] in expanded:
            expanded.append(todo['id'])

    todo_list.expanded = expanded
    todo_list.save()
    resp['success'] = True
    return ajax_response(resp)


# TODO: AnhDN Where to used to manipulate database object
@login_required
def create_todo_group(request, patient_id):
    group_name = request.POST.get('name')
    todo_A = ToDo.objects.get(id=request.POST.get('todo_1'))
    todo_B = ToDo.objects.get(id=request.POST.get('todo_2'))
    patient = User.objects.get(id=patient_id)
    resp = {}

    # Create new todoGroup item
    group = ToDoGroup(name=group_name, patient=patient, order=todo_A.order)
    group.save()

    # Update group of first todo item
    todo_A.group = group
    todo_A.save()

    # Update group of second todo item
    todo_B.group = group
    todo_B.save()

    # Update new data
    groups = ToDoGroup.objects.filter(patient_id=patient_id).order_by("order")
    ungroup_todos = ToDo.objects.filter(patient_id=patient_id).filter(group_id=None).order_by("order")

    resp['success'] = True
    resp['groups'] = TodoGroupSerializer(groups, many=True).data + TodoSerializer(ungroup_todos, many=True).data

    return ajax_response(resp)


@login_required
def update_todo_group(request, todo_group_id):
    resp = {}
    group_name = request.POST.get('name')
    order = request.POST.get('order')
    group = ToDoGroup.objects.get(id=todo_group_id)

    # TODO: Need to check permission
    # if(group.patient_id == patient):
    group.name = group_name
    group.order = order
    group.save()

    resp['success'] = True
    return ajax_response(resp)


@login_required
def remove_todo_group(request, todo_group_id):
    resp = {}
    patient = request.POST.get('patient')
    group = ToDoGroup.objects.get(id=todo_group_id)
    # TODO: Need to check permission
    # if(group.patient_id ==patient)
    group.delete()

    # Get updated data
    groups = ToDoGroup.objects.filter(patient_id=patient).order_by("order")
    ungroup_todos = ToDo.objects.filter(patient_id=patient).filter(group_id=None).order_by("order")

    resp['success'] = True
    resp['groups'] = TodoGroupSerializer(groups, many=True).data + TodoSerializer(ungroup_todos, many=True).data

    return ajax_response(resp)


# Update group of an todo item
@login_required
def update_group(request):
    patient = request.POST.get('patient')
    group = request.POST.get('group')
    todo = ToDo.objects.get(id=request.POST.get('todo'))
    resp = {}
    # TODO: Need to check permission
    # if(todo.patient_id == patient):
    todo.group_id = group
    todo.save()

    resp['success'] = True
    return ajax_response(resp)
