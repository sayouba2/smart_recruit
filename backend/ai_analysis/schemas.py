from pydantic import BaseModel

class AnalysisRequest(BaseModel):
    session_id: str
    application_id: int
