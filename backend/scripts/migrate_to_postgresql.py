"""
SQLite to PostgreSQL Migration Script
=====================================
This script migrates all data from SQLite to PostgreSQL.

Usage:
1. Ensure PostgreSQL is installed and running
2. Create the PostgreSQL database: createdb tradesense
3. Update POSTGRESQL_URL in .env with your credentials
4. Run: python scripts/migrate_to_postgresql.py

The script will:
1. Export all data from SQLite
2. Create tables in PostgreSQL
3. Import all data into PostgreSQL
4. Verify the migration
"""

import os
import sys
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def get_sqlite_connection():
    """Get SQLite database connection."""
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'instance',
        'tradesense.db'
    )
    if not os.path.exists(db_path):
        print(f"ERROR: SQLite database not found at {db_path}")
        sys.exit(1)
    return sqlite3.connect(db_path)


def get_postgresql_engine():
    """Get PostgreSQL database engine."""
    pg_url = os.getenv('POSTGRESQL_URL', 'postgresql://postgres:postgres@localhost:5432/tradesense')
    return create_engine(pg_url)


def get_table_names(sqlite_conn):
    """Get all table names from SQLite."""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    return [row[0] for row in cursor.fetchall()]


def get_table_schema(sqlite_conn, table_name):
    """Get column info for a table."""
    cursor = sqlite_conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    return cursor.fetchall()


def export_table_data(sqlite_conn, table_name):
    """Export all data from a SQLite table."""
    cursor = sqlite_conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [description[0] for description in cursor.description]
    rows = cursor.fetchall()
    return columns, rows


def sqlite_type_to_pg_type(sqlite_type):
    """Convert SQLite type to PostgreSQL type."""
    type_map = {
        'INTEGER': 'INTEGER',
        'TEXT': 'TEXT',
        'REAL': 'DOUBLE PRECISION',
        'BLOB': 'BYTEA',
        'BOOLEAN': 'BOOLEAN',
        'DATETIME': 'TIMESTAMP',
        'DATE': 'DATE',
        'VARCHAR': 'VARCHAR',
        'FLOAT': 'DOUBLE PRECISION',
    }

    sqlite_type = sqlite_type.upper()
    for key, value in type_map.items():
        if key in sqlite_type:
            # Handle VARCHAR(n)
            if 'VARCHAR' in sqlite_type:
                return sqlite_type.replace('VARCHAR', 'VARCHAR')
            return value
    return 'TEXT'


def create_postgresql_tables(pg_engine, sqlite_conn, tables):
    """Create PostgreSQL tables based on SQLite schema."""
    print("\n=== Creating PostgreSQL Tables ===")

    with pg_engine.connect() as conn:
        for table_name in tables:
            # Get SQLite schema
            schema = get_table_schema(sqlite_conn, table_name)

            # Build CREATE TABLE statement
            columns = []
            for col in schema:
                col_id, col_name, col_type, not_null, default_val, pk = col
                pg_type = sqlite_type_to_pg_type(col_type)

                col_def = f'"{col_name}" {pg_type}'

                if pk:
                    if pg_type == 'INTEGER':
                        col_def = f'"{col_name}" SERIAL PRIMARY KEY'
                    else:
                        col_def += ' PRIMARY KEY'
                elif not_null:
                    col_def += ' NOT NULL'

                columns.append(col_def)

            # Drop table if exists and create new
            drop_sql = f'DROP TABLE IF EXISTS "{table_name}" CASCADE'
            create_sql = f'CREATE TABLE "{table_name}" ({", ".join(columns)})'

            try:
                conn.execute(text(drop_sql))
                conn.execute(text(create_sql))
                conn.commit()
                print(f"  ✓ Created table: {table_name}")
            except Exception as e:
                print(f"  ✗ Error creating table {table_name}: {e}")
                conn.rollback()


def migrate_table_data(pg_engine, table_name, columns, rows):
    """Migrate data from SQLite to PostgreSQL."""
    if not rows:
        print(f"  - {table_name}: No data to migrate")
        return 0

    # Build INSERT statement
    col_names = ', '.join([f'"{c}"' for c in columns])
    placeholders = ', '.join([f':{c}' for c in columns])
    insert_sql = f'INSERT INTO "{table_name}" ({col_names}) VALUES ({placeholders})'

    with pg_engine.connect() as conn:
        count = 0
        for row in rows:
            # Create dict of column: value
            row_dict = {}
            for i, col in enumerate(columns):
                value = row[i]
                # Handle None values
                if value is None:
                    row_dict[col] = None
                # Handle boolean
                elif isinstance(value, bool) or (isinstance(value, int) and col.startswith('is_')):
                    row_dict[col] = bool(value)
                else:
                    row_dict[col] = value

            try:
                conn.execute(text(insert_sql), row_dict)
                count += 1
            except Exception as e:
                print(f"    Error inserting row in {table_name}: {e}")
                print(f"    Row data: {row_dict}")

        conn.commit()
        return count


