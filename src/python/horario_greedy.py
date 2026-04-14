
import json
import random
import sys

# Datos base
SLOTS_PER_DAY = 5
DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie"]
SLOTS = [f"{d}{17+i}" for d in DAYS for i in range(SLOTS_PER_DAY)]


def slot_hour(slot: str) -> int:
    return int(slot[3:])


def can_use_slot_for_subject(subject: dict, slot: str) -> bool:
    hour = slot_hour(slot)
    min_hora = subject.get("min_hora")
    max_hora = subject.get("max_hora")

    if min_hora is not None and hour < int(min_hora):
        return False
    if max_hora is not None and hour > int(max_hora):
        return False
    return True

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


import copy

def run_greedy():
    grupo_materia_horas = {}
    for g in SUBJECTS:
        for subj in SUBJECTS[g]:
            grupo_materia_horas[(g, subj["id"])] = subj["H"]
    asignaciones = []
    for slot in SLOTS:
        dia = slot[:3]
        ingles_asignado = False
        grupos_pendientes = list(SUBJECTS.keys())
        random.shuffle(grupos_pendientes)
        profes_slot = set()
        rooms_slot = set()
        for g in grupos_pendientes:
            materias_disponibles = [subj for subj in SUBJECTS[g] if grupo_materia_horas[(g, subj["id"])] > 0]
            opciones = []
            for materia in materias_disponibles:
                if not can_use_slot_for_subject(materia, slot):
                    continue
                prof = materia["profs"][0]
                room = materia["rooms"][0]
                profe_ya_dio = any(a["prof"] == prof and a["group"] == g and a["start"].startswith(dia) for a in asignaciones)
                if profe_ya_dio:
                    continue
                if prof in profes_slot:
                    continue
                if room in rooms_slot:
                    continue
                if materia["id"].lower().startswith("ingles") and ingles_asignado:
                    continue
                if materia["id"].lower().startswith("ingles"):
                    opciones.append((materia, prof, room, True))
                else:
                    opciones.append((materia, prof, room, False))
            if not opciones:
                continue
            materia, prof, room, es_ingles = None, None, None, False
            for op in opciones:
                if op[3] and not ingles_asignado:
                    materia, prof, room, es_ingles = op
                    ingles_asignado = True
                    break
            if materia is None:
                materia, prof, room, es_ingles = opciones[0]
            asignaciones.append({
                "group": g,
                "subj": materia["id"],
                "start": slot,
                "room": room,
                "prof": prof
            })
            grupo_materia_horas[(g, materia["id"])] -= 1
            profes_slot.add(prof)
            rooms_slot.add(room)
    # Contar huecos
    total_slots = len(SUBJECTS) * len(SLOTS)
    usados = len(asignaciones)
    huecos = total_slots - usados
    return asignaciones, huecos

# Búsqueda de la mejor solución
best_asignaciones = None
min_huecos = float('inf')
max_intentos = 1000
for intento in range(max_intentos):
    asignaciones, huecos = run_greedy()
    if huecos < min_huecos:
        min_huecos = huecos
        best_asignaciones = copy.deepcopy(asignaciones)
    if min_huecos == 0:
        print(f'Solución perfecta encontrada en el intento {intento+1}!')
        break
else:
    print(f'Mejor solución tiene {min_huecos} huecos tras {max_intentos} intentos.')


with open("horario_greedy.json", "w", encoding="utf-8") as f:
    json.dump(best_asignaciones, f, ensure_ascii=False, indent=4)
print("¡Horario generado y guardado en horario_greedy.json!")

# Reportar materias que quedaron fuera (horas no asignadas)
def materias_fuera(asignaciones):
    # Inicializar horas restantes por grupo y materia
    horas_restantes = {}
    for g in SUBJECTS:
        for subj in SUBJECTS[g]:
            horas_restantes[(g, subj["id"])] = subj["H"]
    for a in asignaciones:
        horas_restantes[(a["group"], a["subj"])] -= 1
    fuera = []
    for (g, m), h in horas_restantes.items():
        if h > 0:
            fuera.append({"group": g, "materia": m, "horas_faltantes": h})
    return fuera

fuera = materias_fuera(best_asignaciones)
if fuera:
    print("Materias que quedaron fuera (horas no asignadas):")
    for f in fuera:
        print(f)
    with open("materias_fuera.json", "w", encoding="utf-8") as fjson:
        json.dump(fuera, fjson, ensure_ascii=False, indent=4)
    print("También guardado en materias_fuera.json")
else:
    print("¡Todas las materias fueron asignadas completamente!")
