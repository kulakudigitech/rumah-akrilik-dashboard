import sys
import importlib.util

def check_migrations():
    try:
        from django.db.migrations import migration
        print("✅ Normal import successful")
        return True
    except ImportError as e:
        print(f"❌ Normal import failed: {e}")
        print("⚠️ Attempting manual import...")
        migration_path = f"{sys.prefix}/lib/python{sys.version_info.major}.{sys.version_info.minor}/site-packages/django/db/migrations/migration.py"
        print(f"Trying path: {migration_path}")
        try:
            spec = importlib.util.spec_from_file_location("django.db.migrations.migration", migration_path)
            if spec:
                migration = importlib.util.module_from_spec(spec)
                sys.modules["django.db.migrations.migration"] = migration
                spec.loader.exec_module(migration)
                print(f"✅ Manual import successful")
                return True
        except Exception as e:
            print(f"❌ Manual import failed: {e}")
        return False

if __name__ == "__main__":
    if check_migrations():
        print("\n=== MIGRATION MODULE INFO ===")
        from django.db.migrations import migration
        print(f"Path: {migration.__file__}")
        print(f"Attributes: {dir(migration)[:10]}... (truncated)")
    else:
        print("\n❌ Critical: Migration module could not be loaded")
        print("Suggested solutions:")
        print("1. Reinstall Django: pip install --force-reinstall django==4.2.11")
        print("2. Recreate virtual environment: rm -rf venv && python -m venv venv")
        print("3. Check Python installation")

    print("\n=== SYSTEM INFO ===")
    print(f"Python path: {sys.path}")
    print(f"Python version: {sys.version}")
    try:
        import django
        print(f"Django version: {django.__version__}")
    except:
        print("Django not installed")
