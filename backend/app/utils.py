import hashlib
import uuid

def hash_password(password):
    """Hash a password with a random salt."""
    algorithm = 'sha512'
    salt = uuid.uuid4().hex
    hash_obj = hashlib.new(algorithm)
    password_salted = salt + password
    hash_obj.update(password_salted.encode('utf-8'))
    password_hash = hash_obj.hexdigest()
    return f"{algorithm}${salt}${password_hash}"

def check_password(database_password, entered_password):
    """Check if an entered password matches the stored hashed password."""
    parts = database_password.split('$')
    if len(parts) != 3:
        return False
    algorithm, salt, hashed_pw = parts
    hash_obj = hashlib.new(algorithm)
    password_salted = salt + entered_password
    hash_obj.update(password_salted.encode('utf-8'))
    return hashed_pw == hash_obj.hexdigest()
