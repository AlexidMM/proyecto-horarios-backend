// horario.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

const SECONDARY_BLOCKS: Record<string, string> = {
  '01': '07:00-07:50',
  '02': '07:50-08:40',
  '03': '08:40-09:30',
  '04': '09:50-10:40',
  '05': '10:40-11:30',
  '06': '11:30-12:20',
};

const DIA_MAP_REVERSE: Record<string, string> = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mie: 'Miercoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
};

type ScheduleFilters = {
  grado?: number | string;
  grupos?: string[];
  materias?: string[];
};

@Injectable()
export class SchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}




  private mapAssignmentToSecondaryFormat(item: any) {
    const block = typeof item.start === 'string' ? item.start.slice(3, 5) : '';
    const diaCode = typeof item.start === 'string' ? item.start.slice(0, 3) : '';
    const diaMap: Record<string, string> = {
      Lun: 'Lunes',
      Mar: 'Martes',
      Mie: 'Miercoles',
      Jue: 'Jueves',
      Vie: 'Viernes',
    };

    return {
      ...item,
      dia: diaMap[diaCode] ?? diaCode,
      bloque: block,
      hora: SECONDARY_BLOCKS[block] ?? 'Sin horario',
      receso: '09:30-09:50',
    };
  }

  async getSubjectsFormatted(filters: ScheduleFilters = {}) {
  const gradoFilter = filters.grado !== undefined && filters.grado !== null && filters.grado !== '' && filters.grado !== 'all'
    ? Number(filters.grado)
    : undefined;
  const gruposFilter = Array.isArray(filters.grupos)
    ? filters.grupos.filter((g) => typeof g === 'string' && g.trim().length > 0)
    : [];
  const materiasFilter = Array.isArray(filters.materias)
    ? filters.materias.filter((m) => typeof m === 'string' && m.trim().length > 0)
    : [];

  // 1️⃣ Obtener materias + profesores
  const materiasProfesores = await this.prisma.$queryRaw<
    Array<{ 
      id: string; 
      grado: number;
      h: number; 
      permitir_doble_bloque: boolean;
      rooms: string[] | string; 
      profs: string;
    }>
  >`
    SELECT  
        m.nombre AS id,
        m.grado AS grado,
        m.horas_semana AS h,
        m.permitir_doble_bloque AS permitir_doble_bloque,
        m.salones AS rooms,
        CONCAT(p.nombre, ' ', p.apellidos) AS profs
    FROM profesores p
    JOIN materias m 
        ON p.materias @> to_jsonb(m.nombre)::jsonb;
  `;


  const grupos = await this.prisma.$queryRaw<Array<{ nombre: string; grado: number }>>`
      SELECT nombre, grado
      FROM grupos;
    `;

  const salonesCatalogo = await this.prisma.salones.findMany({
    select: { nombre: true },
  });
  const validRooms = new Set(
    salonesCatalogo
      .map((s) => s.nombre?.trim())
      .filter((name): name is string => Boolean(name)),
  );

  const materiasMap = new Map<string, string[]>();
  const materiaMetaByGrade = new Map<string, { h: number; rooms: string[] | string; permitir_doble_bloque: boolean }>();

  for (const item of materiasProfesores) {
    const matName = item.id.trim();
    if (materiasFilter.length > 0 && !materiasFilter.includes(matName)) {
      continue;
    }

    const key = `${item.grado}|${matName}`;
    if (!materiasMap.has(key)) materiasMap.set(key, []);
    materiasMap.get(key)!.push(item.profs);
    if (!materiaMetaByGrade.has(key)) {
      materiaMetaByGrade.set(key, {
        h: item.h,
        rooms: this.normalizeRoomsAgainstCatalog(item.rooms, validRooms),
        permitir_doble_bloque: Boolean(item.permitir_doble_bloque),
      });
    }
  }

  const result: Record<string, any[]> = {};

  const gruposFiltrados = grupos.filter((g) => {
    if (gradoFilter !== undefined && g.grado !== gradoFilter) {
      return false;
    }
    if (gruposFilter.length > 0 && !gruposFilter.includes(g.nombre)) {
      return false;
    }
    return true;
  });

  gruposFiltrados.forEach((g, groupIdx) => {
    result[g.nombre] = [];

    Array.from(materiasMap.entries())
      .filter(([key]) => key.startsWith(`${g.grado}|`))
      .forEach(([key, profsList]) => {
      const [, matName] = key.split('|');
      const assignedProf = profsList[groupIdx % profsList.length]; // rotación

      const matData = materiaMetaByGrade.get(key);
      if (!matData) return;

      result[g.nombre].push({
        id: matName,
        grado: g.grado,
        H: matData.h,
        allow_double_block: matData.permitir_doble_bloque,
        rooms: Array.isArray(matData.rooms) ? matData.rooms : [matData.rooms],
        profs: [assignedProf]
      });
    });
  });

  console.log("📦 JSON final enviado a Python:", JSON.stringify(result, null, 2));
  return result;
}

  private parseStart(start: string) {
    if (!start || start.length < 5) {
      throw new BadRequestException('Formato de bloque inválido');
    }
    const diaCode = start.slice(0, 3);
    const bloque = start.slice(3, 5);
    return { diaCode, bloque };
  }

  private splitDayHour(start: string) {
    const day = start.slice(0, 3);
    const hour = Number(start.slice(3, 5));
    return { day, hour };
  }

  private fullNameFromProfesor(p: { nombre: string; apellidos: string }) {
    return `${p.nombre} ${p.apellidos}`.trim();
  }

  private normalizeRooms(rooms: unknown): string[] {
    if (Array.isArray(rooms)) {
      return rooms.map((r) => String(r)).filter(Boolean);
    }
    if (typeof rooms === 'string' && rooms.trim().length > 0) {
      return [rooms.trim()];
    }
    return [];
  }

  private normalizeLegacyRoomName(room: string, validRooms: Set<string>): string {
    const normalized = room.trim();
    if (validRooms.has(normalized)) return normalized;

    const legacyAulaMatch = normalized.match(/^Aula\s+(\d{1,2})$/i);
    if (legacyAulaMatch) {
      const roomNumber = Number(legacyAulaMatch[1]);
      if (roomNumber >= 1 && roomNumber <= 10) {
        const candidate = `Aula A${roomNumber}`;
        if (validRooms.has(candidate)) return candidate;
      }
    }

    return normalized;
  }

  private normalizeRoomsAgainstCatalog(rooms: unknown, validRooms: Set<string>): string[] {
    const normalized = this.normalizeRooms(rooms)
      .map((room) => this.normalizeLegacyRoomName(room, validRooms))
      .filter((room) => validRooms.size === 0 || validRooms.has(room));

    return Array.from(new Set(normalized));
  }

  private allowsSubjectInSameDay(existingStarts: string[], targetStart: string, allowDoubleBlock: boolean) {
    if (existingStarts.length === 0) return true;
    if (!allowDoubleBlock) return false;
    if (existingStarts.length >= 2) return false;

    const target = this.splitDayHour(targetStart).hour;
    const current = this.splitDayHour(existingStarts[0]).hour;
    return Math.abs(target - current) === 1;
  }

  async moveClassManual(payload: {
    groupName: string;
    fromStart: string;
    toStart: string;
    subject: string;
    professor: string;
    room: string;
  }) {
    const { groupName, fromStart, toStart, subject, professor, room } = payload;

    if (!groupName || !fromStart || !toStart || !subject || !professor || !room) {
      throw new BadRequestException('Faltan datos para mover la clase');
    }

    if (fromStart === toStart) {
      throw new BadRequestException('El bloque destino debe ser diferente al origen');
    }

    const schedules = await this.prisma.horarios.findMany();
    const targetGroup = schedules.find((s) => s.nombregrupo === groupName);
    if (!targetGroup || !Array.isArray(targetGroup.data)) {
      throw new BadRequestException('No se encontró el horario del grupo');
    }

    const groupData = [...(targetGroup.data as any[])];
    const classIndex = groupData.findIndex(
      (c) => c.start === fromStart && c.subj === subject && c.prof === professor && c.room === room,
    );

    if (classIndex === -1) {
      throw new BadRequestException('No se encontró la clase origen para mover');
    }

    const sourceClass = groupData[classIndex];

    const sameGroupConflict = groupData.some(
      (c, idx) => idx !== classIndex && c.start === toStart,
    );
    if (sameGroupConflict) {
      throw new BadRequestException('Ese grupo ya tiene una clase asignada en ese bloque');
    }

    const allClasses = schedules.flatMap((s) =>
      Array.isArray(s.data)
        ? (s.data as any[]).map((c) => ({
            ...c,
            __groupName: s.nombregrupo,
          }))
        : [],
    );

    const crossConflict = allClasses.find((c) => {
      if (c.__groupName === groupName && c.start === fromStart && c.subj === subject && c.prof === professor && c.room === room) {
        return false;
      }
      if (c.start !== toStart) {
        return false;
      }
      return c.prof === professor || c.room === room;
    });

    if (crossConflict?.prof === professor) {
      throw new BadRequestException('Ese profesor ya tiene una hora asignada en ese bloque');
    }

    if (crossConflict?.room === room) {
      throw new BadRequestException('Ese salón ya está ocupado en ese bloque');
    }

    const { diaCode, bloque } = this.parseStart(toStart);
    groupData[classIndex] = {
      ...sourceClass,
      start: toStart,
      dia: DIA_MAP_REVERSE[diaCode] ?? sourceClass.dia,
      bloque,
      hora: SECONDARY_BLOCKS[bloque] ?? sourceClass.hora,
      receso: '09:30-09:50',
    };

    await this.prisma.horarios.update({
      where: { id: targetGroup.id },
      data: { data: groupData },
    });

    return {
      message: 'Clase movida correctamente',
      groupName,
      schedule: groupData,
    };
  }

  async addClassManual(payload: {
    groupName: string;
    start: string;
    subject: string;
  }) {
    const { groupName, start, subject } = payload;
    if (!groupName || !start || !subject) {
      throw new BadRequestException('Faltan datos para agregar la clase');
    }

    const { diaCode, bloque } = this.parseStart(start);
    const schedules = await this.prisma.horarios.findMany();
    const targetGroupSchedule = schedules.find((s) => s.nombregrupo === groupName);
    if (!targetGroupSchedule || !Array.isArray(targetGroupSchedule.data)) {
      throw new BadRequestException('No se encontró el horario del grupo');
    }

    const groupData = [...(targetGroupSchedule.data as any[])];
    if (groupData.some((c) => c.start === start)) {
      throw new BadRequestException('Ese bloque ya está ocupado en el grupo');
    }

    const group = await this.prisma.grupos.findFirst({ where: { nombre: groupName } });
    if (!group) {
      throw new BadRequestException('No se encontró información del grupo');
    }

    const materia = await this.prisma.materias.findFirst({
      where: {
        nombre: subject,
        grado: group.grado,
      },
    });
    if (!materia) {
      throw new BadRequestException('La materia no existe para el grado del grupo');
    }

    const sameDayStarts = groupData
      .filter((c) => c.subj === subject && typeof c.start === 'string' && c.start.startsWith(diaCode))
      .map((c) => c.start);

    if (!this.allowsSubjectInSameDay(sameDayStarts, start, Boolean(materia.permitir_doble_bloque))) {
      throw new BadRequestException(
        materia.permitir_doble_bloque
          ? 'Esta materia solo puede repetirse el mismo día si queda en bloque consecutivo (máximo 2).'
          : 'Esta materia no permite repetirse el mismo día en este grupo.',
      );
    }

    const rooms = this.normalizeRooms(materia.salones);
    if (rooms.length === 0) {
      throw new BadRequestException('La materia no tiene salones configurados');
    }

    const profesores = await this.prisma.profesores.findMany({
      where: {
        materias: {
          array_contains: [subject],
        },
      },
      select: {
        nombre: true,
        apellidos: true,
      },
    });
    if (profesores.length === 0) {
      throw new BadRequestException('No hay profesor asignado para esta materia');
    }

    const allClasses = schedules.flatMap((s) =>
      Array.isArray(s.data)
        ? (s.data as any[]).map((c) => ({
            ...c,
            __groupName: s.nombregrupo,
          }))
        : [],
    );

    let selectedProfessor: string | null = null;
    let selectedRoom: string | null = null;

    for (const prof of profesores) {
      const fullName = this.fullNameFromProfesor(prof);
      const profBusy = allClasses.some((c) => c.start === start && c.prof === fullName);
      if (profBusy) continue;

      const roomAvailable = rooms.find((room) => !allClasses.some((c) => c.start === start && c.room === room));
      if (!roomAvailable) continue;

      selectedProfessor = fullName;
      selectedRoom = roomAvailable;
      break;
    }

    if (!selectedProfessor || !selectedRoom) {
      throw new BadRequestException('No hay combinación disponible de profesor y salón para ese bloque');
    }

    const newEntry = {
      group: groupName,
      subj: subject,
      prof: selectedProfessor,
      room: selectedRoom,
      start,
      dia: DIA_MAP_REVERSE[diaCode] ?? diaCode,
      bloque,
      hora: SECONDARY_BLOCKS[bloque] ?? 'Sin horario',
      receso: '09:30-09:50',
    };

    groupData.push(newEntry);

    await this.prisma.horarios.update({
      where: { id: targetGroupSchedule.id },
      data: { data: groupData },
    });

    return {
      message: 'Clase agregada correctamente en el hueco',
      groupName,
      added: newEntry,
      schedule: groupData,
    };
  }

    async generateSchedule(filters: ScheduleFilters = {}) {  
        const subjects = await this.getSubjectsFormatted(filters);
      const pythonUrl = process.env.PYTHON_SCHEDULER_URL || 'http://localhost:8000/generar-horario';

        if (!Object.keys(subjects).length) {
          return {
            status: 'warning',
            message: 'No hay grupos o materias que coincidan con los filtros seleccionados.',
            missingSubjects: [],
            generatedGroups: 0,
            totalAssignments: 0,
          };
        }

    // 1️⃣ Llamar al microservicio Python
const response = await this.httpService.axiosRef.post(
    pythonUrl,
      { subjects, filters }
);

console.log('🧠 Respuesta Python:', response.data);

const result = response.data; 
  
    if (!result || !Array.isArray(result.horario)) {
  throw new Error('No se recibieron asignaciones válidas del microservicio');
}

    const expectedHours = new Map<string, number>();
    Object.entries(subjects).forEach(([groupName, subjectList]) => {
      for (const subject of subjectList as Array<{ id: string; H: number }>) {
        expectedHours.set(`${groupName}|${subject.id}`, subject.H);
      }
    });

    const assignedHours = new Map<string, number>();
    for (const item of result.horario) {
      const key = `${item.group}|${item.subj}`;
      assignedHours.set(key, (assignedHours.get(key) ?? 0) + 1);
    }

    const missingSubjects = Array.from(expectedHours.entries())
      .map(([key, required]) => {
        const [group, subject] = key.split('|');
        const assigned = assignedHours.get(key) ?? 0;
        return {
          group,
          subject,
          required,
          assigned,
          missing: Math.max(required - assigned, 0),
        };
      })
      .filter((item) => item.missing > 0);

    // 3️⃣ Agrupar por grupo
    const gruposMap = new Map<string, any[]>();

    for (const item of result.horario) {
      const groupId = item.group;
      if (!gruposMap.has(groupId)) {
        gruposMap.set(groupId, []);
      }
      gruposMap.get(groupId)!.push(item);
    }

    if (gruposMap.size === 0) {
      return {
        status: 'warning',
        message: 'No se pudo generar un horario válido con las restricciones actuales.',
        missingSubjects,
        generatedGroups: 0,
      };
    }

   // 4️⃣ Guardar cada grupo en la tabla `horarios`
for (const [groupName, assignments] of gruposMap.entries()) {
  const assignmentsNormalized = assignments.map((item) => this.mapAssignmentToSecondaryFormat(item));
  const existing = await this.prisma.horarios.findFirst({
  where: { nombregrupo: groupName },
});

if (existing) {
  await this.prisma.horarios.update({
    where: { id: existing.id },
    data: { data: assignmentsNormalized },
  });
} else {
  await this.prisma.horarios.create({
    data: { nombregrupo: groupName, data: assignmentsNormalized },
  });
}

}


    // 5️⃣ Devolver una respuesta general
    const hasMissing = missingSubjects.length > 0;
    return {
      status: hasMissing ? 'warning' : 'success',
      message: hasMissing
        ? 'Se generó un horario parcial: faltan horas en algunas materias por restricciones de factibilidad.'
        : 'Horarios generados y guardados por grupo correctamente.',
      grupos: Array.from(gruposMap.keys()),
      missingSubjects,
      generatedGroups: gruposMap.size,
      totalAssignments: result.horario.length,
    };
  }


  async getAllSchedules() {
    return this.prisma.horarios.findMany();
  }

}

