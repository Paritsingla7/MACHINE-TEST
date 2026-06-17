from django.shortcuts import render


def register_view(request):
    return render(request, 'frontend/register.html')


def users_view(request):
    return render(request, 'frontend/users.html')
