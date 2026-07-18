from backend.parser.sql_parser import parse_sql_script

def test_postgres_ddl_parsing():
    sql = """
    CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE
    );
    CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT,
        order_date DATE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """
    res = parse_sql_script(sql, "postgres")
    assert len(res.tables) == 2
    assert res.tables[0].name == "users"
    assert res.tables[1].name == "orders"
    assert len(res.relationships) == 1
    assert res.relationships[0].from_table == "orders"
    assert res.relationships[0].to_table == "users"
    assert res.relationships[0].from_column == "user_id"
    assert res.relationships[0].to_column == "id"

def test_alter_table_foreign_key():
    sql = """
    CREATE TABLE users (
        id INT PRIMARY KEY
    );
    CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT
    );
    ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);
    """
    res = parse_sql_script(sql, "postgres")
    assert len(res.tables) == 2
    assert len(res.relationships) == 1
    assert res.relationships[0].from_table == "orders"
    assert res.relationships[0].to_table == "users"
    assert res.relationships[0].from_column == "user_id"
    assert res.relationships[0].to_column == "id"
    
    # Assert column schema updated
    orders_table = next(t for t in res.tables if t.id == "orders")
    user_id_col = next(c for c in orders_table.columns if c.name == "user_id")
    assert user_id_col.is_fk is True
    assert user_id_col.fk_ref_table == "users"
    assert user_id_col.fk_ref_column == "id"
