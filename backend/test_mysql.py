import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = "Surya1232005"
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "attendance_db")

try:
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD
    )
    print("MySQL Connection Successful")
    
    with conn.cursor() as cursor:
        cursor.execute(f"SHOW DATABASES LIKE '{DB_NAME}'")
        result = cursor.fetchone()
        if result:
            print(f"Database '{DB_NAME}' exists")
        else:
            print(f"Database '{DB_NAME}' does NOT exist. Creating it...")
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"Database '{DB_NAME}' created successfully")
    
    conn.select_db(DB_NAME)
    print(f"Switched to '{DB_NAME}'")
    conn.close()
except Exception as e:
    print(f"MySQL Error: {e}")
