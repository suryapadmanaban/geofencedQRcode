import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Get credentials from .env
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "attendance_db")

def create_database():
    try:
        # Connect to MySQL without specifying a database
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
            print(f"✅ Database '{DB_NAME}' created or already exists.")
            
        connection.close()
        
        # Now use the schema.sql to create tables if you want, 
        # or let SQLAlchemy do it when you start the app.
        print("🚀 You can now run 'uvicorn main:app --reload' to start the system!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure your MySQL server is running and your credentials in .env are correct.")

if __name__ == "__main__":
    create_database()
