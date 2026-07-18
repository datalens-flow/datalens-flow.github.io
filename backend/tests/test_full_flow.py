from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_pipeline_flow():
    # 1. Parse SQL
    sql_script = """
    CREATE TABLE users (
        id INT PRIMARY KEY,
        username VARCHAR(50)
    );
    CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT REFERENCES users(id),
        title TEXT
    );
    """
    parse_response = client.post("/api/parse", json={"sql": sql_script, "dialect": "postgres"})
    assert parse_response.status_code == 200
    schema_data = parse_response.json()
    assert len(schema_data["tables"]) == 2
    assert len(schema_data["relationships"]) == 1
    
    # 2. Export Draw.io XML
    drawio_res = client.post("/api/export/drawio", json=schema_data)
    assert drawio_res.status_code == 200
    assert "<mxfile" in drawio_res.text
    
    # 3. Export Excel
    export_req = {
        "schema_data": schema_data,
        "descriptions": {
            "users": {"username": "Unique name of user"},
            "posts": {"title": "Post heading title"}
        }
    }
    xlsx_res = client.post("/api/export/xlsx", json=export_req)
    assert xlsx_res.status_code == 200
    assert len(xlsx_res.content) > 0
    
    # 4. Export Markdown
    md_res = client.post("/api/export/md", json=export_req)
    assert md_res.status_code == 200
    assert "# Data Dictionary" in md_res.text
    assert "Unique name of user" in md_res.text
    
    # 5. Export SQL DDL
    sql_res = client.post("/api/export/sql", json=schema_data)
    assert sql_res.status_code == 200
    assert "CREATE TABLE users" in sql_res.text
