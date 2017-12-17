from django import forms


SEX_CHOICES = (
    ('male', 'Male'),
    ('female', 'Female'),)

ROLE_CHOICES = (
    ('patient', 'Patient'),
    ('physician', 'Physician'),
    ('mid-level', 'Mid Level PA/NP'),
    ('nurse', 'Nurse'),
    ('secretary', 'Secretary'),
    ('admin', 'Admin'),)

MEMBER_TYPE_CHOICES = (
    ('patient', 'Patient'),
    ('mid-level', 'Mid Level PA/NP'),
    ('nurse', 'Nurse'),
    ('secretary', 'Secretary'),)


class UpdateBasicProfileForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    first_name = forms.CharField(max_length=255, required=True)
    last_name = forms.CharField(max_length=255, required=True)


class UpdateProfileForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    phone_number = forms.CharField(max_length=255, required=False)
    sex = forms.ChoiceField(choices=SEX_CHOICES, required=False)
    role = forms.ChoiceField(choices=ROLE_CHOICES, required=False)
    summary = forms.CharField(required=False)
    cover_image = forms.ImageField(required=False)
    portrait_image = forms.ImageField(required=False)
    date_of_birth = forms.DateField(required=False)


class UpdatePasswordForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    new_password = forms.CharField(max_length=255, required=True)
    verify_password = forms.CharField(max_length=255, required=True)


class UpdateEmailForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    email = forms.EmailField(required=True)


class CreateUserForm(forms.Form):
    first_name = forms.CharField(max_length=255, required=True)
    last_name = forms.CharField(max_length=255, required=True)
    username = forms.CharField(max_length=255, required=True)
    email = forms.EmailField(required=True)
    role = forms.ChoiceField(choices=ROLE_CHOICES, required=True)
    password = forms.CharField(max_length=255, required=True)
    verify_password = forms.CharField(max_length=255, required=True)
    date_of_birth = forms.DateField(required=False)
    sex = forms.ChoiceField(choices=SEX_CHOICES, required=False)
    phone_number = forms.CharField(max_length=255, required=False)
    cover_image = forms.ImageField(required=False)
    portrait_image = forms.ImageField(required=False)
    summary = forms.CharField(required=False)


class AssignPhysicianMemberForm(forms.Form):
    user_id = forms.CharField(max_length=255, required=True)
    member_type = forms.ChoiceField(choices=MEMBER_TYPE_CHOICES, required=True)
    physician_id = forms.CharField(max_length=255, required=True)


class UpdateActiveForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    is_active = forms.BooleanField(required=False)
    active_reason = forms.CharField(required=False)


class UpdateDeceasedDateForm(forms.Form):
    user_id = forms.IntegerField(required=True)
    deceased_date = forms.CharField(required=False)