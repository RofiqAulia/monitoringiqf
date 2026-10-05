import requests
import json
import urllib.parse
import re
import html

session = requests.Session()
r1 = session.get('https://monitoringiqf.my.id/login')
xsrf = urllib.parse.unquote(session.cookies.get('XSRF-TOKEN'))

decoded_text = html.unescape(r1.text)
match = re.search(r'"version":"([^"]+)"', decoded_text)
version = match.group(1) if match else ''

headers = {
    'Content-Type': 'application/json',
    'X-Inertia': 'true',
    'X-Inertia-Version': version,
    'X-XSRF-TOKEN': xsrf,
    'Referer': 'https://monitoringiqf.my.id/login'
}

payload = {
    'email': 'mrofiqaulia@gmail.com',
    'password': 'password123',
    'remember': False
}

r2 = session.post('https://monitoringiqf.my.id/login', json=payload, headers=headers)
print('POST /login JSON Props:')
try:
    data = json.loads(r2.text)
    print(json.dumps(data.get('props', {}), indent=2))
except Exception as e:
    print('Failed to parse JSON:', e)
    print(r2.text)
