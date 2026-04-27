import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "attendance_db")

def alter_database():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        with connection.cursor() as cursor:
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN register_number VARCHAR(50);")
                print("Added register_number column.")
            except Exception as e:
                print("register_number column might already exist:", e)
                
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN roll_number VARCHAR(50);")
                print("Added roll_number column.")
            except Exception as e:
                print("roll_number column might already exist:", e)
            
        connection.commit()
        connection.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    alter_database()
