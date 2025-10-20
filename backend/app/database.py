# Temporary in-memory storage for testing (replace with MongoDB in production)
users_storage = []

class MockCollection:
    def find_one(self, query):
        for user in users_storage:
            if all(user.get(key) == value for key, value in query.items()):
                return user
        return None
    
    def insert_one(self, document):
        document["_id"] = len(users_storage) + 1
        users_storage.append(document)
        return type('obj', (object,), {'inserted_id': document["_id"]})()

users_collection = MockCollection()

# Uncomment below for MongoDB (when installed):
# from pymongo import MongoClient
# client = MongoClient("mongodb://localhost:27017")
# db = client["user_auth"]
# users_collection = db["users"]
