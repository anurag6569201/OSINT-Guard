from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health, name='health'),
    path('collect/', views.collect_osint_view, name='collect'),
    path('ai/insights/', views.ai_insights_view, name='ai_insights'),
    path('summary/', views.ai_insights_view, name='summary'),
]
