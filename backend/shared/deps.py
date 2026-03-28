import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from database import get_db
from models import User

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "smart_recruit_super_secret_key"
ALGORITHM = "HS256"

# This expects the token in the Authorization header: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8005/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_candidate(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "candidate":
        raise HTTPException(status_code=403, detail="Not enough permissions. Requires Candidate role.")
    return current_user

def get_current_active_rh(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "rh":
        raise HTTPException(status_code=403, detail="Not enough permissions. Requires RH role.")
    return current_user
