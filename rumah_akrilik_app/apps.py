from django.apps import AppConfig

class RumahAkrilikAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rumah_akrilik_app'

    def ready(self):
        import rumah_akrilik_app.signals  # Register signals