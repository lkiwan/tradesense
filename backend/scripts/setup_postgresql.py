"""
PostgreSQL Setup Helper
=======================
This script helps verify PostgreSQL installation and create the database.

Usage:
    python scripts/setup_postgresql.py
"""

import os
import sys
import subprocess

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def check_postgresql_installed():
    """Check if PostgreSQL is installed and accessible."""
    try:
        result = subprocess.run(
            ['psql', '--version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"✓ PostgreSQL is installed: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass

    print("✗ PostgreSQL command-line tools not found in PATH")
    return False


def check_postgresql_running():
    """Check if PostgreSQL server is running."""
    try:
        result = subprocess.run(
            ['pg_isready', '-h', 'localhost', '-p', '5432'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✓ PostgreSQL server is running")
            return True
        else:
            print("✗ PostgreSQL server is not running")
            return False
    except FileNotFoundError:
        print("? Cannot check if PostgreSQL is running (pg_isready not found)")
        return None


def check_database_exists():
    """Check if tradesense database exists."""
    try:
        result = subprocess.run(
            ['psql', '-h', 'localhost', '-U', 'postgres', '-lqt'],
            capture_output=True,
            text=True,
            env={**os.environ, 'PGPASSWORD': os.getenv('PGPASSWORD', 'postgres')}
        )
        if 'tradesense' in result.stdout:
            print("✓ Database 'tradesense' exists")
            return True
        else:
            print("✗ Database 'tradesense' does not exist")
            return False
    except Exception as e:
        print(f"? Cannot check database: {e}")
        return None


def create_database():
    """Create the tradesense database."""
    print("\nAttempting to create 'tradesense' database...")
    try:
        result = subprocess.run(
            ['createdb', '-h', 'localhost', '-U', 'postgres', 'tradesense'],
            capture_output=True,
            text=True,
            env={**os.environ, 'PGPASSWORD': os.getenv('PGPASSWORD', 'postgres')}
        )
        if result.returncode == 0:
            print("✓ Database 'tradesense' created successfully")
            return True
        else:
            print(f"✗ Failed to create database: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        return False


def print_windows_instructions():
    """Print PostgreSQL installation instructions for Windows."""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║           PostgreSQL Installation Guide for Windows               ║
╚══════════════════════════════════════════════════════════════════╝

Option 1: Download from Official Website
────────────────────────────────────────
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download PostgreSQL 16 (latest)
4. Run the installer
5. Remember the password you set for 'postgres' user
6. Default port: 5432

Option 2: Using Chocolatey (if installed)
─────────────────────────────────────────
   choco install postgresql16

Option 3: Using Winget
──────────────────────
   winget install PostgreSQL.PostgreSQL

After Installation:
───────────────────
1. Add PostgreSQL to PATH:
   - Open System Properties > Environment Variables
   - Add: C:\\Program Files\\PostgreSQL\\16\\bin to PATH

2. Create the database:
   - Open Command Prompt as Administrator
   - Run: createdb -U postgres tradesense
   - Enter password when prompted

3. Update .env file:
   - Set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/tradesense

4. Run migration:
   python scripts/migrate_to_postgresql.py
""")


def print_connection_test():
    """Test PostgreSQL connection with Python."""
    print("\n=== Testing Python PostgreSQL Connection ===")
    try:
        from dotenv import load_dotenv
        load_dotenv()

        import psycopg2
        pg_url = os.getenv('POSTGRESQL_URL', 'postgresql://postgres:postgres@localhost:5432/tradesense')

        # Parse URL
        from urllib.parse import urlparse
        parsed = urlparse(pg_url)

        conn = psycopg2.connect(
            host=parsed.hostname or 'localhost',
            port=parsed.port or 5432,
            user=parsed.username or 'postgres',
            password=parsed.password or 'postgres',
            dbname=parsed.path.lstrip('/') or 'tradesense'
        )
        conn.close()
        print("✓ Python can connect to PostgreSQL!")
        return True
    except ImportError:
        print("✗ psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False


def main():
    """Main setup function."""
    print("=" * 60)
    print("PostgreSQL Setup Helper for TradeSense")
    print("=" * 60)

    # Check installation
    print("\n=== Checking PostgreSQL Installation ===")
    installed = check_postgresql_installed()

    if not installed:
        print_windows_instructions()
        return

    # Check if running
    running = check_postgresql_running()

    if running is False:
        print("\nPlease start PostgreSQL service:")
        print("  - Windows: Open Services and start 'postgresql-x64-16'")
        print("  - Or run: net start postgresql-x64-16")
        return

    # Check database
    print("\n=== Checking Database ===")
    db_exists = check_database_exists()

    if db_exists is False:
        create = input("\nWould you like to create the database? (y/n): ")
        if create.lower() == 'y':
            create_database()

    # Test Python connection
    print_connection_test()

    print("\n" + "=" * 60)
    print("Setup check complete!")
    print("\nTo migrate data from SQLite to PostgreSQL, run:")
    print("  python scripts/migrate_to_postgresql.py")
    print("=" * 60)


if __name__ == '__main__':
    main()
