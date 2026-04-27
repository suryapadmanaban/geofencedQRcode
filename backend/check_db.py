
import sqlite3
import os

# Assuming sqlite3 database is used, check database.py to be sure
db_path = "attendance.db" # Standard naming convention, let's verify

def check_db():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Sessions ---")
    cursor.execute("SELECT id, class_name, expiry_time FROM sessions")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- Attendance ---")
    cursor.execute("SELECT id, session_id, student_id, timestamp FROM attendance")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    check_db()