def reset_sequences(pg_engine, tables, sqlite_conn):
    """Reset PostgreSQL sequences to correct values after data import."""
    print("\n=== Resetting Sequences ===")

    with pg_engine.connect() as conn:
        for table_name in tables:
            # Get the primary key column (usually 'id')
            schema = get_table_schema(sqlite_conn, table_name)
            pk_col = None
            for col in schema:
                if col[5]:  # Primary key flag
                    pk_col = col[1]
                    break

            if pk_col and pk_col == 'id':
                try:
                    # Get max ID
                    result = conn.execute(text(f'SELECT MAX("{pk_col}") FROM "{table_name}"'))
                    max_id = result.scalar() or 0

                    # Reset sequence
                    seq_name = f'{table_name}_{pk_col}_seq'
                    conn.execute(text(f"SELECT setval('{seq_name}', {max_id + 1}, false)"))
                    conn.commit()
                    print(f"  ✓ Reset sequence for {table_name} to {max_id + 1}")
                except Exception as e:
                    print(f"  - Could not reset sequence for {table_name}: {e}")


def verify_migration(sqlite_conn, pg_engine, tables):
    """Verify that all data was migrated correctly."""
    print("\n=== Verifying Migration ===")

    all_ok = True

    for table_name in tables:
        # Get SQLite count
        cursor = sqlite_conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        sqlite_count = cursor.fetchone()[0]

        # Get PostgreSQL count
        with pg_engine.connect() as conn:
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
            pg_count = result.scalar()

        if sqlite_count == pg_count:
            print(f"  ✓ {table_name}: {sqlite_count} rows migrated successfully")
        else:
            print(f"  ✗ {table_name}: SQLite={sqlite_count}, PostgreSQL={pg_count} (MISMATCH)")
            all_ok = False

    return all_ok


def main():
    """Main migration function."""
    print("=" * 60)
    print("TradeSense SQLite to PostgreSQL Migration")
    print("=" * 60)

    # Get connections
    print("\n=== Connecting to Databases ===")
    try:
        sqlite_conn = get_sqlite_connection()
        print("  ✓ Connected to SQLite")
    except Exception as e:
        print(f"  ✗ Failed to connect to SQLite: {e}")
        sys.exit(1)

    try:
        pg_engine = get_postgresql_engine()
        # Test connection
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("  ✓ Connected to PostgreSQL")
    except Exception as e:
        print(f"  ✗ Failed to connect to PostgreSQL: {e}")
        print("\nMake sure PostgreSQL is running and the database exists.")
        print("Create database with: createdb tradesense")
        sys.exit(1)

    # Get tables
    tables = get_table_names(sqlite_conn)
    print(f"\n=== Found {len(tables)} tables to migrate ===")
    for t in tables:
        print(f"  - {t}")

    # Create PostgreSQL tables
    create_postgresql_tables(pg_engine, sqlite_conn, tables)

    # Migrate data
    print("\n=== Migrating Data ===")
    for table_name in tables:
        columns, rows = export_table_data(sqlite_conn, table_name)
        count = migrate_table_data(pg_engine, table_name, columns, rows)
        if count > 0:
            print(f"  ✓ {table_name}: {count} rows migrated")

    # Reset sequences
    reset_sequences(pg_engine, tables, sqlite_conn)

    # Verify migration
    success = verify_migration(sqlite_conn, pg_engine, tables)

    # Close connections
    sqlite_conn.close()
    pg_engine.dispose()

    print("\n" + "=" * 60)
    if success:
        print("Migration completed successfully!")
        print("\nNext steps:")
        print("1. Update DATABASE_URL in .env to use PostgreSQL")
        print("2. Set FLASK_ENV=production (optional)")
        print("3. Restart the application")
    else:
        print("Migration completed with some issues. Please review the output above.")
    print("=" * 60)


if __name__ == '__main__':
    main()
