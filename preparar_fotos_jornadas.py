#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepara las fotos de las Jornadas de Sensibilización AGAH para la web.

USO (desde la carpeta raíz del sitio, donde está prensa.html):
    pip install pillow
    python preparar_fotos_jornadas.py "C:\\ruta\\a\\Gira 1 2026"

- SOLO LEE la carpeta de origen (no mueve ni borra nada).
- Crea:  img/jornadas/<ciudad>/<foto>.jpg        (1600 px, para ampliar)
         img/jornadas/<ciudad>/min/<foto>.jpg    (640 px, miniatura)
- Escribe/actualiza: js/jornadas-fotos.js  (lista de fotos por ciudad)
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

# Nombre de carpeta (sin tildes, minúsculas) -> clave usada en prensa.html
CIUDADES = {
    "danli": "danli",
    "catacamas": "catacamas",
    "choluteca": "choluteca",
    "san lorenzo": "san-lorenzo",
    "siguatepeque": "siguatepeque",
    "la esperanza": "la-esperanza",
    "gracias": "gracias",
    "santa rosa de copan": "santa-rosa-de-copan",
    "copan": "santa-rosa-de-copan",
    "san pedro sula": "san-pedro-sula",
    "la ceiba": "la-ceiba",
}
EXT_OK = {".jpg", ".jpeg", ".png"}
GRANDE, MINI, CALIDAD = 1600, 640, 82


def normalizar(texto):
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def buscar_clave(nombre_carpeta):
    n = normalizar(nombre_carpeta)
    # la coincidencia más larga primero (evita confundir "san lorenzo" con otras)
    for nombre in sorted(CIUDADES, key=len, reverse=True):
        if nombre in n:
            return CIUDADES[nombre]
    return None


def guardar(img, destino, lado):
    im = img.copy()
    im.thumbnail((lado, lado), Image.LANCZOS)
    if im.mode != "RGB":
        im = im.convert("RGB")
    destino.parent.mkdir(parents=True, exist_ok=True)
    im.save(destino, "JPEG", quality=CALIDAD, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origen", help="Carpeta 'Gira 1 2026' con una subcarpeta por ciudad")
    ap.add_argument("--destino", default="img/jornadas")
    ap.add_argument("--js", default="js/jornadas-fotos.js")
    a = ap.parse_args()

    origen, destino, js = Path(a.origen), Path(a.destino), Path(a.js)
    if not origen.is_dir():
        sys.exit(f"No existe la carpeta de origen: {origen}")

    # Conserva lo que ya hubiera en el archivo JS (para ciudades que no se vuelven a procesar)
    datos = {clave: [] for clave in CIUDADES.values()}
    if js.exists():
        m = re.search(r"=\s*(\{.*\})\s*;", js.read_text(encoding="utf-8"), re.S)
        if m:
            datos.update(json.loads(m.group(1)))

    for sub in sorted(p for p in origen.iterdir() if p.is_dir()):
        clave = buscar_clave(sub.name)
        if not clave:
            print(f"[OMITIDA] Carpeta sin ciudad reconocida: {sub.name}")
            continue
        lista = []
        for f in sorted(sub.iterdir(), key=lambda p: p.name.lower()):
            if not f.is_file():
                continue
            if f.suffix.lower() not in EXT_OK:
                print(f"[OMITIDO] {sub.name}/{f.name}: formato no admitido ({f.suffix or 'sin extensión'})")
                continue
            try:
                with Image.open(f) as im:
                    im = ImageOps.exif_transpose(im)
                    nombre = f.stem + ".jpg"
                    guardar(im, destino / clave / nombre, GRANDE)
                    guardar(im, destino / clave / "min" / nombre, MINI)
                lista.append(nombre)
            except Exception as e:  # imagen dañada, etc.
                print(f"[ERROR] {sub.name}/{f.name}: {e}")
        datos[clave] = lista
        print(f"[OK] {sub.name} -> {clave}: {len(lista)} fotos")

    js.parent.mkdir(parents=True, exist_ok=True)
    cuerpo = json.dumps(datos, ensure_ascii=False, indent=2)
    js.write_text(
        "/* Generado por preparar_fotos_jornadas.py. Lista de fotos por ciudad. */\n"
        f"window.AGAH_JORNADAS_FOTOS = {cuerpo};\n",
        encoding="utf-8",
    )
    print(f"Listo. Archivo actualizado: {js}")


if __name__ == "__main__":
    main()