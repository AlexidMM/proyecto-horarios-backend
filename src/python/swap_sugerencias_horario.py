# swap_sugerencias_horario.py
"""
Script para sugerir movimientos en cascada (swap/push) para acomodar materias faltantes en el horario,
intentando dejar el horario perfecto sin violar restricciones.
"""
import json
from collections import defaultdict
import copy


import sys
# Cargar datos
with open('horario_greedy.json', encoding='utf-8') as f:
    asignaciones = json.load(f)
with open('materias_fuera.json', encoding='utf-8') as f:
    materias_fuera = json.load(f)

SLOTS_PER_DAY = 5
DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie"]
SLOTS = [f"{d}{17+i}" for d in DAYS for i in range(SLOTS_PER_DAY)]


def slot_hour(slot: str) -> int:
    return int(slot[3:])

# Permitir pasar la ruta de SUBJECTS como argumento
if len(sys.argv) > 1:
    with open(sys.argv[1], encoding="utf-8") as f:
        SUBJECTS = json.load(f)
else:
    SUBJECTS = {
        "IDGS14": [
            {"id": "administracion del tiempo", "H": 3, "rooms": ["Aula 12 edificio k"], "profs": ["Maria Guadalupe"]},
            {"id": "Matematicas para ingenieria", "H": 4, "rooms": ["Aula 11 edificio k"], "profs": ["Jesus Hernan"]},
            {"id": "Arquitectura de software", "H": 5, "rooms": ["Aula 11 edificio I"], "profs": ["Manuel"]},
            {"id": "Ingles", "H": 4, "rooms": ["Aula 13 edificio k"], "profs": ["Profe Ingles3"]},
            {"id": "Metodologia de desarrollo de proyectos", "H": 3, "rooms": ["SUMPA edificio k"], "profs": ["Angelica"]},
            {"id": "Experiencia de usuario", "H": 3, "rooms": ["Aula 10 edificio j"], "profs": ["Emmanuel"]},
            {"id": "Seguridad informatica", "H": 3, "rooms": ["Aula 12 edificio j"], "profs": ["Brandon"]},
        ],
        "IDGS15": [
            {"id": "administracion del tiempo", "H": 3, "rooms": ["Aula 12 edificio k"], "profs": ["Maria Guadalupe"]},
            {"id": "Matematicas para ingenieria", "H": 4, "rooms": ["Aula 11 edificio k"], "profs": ["Jesus Hernan"]},
            {"id": "Arquitectura de software", "H": 5, "rooms": ["Aula 11 edificio I"], "profs": ["Manuel"]},
            {"id": "Ingles", "H": 4, "rooms": ["Aula 13 edificio k"], "profs": ["Profe Ingles1"]},
            {"id": "Metodologia de desarrollo de proyectos", "H": 3, "rooms": ["SUMPA edificio k"], "profs": ["Angelica"]},
            {"id": "Experiencia de usuario", "H": 3, "rooms": ["Aula 10 edificio j"], "profs": ["Emmanuel"]},
            {"id": "Seguridad informatica", "H": 3, "rooms": ["Aula 12 edificio j"], "profs": ["Brandon"]},
        ],
        "IDGS16": [
            {"id": "administracion del tiempo", "H": 3, "rooms": ["Aula 12 edificio k"], "profs": ["Maria Guadalupe"]},
            {"id": "Matematicas para ingenieria", "H": 4, "rooms": ["Aula 11 edificio k"], "profs": ["Jesus Hernan"]},
            {"id": "Arquitectura de software", "H": 5, "rooms": ["Aula 11 edificio I"], "profs": ["Manuel"]},
            {"id": "Ingles", "H": 4, "rooms": ["Aula 13 edificio k"], "profs": ["Profe Ingles2"]},
            {"id": "Metodologia de desarrollo de proyectos", "H": 3, "rooms": ["SUMPA edificio k"], "profs": ["Angelica"]},
            {"id": "Experiencia de usuario", "H": 3, "rooms": ["Aula 10 edificio j"], "profs": ["Emmanuel"]},
            {"id": "Seguridad informatica", "H": 3, "rooms": ["Aula 12 edificio j"], "profs": ["Brandon"]},
        ]
    }

def get_prof_room(materia, grupo):
    for subj in SUBJECTS[grupo]:
        if subj["id"] == materia:
            return subj["profs"][0], subj["rooms"][0]
    return None, None


def get_subject_config(materia, grupo):
    for subj in SUBJECTS[grupo]:
        if subj["id"] == materia:
            return subj
    return None

