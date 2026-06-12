import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен содержать не менее 8 символов")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну заглавную букву (A-Z)")
        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну строчную букву (a-z)")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру (0-9)")
        if not re.search(r"[@$!%*?&_#^()-+=]", v):
            raise ValueError("Пароль должен содержать хотя бы один специальный символ (@$!%*?&_#^()-+=)")
        return v

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None

class UserResponse(UserBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None
