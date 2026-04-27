import http.client
import json

conn = http.client.HTTPConnection("localhost", 8000)
headers = {'Content-Type': 'application/json'}
data = {
    "name": "Test User",
    "email": "test4@example.com",
    "password": "password123",
    "role": "student",
    "register_number": "12345",
    "roll_number": "R123"
}
json_data = json.dumps(data)

try:
    conn.request("POST", "/auth/register", json_data, headers)
    response = conn.getresponse()
    print(f"Status Code: {response.status}")
    print(f"Response: {response.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
