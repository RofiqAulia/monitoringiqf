import requests
import json
import urllib.parse
import re
import html

session = requests.Session()

# 1. Get login page and tokens
r1 = session.get('https://monitoringiqf.my.id/login')
xsrf = urllib.parse.unquote(session.cookies.get('XSRF-TOKEN'))
decoded_text = html.unescape(r1.text)
version = re.search(r'"version":"([^"]+)"', decoded_text).group(1)

# 2. Get /deteksi-anomali directly as unauthenticated and authenticated
print("=== GET /deteksi-anomali (Unauthenticated) ===")
r_unauth = session.get('https://monitoringiqf.my.id/deteksi-anomali', headers={'X-Inertia': 'true', 'X-Inertia-Version': version})
print("Status:", r_unauth.status_code)
print("Headers:", dict(r_unauth.headers))
print("Content snippet:", r_unauth.text[:400])

# 3. Test GET /deteksi-anomali as normal HTML browser request
print("\n=== GET /deteksi-anomali (HTML Browser Direct Request) ===")
r_html = session.get('https://monitoringiqf.my.id/deteksi-anomali')
print("Status:", r_html.status_code)
print("Headers:", dict(r_html.headers))
if r_html.status_code != 200:
    print("Full HTML Error Response:")
    print(r_html.text)
else:
    print("HTML Snippet:", r_html.text[:500])
