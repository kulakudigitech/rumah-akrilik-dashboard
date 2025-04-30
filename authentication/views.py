from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse

def login_view(request):
    return JsonResponse({"status": "ok"})

