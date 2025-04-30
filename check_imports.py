import sys
import importlib.util

print("=== SYSTEM PATH ===")
for idx, path in enumerate(sys.path, 1):
    print(f"{idx}. {path}")

print("\n=== ATTEMPTING REGULAR IMPORT ===")
try:
    from django.db.migrations import migration
    print("✅ Success! Django migrations imported normally")
    print(f"Migration module path: {migration.__file__}")
except ImportError as e:
    print(f"❌ Regular import failed: {e}")
    
    print("\n=== ATTEMPTING MANUAL IMPORT ===")
    migration_path = f"{sys.prefix}/lib/python{sys.version_info.major}.{sys.version_info.minor}/site-packages/django/db/migrations/migration.py"
    print(f"Trying to load: {migration_path}")
    
    try:
        spec = importlib.util.spec_from_file_location("migration", migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        print(f"✅ Manual load successful! Migration version: {migration.__version__}")
    except Exception as e:
        print(f"❌ Manual import failed: {e}")
        print("\n=== SUGGESTED ACTIONS ===")
        print("1. Try recreating virtual environment")
        print("2. Reinstall Django with: pip install --force-reinstall django")
        print("3. Check Python version compatibility")

if __name__ == "__main__":
    print("\n=== FINAL DIAGNOSIS ===")
    try:
        import django
        print(f"Django version: {django.__version__}")
        print(f"Python version: {sys.version}")
        print(f"Virtualenv: {sys.prefix}")
    except Exception as e:
        print(f"Critical error: {e}")
