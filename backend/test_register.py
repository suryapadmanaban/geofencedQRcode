import requests

url = "http://localhost:8000/auth/register"
data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "register_number": "12345",
    "roll_number": "R123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
