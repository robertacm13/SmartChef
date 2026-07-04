import ssl, socket, pprint

hostname = 'ac-lmtwxee-shard-00-00.cbn0qrl.mongodb.net'
port = 27017

context = ssl.create_default_context()
try:
    s = socket.create_connection((hostname, port), timeout=5)
    ssl_sock = context.wrap_socket(s, server_hostname=hostname)
    print('TLS version:', ssl_sock.version())
    print('Cipher:', ssl_sock.cipher())
    pprint.pprint(ssl_sock.getpeercert())
    ssl_sock.close()
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR:', e)
