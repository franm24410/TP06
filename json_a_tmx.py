import json
import sys
import os
from xml.sax.saxutils import quoteattr, escape

# ---- CONFIGURACIÓN ----
# Nuevo prefijo para las rutas de los .tsx (lo que pediste)
NUEVO_PREFIJO = "TP06/wwwroot/Tiles"
# -----------------------

def q(s):
    return quoteattr(str(s))

def property_xml(p, indent):
    pad = "  " * indent
    ptype = p.get("type", "string")
    value = p.get("value")
    if ptype == "bool":
        value = "true" if value else "false"
    return f'{pad}<property name={q(p.get("name", ""))} type={q(ptype)} value={q(value)}/>'

def object_xml(o, indent):
    pad = "  " * indent
    attrs = f'id={q(o.get("id", 0))}'
    if o.get("name"):
        attrs += f' name={q(o["name"])}'
    attrs += f' x={q(o.get("x", 0))} y={q(o.get("y", 0))}'
    if o.get("width"):
        attrs += f' width={q(o["width"])}'
    if o.get("height"):
        attrs += f' height={q(o["height"])}'
    if o.get("rotation"):
        attrs += f' rotation={q(o["rotation"])}'
    if o.get("gid"):
        attrs += f' gid={q(o["gid"])}'
    if o.get("point"):
        attrs += ' point="true"'
    if not o.get("visible", True):
        attrs += ' visible="0"'

    children = []
    if o.get("ellipse"):
        children.append(f'{pad}  <ellipse/>')
    if o.get("polygon"):
        pts = " ".join(f'{p["x"]},{p["y"]}' for p in o["polygon"])
        children.append(f'{pad}  <polygon points={q(pts)}/>')
    props = o.get("properties")
    if props:
        children.append(f'{pad}  <properties>')
        for p in props:
            children.append(property_xml(p, indent + 2))
        children.append(f'{pad}  </properties>')

    if children:
        return f'{pad}<object {attrs}>\n' + "\n".join(children) + f'\n{pad}</object>'
    return f'{pad}<object {attrs}/>'

def layer_xml(l, map_w, map_h, indent=1):
    pad = "  " * indent
    lines = []
    attrs = f'id={q(l.get("id", 0))} name={q(l.get("name", ""))}'
    attrs += f' width={q(l.get("width", map_w))} height={q(l.get("height", map_h))}'
    if not l.get("visible", True):
        attrs += ' visible="0"'
    if l.get("opacity", 1) != 1:
        attrs += f' opacity={q(l["opacity"])}'
    if l.get("offsetx"):
        attrs += f' offsetx={q(l["offsetx"])}'
    if l.get("offsety"):
        attrs += f' offsety={q(l["offsety"])}'

    t = l.get("type")

    if t == "tilelayer":
        lines.append(f'{pad}<layer {attrs}>')
        data_attrs = 'encoding="base64"'
        if l.get("compression"):
            data_attrs += f' compression={q(l["compression"])}'
        lines.append(f'{pad}  <data {data_attrs}>')
        for ch in l.get("chunks", []):
            lines.append(f'{pad}   <chunk x={q(ch["x"])} y={q(ch["y"])} width={q(ch["width"])} height={q(ch["height"])}>')
            lines.append(f'{pad}    {ch["data"].strip()}')
            lines.append(f'{pad}   </chunk>')
        if "data" in l and not l.get("chunks"):
            if isinstance(l["data"], list):  # CSV
                lines[-1] = f'{pad}  <data encoding="csv">'
                lines.append(f'{pad}   {",".join(map(str, l["data"]))}')
            else:
                lines.append(f'{pad}   {l["data"].strip()}')
        lines.append(f'{pad}  </data>')
        lines.append(f'{pad}</layer>')

    elif t == "objectgroup":
        if l.get("draworder") and l["draworder"] != "topdown":
            attrs += f' draworder={q(l["draworder"])}'
        lines.append(f'{pad}<objectgroup {attrs}>')
        for o in l.get("objects", []):
            lines.append(object_xml(o, indent + 1))
        lines.append(f'{pad}</objectgroup>')

    elif t == "group":
        lines.append(f'{pad}<group {attrs}>')
        for sub in l.get("layers", []):
            lines.extend(layer_xml(sub, map_w, map_h, indent + 1))
        lines.append(f'{pad}</group>')

    elif t == "imagelayer":
        fname = os.path.basename(l.get("image", "").replace("\\", "/"))
        lines.append(f'{pad}<imagelayer {attrs}>')
        lines.append(f'{pad}  <image source={q(f"{NUEVO_PREFIJO}/{fname}")}/>')
        lines.append(f'{pad}</imagelayer>')

    return lines

def main():
    if len(sys.argv) < 3:
        print("Uso: python json_a_tmx.py entrada.json salida.tmx")
        sys.exit(1)

    src, dst = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        m = json.load(f)

    out = ['<?xml version="1.0" encoding="UTF-8"?>']

    mattrs = (
        f'version={q(m.get("version", "1.10"))} tiledversion={q(m.get("tiledversion", "1.10.2"))} '
        f'orientation={q(m.get("orientation", "orthogonal"))} renderorder={q(m.get("renderorder", "right-down"))} '
        f'width={q(m.get("width", 0))} height={q(m.get("height", 0))} '
        f'tilewidth={q(m.get("tilewidth", 0))} tileheight={q(m.get("tileheight", 0))} '
        f'infinite={q(1 if m.get("infinite") else 0)}'
    )
    if m.get("nextlayerid"):
        mattrs += f' nextlayerid={q(m["nextlayerid"])}'
    if m.get("nextobjectid"):
        mattrs += f' nextobjectid={q(m["nextobjectid"])}'
    out.append(f'<map {mattrs}>')

    # Tilesets: reescribe la ruta del .tsx al nuevo prefijo
    for ts in m.get("tilesets", []):
        if "source" in ts:
            fname = os.path.basename(ts["source"].replace("\\", "/"))
            out.append(f' <tileset firstgid={q(ts["firstgid"])} source={q(f"{NUEVO_PREFIJO}/{fname}")}/>')
        else:
            # Tileset embebido: se conserva tal cual, pero con la imagen repathada
            attrs = f'firstgid={q(ts["firstgid"])} name={q(ts.get("name", ""))} '
            attrs += f'tilewidth={q(ts.get("tilewidth", 0))} tileheight={q(ts.get("tileheight", 0))}'
            if ts.get("columns"):
                attrs += f' columns={q(ts["columns"])}'
            if ts.get("tilecount"):
                attrs += f' tilecount={q(ts["tilecount"])}'
            out.append(f' <tileset {attrs}>')
            fname = os.path.basename(ts.get("image", "").replace("\\", "/"))
            out.append(f'  <image source={q(f"{NUEVO_PREFIJO}/{fname}")} '
                       f'width={q(ts.get("imagewidth", 0))} height={q(ts.get("imageheight", 0))}/>')
            out.append(' </tileset>')

    # Capas
    for l in m.get("layers", []):
        out.extend(layer_xml(l, m.get("width", 0), m.get("height", 0)))

    out.append('</map>')

    with open(dst, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")

    print(f"OK: {dst} generado con rutas {NUEVO_PREFIJO}/...")

if __name__ == "__main__":
    main()