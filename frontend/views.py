from django.shortcuts import render, redirect


def index_view(request):
    return redirect('login')


def login_view(request):
    return render(request, 'frontend/login.html')


def register_view(request):
    return render(request, 'frontend/register.html')


def profile_view(request):
    return render(request, 'frontend/profile.html')


def users_view(request):
    return render(request, 'frontend/users.html')


def forgot_password_view(request):
    return render(request, 'frontend/forgot_password.html')


def reset_password_view(request):
    return render(request, 'frontend/reset_password.html')
