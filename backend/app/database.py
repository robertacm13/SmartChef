import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING

# Load environment variables
load_dotenv()

# MongoDB Atlas Connection
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartchef_db")

# Initialize MongoDB client with SSL fix for Python 3.13
try:
    # Fix SSL issues by modifying connection string and using updated pymongo 4.16.0
    # Add retryWrites=true&w=majority&tlsAllowInvalidCertificates=true if not already in URI
    connection_uri = MONGODB_URI
    if "?" not in connection_uri:
        connection_uri += "?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true"
    elif "tlsAllowInvalidCertificates" not in connection_uri:
        connection_uri += "&tlsAllowInvalidCertificates=true"
    
    client = MongoClient(
        connection_uri,
        tls=True,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000
    )
    db = client[DATABASE_NAME]
    users_collection = db["users"]
    food_analyses_collection = db["food_analyses"]
    user_profiles_collection = db["user_profiles"]
    
    # Create indexes for better performance
    # Unique index on email to prevent duplicates
    users_collection.create_index([("email", ASCENDING)], unique=True)
    
    # Index on user_email for food_analyses (for fast history queries)
    food_analyses_collection.create_index([("user_email", ASCENDING)])
    food_analyses_collection.create_index([("timestamp", ASCENDING)])
    
    # Index on email for user_profiles (for fast profile queries)
    user_profiles_collection.create_index([("email", ASCENDING)], unique=True)
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB Atlas connection successful!")
    print("✅ Indexes created: email (unique), user_email, timestamp")
except Exception as e:
    print(f"❌ MongoDB Atlas connection failed: {e}")
    print("⚠️ Falling back to MockCollection for testing...")
    
    # Fallback to in-memory storage if connection fails
    users_storage = []
    analyses_storage = []
    profiles_storage = []

    class MockCollection:
        def __init__(self, storage):
            self.storage = storage
            
        def find_one(self, query):
            for item in self.storage:
                if all(item.get(key) == value for key, value in query.items()):
                    return item
            return None
        
        def insert_one(self, document):
            document["_id"] = len(self.storage) + 1
            self.storage.append(document)
            return type('obj', (object,), {'inserted_id': document["_id"]})()
        
        def update_one(self, query, update_doc, upsert=False):
            for item in self.storage:
                if all(item.get(key) == value for key, value in query.items()):
                    if "$set" in update_doc:
                        item.update(update_doc["$set"])
                    return type('obj', (object,), {'modified_count': 1})()
            if upsert:
                new_doc = {**query, **update_doc.get("$set", {})}
                return self.insert_one(new_doc)
            return type('obj', (object,), {'modified_count': 0})()
        
        def find(self, query=None, sort=None):
            if query is None:
                return self.storage
            results = []
            for item in self.storage:
                if all(item.get(key) == value for key, value in query.items()):
                    results.append(item)
            return results
        
        def create_index(self, keys, unique=False):
            pass  # Mock implementation

    users_collection = MockCollection(users_storage)
    food_analyses_collection = MockCollection(analyses_storage)
    user_profiles_collection = MockCollection(profiles_storage)


