import requests

resp = requests.get("http://localhost:8000/recommendations/0", params={"k":5})
print("Status:", resp.status_code)

# JSON 파싱 시도
try:
    print("Body JSON:", resp.json())
except ValueError:
    print("Body Text:", resp.text)
