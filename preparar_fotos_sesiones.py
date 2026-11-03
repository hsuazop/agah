#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepara para la web las fotos de una jornada organizada en SUBCARPETAS POR FECHA
(por ejemplo "08 de septiembre", "09 de septiembre"...).

USO (desde la carpeta raíz del sitio, donde está prensa.html):
    pip install pillow
    python preparar_fotos_sesiones.py "D:\\Tegucigalpa" --grupo tegucigalpa --anio 2026

- SOLO LEE la carpeta de origen (no mueve ni borra nada).
- Por cada subcarpeta con fecha crea:
      img/jornadas/<grupo>-<aaaa>-<mm>-<dd>/<foto>.jpg        (1600 px, para ampliar)
      img/jornadas/<grupo>-<aaaa>-<mm>-<dd>/min/<foto>.jpg    (640 px, miniatura)
  Ejemplo: "08 de septiembre" -> img/jornadas/tegucigalpa-2026-09-08/
- Agrega esas claves a js/jornadas-fotos.js SIN borrar las de las demás ciudades.
- Se puede volver a ejecutar sin problema: sobrescribe lo mismo, no duplica.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pillow")

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}
EXT_OK = {".jpg", ".jpeg", ".png"}
GRANDE, MINI, CALIDAD = 1600, 640, 82
PATRON_FECHA = re.compile(r"(\d{1,2})\D+(" + "|".join(MESES) + r")")


def normalizar(texto):
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def fecha_de_carpeta(nombre):
    """'08 de septiembre' (con cualquier símbolo raro al final) -> (9, 8). Si no hay fecha, None."""
    m = PATRON_FECHA.search(normalizar(nombre))
    if not m:
        return None
    return MESES[m.group(2)], int(m.group(1))


def guardar(img, destino, lado):
    im = img.copy()
    im.thumbnail((lado, lado), Image.LANCZOS)
    if im.mode != "RGB":
        im = im.convert("RGB")
    destino.parent.mkdir(parents=True, exist_ok=True)
    im.save(destino, "JPEG", quality=CALIDAD, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origen", help='Carpeta con una subcarpeta por fecha, por ejemplo "D:\\Tegucigalpa"')
    ap.add_argument("--grupo", required=True, help="Nombre corto sin espacios ni tildes, por ejemplo: tegucigalpa")
    ap.add_argument("--anio", required=True, type=int, help="Año de las fotos, por ejemplo: 2026")
    ap.add_argument("--destino", default="img/jornadas")
    ap.add_argument("--js", default="js/jornadas-fotos.js")
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.grupo):
        sys.exit("--grupo solo puede tener letras minúsculas sin tildes, números y guiones. Ejemplo: tegucigalpa")
    origen, destino, js = Path(a.origen), Path(a.destino), Path(a.js)
    if not origen.is_dir():
        sys.exit(f"No existe la carpeta de origen: {origen}")

    datos = {}
    if js.exists():
        m = re.search(r"=\s*(\{.*\})\s*;", js.read_text(encoding="utf-8"), re.S)
        if m:
            datos = json.loads(m.group(1))

    nuevas = {}  # clave -> lista de fotos
    for sub in sorted(p for p in origen.iterdir() if p.is_dir()):
        fecha = fecha_de_carpeta(sub.name)
        if not fecha:
            print(f"[OMITIDA] Carpeta sin fecha reconocible: {sub.name!r}")
            continue
        mes, dia = fecha
        clave = f"{a.grupo}-{a.anio}-{mes:02d}-{dia:02d}"
        lista = nuevas.setdefault(clave, [])
        for f in sorted(sub.iterdir(), key=lambda p: p.name.lower()):
            if not f.is_file() or f.name.startswith("."):
                continue
            if f.suffix.lower() not in EXT_OK:
                print(f"[OMITIDO] {sub.name}/{f.name}: formato no admitido ({f.suffix or 'sin extensión'})")
                continue
            nombre = f.stem + ".jpg"
            if nombre in lista:
                print(f"[OMITIDO] {sub.name}/{f.name}: ya existe una foto con ese nombre en {clave}")
                continue
            try:
                with Image.open(f) as im:
                    im = ImageOps.exif_transpose(im)
                    guardar(im, destino / clave / nombre, GRANDE)
                    guardar(im, destino / clave / "min" / nombre, MINI)
                lista.append(nombre)
            except Exception as e:  # imagen dañada, etc.
                print(f"[ERROR] {sub.name}/{f.name}: {e}")

    if not nuevas:
        sys.exit("No se encontró ninguna subcarpeta con fecha (por ejemplo '08 de septiembre'). No se cambió nada.")

    for clave in sorted(nuevas):
        datos[clave] = nuevas[clave]
        print(f"[OK] {clave}: {len(nuevas[clave])} fotos")

    js.parent.mkdir(parents=True, exist_ok=True)
    js.write_text(
        "/* Generado por los scripts de preparación de fotos. Lista de fotos por ciudad o jornada. */\n"
        f"window.AGAH_JORNADAS_FOTOS = {json.dumps(datos, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )
    print(f"Listo. Archivo actualizado: {js}")
    print("Claves nuevas (úsalas en js/jornadas-portadas.js y en prensa.html):")
    for clave in sorted(nuevas):
        print("   ", clave)


if __name__ == "__main__":
    main()