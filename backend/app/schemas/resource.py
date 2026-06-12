from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ResourceCreate(BaseModel):
    title: str
    description: str | None = None
    url: str

class ResourceResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    url: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
