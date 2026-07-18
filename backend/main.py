from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.models import ParseRequest, SchemaResponse, ExportRequest
from backend.parser.sql_parser import parse_sql_script
from backend.exporters.drawio_generator import generate_drawio_xml
from backend.exporters.xlsx_generator import generate_xlsx_bytes
from backend.exporters.markdown_generator import generate_markdown_doc
from backend.exporters.sql_generator import generate_sql_ddl

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

@app.post("/api/export/drawio")
def export_drawio(schema: SchemaResponse):
    xml_data = generate_drawio_xml(schema)
    return Response(
        content=xml_data,
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=erd.drawio.xml"}
    )

@app.post("/api/export/xlsx")
def export_xlsx(req: ExportRequest):
    xlsx_bytes = generate_xlsx_bytes(req)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=datadict.xlsx"}
    )

@app.post("/api/export/md")
def export_markdown(req: ExportRequest):
    md_text = generate_markdown_doc(req)
    return Response(
        content=md_text,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=datadict.md"}
    )

@app.post("/api/export/sql")
def export_sql(schema: SchemaResponse):
    sql_text = generate_sql_ddl(schema)
    return Response(
        content=sql_text,
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=schema.sql"}
    )