def profe_ya_dio_en_dia(asignaciones, grupo, prof, slot):
    dia = slot[:3]
    return any(a["prof"] == prof and a["group"] == grupo and a["start"].startswith(dia) for a in asignaciones)

def max_2_seguidas(asignaciones, grupo, materia, slot):
    slots_materia = [a["start"] for a in asignaciones if a["group"] == grupo and a["subj"] == materia]
    slots_materia.append(slot)
    idxs = sorted(SLOTS.index(s) for s in slots_materia)
    for i in range(len(idxs)-2):
        if idxs[i+2] - idxs[i] == 2:
            return False
    return True

def slot_libre(asignaciones, grupo, slot):
    return not any(a["group"] == grupo and a["start"] == slot for a in asignaciones)

def prof_room_libres(asignaciones, prof, room, slot):
    return not any((a["prof"] == prof or a["room"] == room) and a["start"] == slot for a in asignaciones)

def puede_asignar(asignaciones, grupo, materia, prof, room, slot):
    subject = get_subject_config(materia, grupo)
    if subject:
        hour = slot_hour(slot)
        min_hora = subject.get("min_hora")
        max_hora = subject.get("max_hora")
        if min_hora is not None and hour < int(min_hora):
            return False
        if max_hora is not None and hour > int(max_hora):
            return False

    if not slot_libre(asignaciones, grupo, slot):
        return False
    if not prof_room_libres(asignaciones, prof, room, slot):
        return False
    if profe_ya_dio_en_dia(asignaciones, grupo, prof, slot):
        return False
    if not max_2_seguidas(asignaciones, grupo, materia, slot):
        return False
    return True

def buscar_swap(asignaciones, grupo, materia, prof, room, slot):
    # Intenta mover la materia que está en ese slot a otro slot válido
    for a in asignaciones:
        if a["group"] == grupo and a["start"] == slot:
            materia_actual = a["subj"]
            prof_actual = a["prof"]
            room_actual = a["room"]
            # Buscar otro slot donde pueda ir la materia actual
            for slot2 in SLOTS:
                if slot2 == slot:
                    continue
                if puede_asignar(asignaciones, grupo, materia_actual, prof_actual, room_actual, slot2):
                    return {
                        "swap": True,
                        "mover": {
                            "group": grupo,
                            "materia": materia_actual,
                            "from": slot,
                            "to": slot2
                        }
                    }
    return None

def sugerir_movimientos(asignaciones, materias_fuera):
    sugerencias = []
    for falta in materias_fuera:
        grupo = falta["group"]
        materia = falta["materia"]
        prof, room = get_prof_room(materia, grupo)
        # 1. Intentar asignar directo a un slot libre
        for slot in SLOTS:
            if puede_asignar(asignaciones, grupo, materia, prof, room, slot):
                sugerencias.append({
                    "accion": "asignar_directo",
                    "group": grupo,
                    "materia": materia,
                    "slot": slot,
                    "detalle": f"Asignar '{materia}' al grupo {grupo} en el slot {slot} (directo)"
                })
                break
        else:
            # 2. Intentar swap: buscar slot ocupado, mover la materia de ese slot a otro slot válido, y poner la materia faltante ahí
            for slot in SLOTS:
                if slot_libre(asignaciones, grupo, slot):
                    continue  # Ya intentamos los libres
                swap = buscar_swap(asignaciones, grupo, materia, prof, room, slot)
                if swap:
                    sugerencias.append({
                        "accion": "swap",
                        "group": grupo,
                        "materia": materia,
                        "slot": slot,
                        "detalle": f"Mover '{swap['mover']['materia']}' de {slot} a {swap['mover']['to']} y asignar '{materia}' en {slot} para el grupo {grupo}",
                        "swap": swap
                    })
                    break
            else:
                sugerencias.append({
                    "accion": "sin_solucion",
                    "group": grupo,
                    "materia": materia,
                    "detalle": f"No se encontró slot ni swap válido para '{materia}' del grupo {grupo}"
                })
    return sugerencias

sugerencias = sugerir_movimientos(asignaciones, materias_fuera)

with open('sugerencias_movimientos.json', 'w', encoding='utf-8') as f:
    json.dump(sugerencias, f, ensure_ascii=False, indent=4)

print("Sugerencias de movimientos generadas en sugerencias_movimientos.json")
for s in sugerencias:
    print(s["detalle"])
    if s["accion"] == "swap":
        print(f"  Swap: mover '{s['swap']['mover']['materia']}' de {s['swap']['mover']['from']} a {s['swap']['mover']['to']}")
