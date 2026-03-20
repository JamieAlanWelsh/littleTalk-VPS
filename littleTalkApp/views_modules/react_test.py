from django.shortcuts import render

def hi_from_react(request):
    return render(request, "hello_from_react.html")