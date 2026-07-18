import xml.etree.ElementTree as ET
from backend.models import SchemaResponse

def generate_drawio_xml(schema: SchemaResponse) -> str:
    mxfile = ET.Element("mxfile", host="Electron", modified="2026-07-18T12:00:00.000Z", agent="DataLens", version="20.0.0")
    diagram = ET.SubElement(mxfile, "diagram", id="ERD-Diagram", name="Page-1")
    mxGraphModel = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="827", pageHeight="1169")
    root = ET.SubElement(mxGraphModel, "root")
    
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")
    
    x_offset = 50
    y_offset = 50
    
    for idx, table in enumerate(schema.tables):
        table_id = f"table_{table.id}"
        style = "swimlane;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;html=1;fontStyle=1;align=center;fillColor=#e1f5fe;strokeColor=#03a9f4;fontColor=#0d47a1;"
        mxCell = ET.SubElement(root, "mxCell", id=table_id, value=table.name, style=style, parent="1", vertex="1")
        mxGeometry = ET.SubElement(mxCell, "mxGeometry", x=str(x_offset), y=str(y_offset), width="180", height=str(30 + len(table.columns)*26), **{"as": "geometry"})
        
        for col_idx, col in enumerate(table.columns):
            col_id = f"col_{table.id}_{col.name}"
            prefix = "🔑 " if col.is_pk else ("🔗 " if col.is_fk else "")
            value = f"{prefix}{col.name} : {col.type}"
            col_style = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
            c_cell = ET.SubElement(root, "mxCell", id=col_id, value=value, style=col_style, parent=table_id, vertex="1")
            ET.SubElement(c_cell, "mxGeometry", y=str(30 + col_idx*26), width="180", height="26", **{"as": "geometry"})
        
        x_offset += 250
        if x_offset > 800:
            x_offset = 50
            y_offset += 300
            
    for rel in schema.relationships:
        rel_style = "edgeStyle=orthogonalEdgeStyle;fontSize=12;html=1;endArrow=ERmany;endFill=0;startArrow=ERone;startFill=0;strokeColor=#37474f;"
        mxCell = ET.SubElement(root, "mxCell", id=rel.id, style=rel_style, parent="1", source=f"col_{rel.to_table}_{rel.to_column}", target=f"col_{rel.from_table}_{rel.from_column}", edge="1")
        ET.SubElement(mxCell, "mxGeometry", relative="1", **{"as": "geometry"})
        
    return ET.tostring(mxfile, encoding="utf-8").decode("utf-8")
