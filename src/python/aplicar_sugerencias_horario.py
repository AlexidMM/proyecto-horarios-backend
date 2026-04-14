# aplicar_sugerencias_horario.py
"""
Aplica automáticamente las sugerencias de movimientos y swaps al horario original,
generando un nuevo archivo de horario ajustado.
"""

import json
import copy
import sys

with open('horario_greedy.json', encoding='utf-8') as f:
    horario = json.load(f)
with open('sugerencias_movimientos.json', encoding='utf-8') as f:
    sugerencias = json.load(f)

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


def slot_libre(asignaciones, grupo, slot):
    return not any(a["group"] == grupo and a["start"] == slot for a in asignaciones)


def prof_room_libres(asignaciones, prof, room, slot):
    return not any((a["prof"] == prof or a["room"] == room) and a["start"] == slot for a in asignaciones)


def dentro_rango_laboral(materia, grupo, slot):
    subject = get_subject_config(materia, grupo)
    if not subject:
        return True

    hour = slot_hour(slot)
    min_hora = subject.get("min_hora")
    max_hora = subject.get("max_hora")
    if min_hora is not None and hour < int(min_hora):
        return False
    if max_hora is not None and hour > int(max_hora):
        return False
    return True


def puede_agregar(asignaciones, grupo, materia, prof, room, slot):
    return (
        dentro_rango_laboral(materia, grupo, slot)
        and slot_libre(asignaciones, grupo, slot)
        and prof_room_libres(asignaciones, prof, room, slot)
    )

nuevo_horario = copy.deepcopy(horario)

for sug in sugerencias:
    if sug["accion"] == "asignar_directo":
        grupo = sug["group"]
        materia = sug["materia"]
        slot = sug["slot"]
        prof, room = get_prof_room(materia, grupo)
        if puede_agregar(nuevo_horario, grupo, materia, prof, room, slot):
            nuevo_horario.append({
                "group": grupo,
                "subj": materia,
                "start": slot,
                "room": room,
                "prof": prof
            })
    elif sug["accion"] == "swap":
        grupo = sug["group"]
        materia = sug["materia"]
        slot = sug["slot"]
        prof, room = get_prof_room(materia, grupo)
        # 1. Mover la materia que estaba en ese slot al nuevo slot
        mover = sug["swap"]["mover"]
        for a in nuevo_horario:
            if a["group"] == grupo and a["subj"] == mover["materia"] and a["start"] == mover["from"]:
                a["start"] = mover["to"]
        # 2. Asignar la materia faltante al slot liberado
        if puede_agregar(nuevo_horario, grupo, materia, prof, room, slot):
            nuevo_horario.append({
                "group": grupo,
                "subj": materia,
                "start": slot,
                "room": room,
                "prof": prof
            })
    # Si es sin_solucion, no hacer nada

with open('horario_greedy_aplicado.json', 'w', encoding='utf-8') as f:
    json.dump(nuevo_horario, f, ensure_ascii=False, indent=4)

print("¡Horario ajustado guardado en horario_greedy_aplicado.json!")
