from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.models import ParseRequest, SchemaResponse
from backend.parser.sql_parser import parse_sql_script

app = FastAPI(title="DataLens Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/parse", response_model=SchemaResponse)
def parse_sql(req: ParseRequest):
    return parse_sql_script(req.sql, req.dialect)
