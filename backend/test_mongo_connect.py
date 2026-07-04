from pymongo import MongoClient
import traceback
import certifi

uri = "mongodb+srv://smartchefuser:smartchefpass@smartchefcluster.cbn0qrl.mongodb.net/?appName=SmartChefCluster"

try:
    client = MongoClient(uri, tls=True, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000, connectTimeoutMS=5000, socketTimeoutMS=5000)
    client.admin.command('ping')
    print('PING OK')
except Exception as e:
    traceback.print_exc()
    print('ERROR:', e)
