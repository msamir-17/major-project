"""
Utility functions for SkillBridge platform
Handles authentication, password hashing, and JWT token management
"""
from __future__ import annotations
from typing import Optional
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from database import engine
from models import UserProfile
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Password hashing context with proper bcrypt configuration
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12,  # Specify rounds for consistency
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# HTTP Bearer token scheme
security = HTTPBearer()


def get_session():
    """Database session dependency"""
    with Session(engine) as session:
        yield session


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with proper length validation
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    try:
        # Validate password length (bcrypt has 72 byte limit)
        if len(password.encode('utf-8')) > 72:
            logger.warning("Password too long, truncating to 72 bytes")
            # Truncate password to 72 bytes
            password_bytes = password.encode('utf-8')[:72]
            password = password_bytes.decode('utf-8', errors='ignore')
        
        # Validate minimum length
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        return pwd_context.hash(password)
        
    except Exception as e:
        logger.error(f"❌ Password hashing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password processing failed: {str(e)}"
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        # Handle password length for verification
        if len(plain_password.encode('utf-8')) > 72:
            password_bytes = plain_password.encode('utf-8')[:72]
            plain_password = password_bytes.decode('utf-8', errors='ignore')
            
        return pwd_context.verify(plain_password, hashed_password)
        
    except Exception as e:
        logger.error(f"❌ Password verification failed: {str(e)}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    try:
        to_encode = data.copy()
        
        # Set expiration time
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})
        
        # Create JWT token
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        logger.info(f"✅ Access token created for user: {data.get('sub', 'unknown')}")
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"❌ Token creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token creation failed"
        )


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"⚠️ Token verification failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected token verification error: {str(e)}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> UserProfile:
    """
    Dependency to get the current authenticated user
    
    Args:
        credentials: HTTP Bearer token credentials
        session: Database session
        
    Returns:
        Current authenticated user profile
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Create credentials exception
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Get token from credentials
        token = credentials.credentials
        
        # Verify and decode token
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        
        # Extract user email from token
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        # Get user from database
        user = session.exec(
            select(UserProfile).where(UserProfile.email == email)
        ).first()
        
        if user is None:
            logger.warning(f"⚠️ User not found for email: {email}")
            raise credentials_exception
        
        logger.debug(f"✅ Current user authenticated: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Authentication error: {str(e)}")
        raise credentials_exception


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength and length
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, message)
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
        
    # Check byte length for bcrypt compatibility
    if len(password.encode('utf-8')) > 72:
        return False, "Password contains too many special characters (max 72 bytes)"
    
    # Add more password strength rules as needed
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "Password should contain uppercase, lowercase, and numeric characters"
    
    return True, "Password is valid"


# ... rest of your existing functions remain the same