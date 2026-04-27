import http.client
import json

conn = http.client.HTTPConnection("localhost", 8000)
headers = {'Content-Type': 'application/json'}
data = {
    "name": "Faculty User",
    "email": "faculty@example.com",
    "password": "password123",
    "role": "faculty",
    "register_number": "",
    "roll_number": ""
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
