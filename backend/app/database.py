import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING

# Load environment variables
load_dotenv()

# MongoDB Atlas Connection
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartchef_db")

# Initialize MongoDB client
try:
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    users_collection = db["users"]
    food_analyses_collection = db["food_analyses"]
    
    # Create indexes for better performance
    # Unique index on email to prevent duplicates
    users_collection.create_index([("email", ASCENDING)], unique=True)
    
    # Index on user_email for food_analyses (for fast history queries)
    food_analyses_collection.create_index([("user_email", ASCENDING)])
    food_analyses_collection.create_index([("timestamp", ASCENDING)])
    
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


