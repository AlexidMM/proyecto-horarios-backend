// horario.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}




async getSubjectsFormatted(grado?: number) {
  // 1️⃣ Obtener materias + profesores
  const materiasProfesores = await this.prisma.$queryRaw<
    Array<{ 
      id: string; 
      grado: number;
      h: number; 
      rooms: string[] | string; 
      profs: string; 
      min_hora?: number | null;
      max_hora?: number | null;
    }>
  >`
    SELECT  
        m.nombre AS id,
        m.grado AS grado,
        m.horas_semana AS h,
        m.salones AS rooms,
        CONCAT(p.nombre, ' ', p.apellidos) AS profs,
        p.min_hora,
        p.max_hora
    FROM profesores p
    JOIN materias m 
        ON p.materias @> to_jsonb(m.nombre)::jsonb;
  `;


  const grupos = grado !== undefined
    ? await this.prisma.$queryRaw<Array<{ nombre: string; grado: number }>>`
      SELECT nombre, grado FROM grupos WHERE grado = ${grado};
    `
    : await this.prisma.$queryRaw<Array<{ nombre: string; grado: number }>>`
      SELECT nombre, grado FROM grupos;
    `;

  const materiasMap = new Map<string, string[]>();
  const materiaMetaByGrade = new Map<string, { h: number; rooms: string[] | string; min_hora?: number | null; max_hora?: number | null }>();

  for (const item of materiasProfesores) {
    const matName = item.id.trim();
    const key = `${item.grado}|${matName}`;
    if (!materiasMap.has(key)) materiasMap.set(key, []);
    materiasMap.get(key)!.push(item.profs);
    if (!materiaMetaByGrade.has(key)) {
      materiaMetaByGrade.set(key, {
        h: item.h,
        rooms: item.rooms,
        min_hora: item.min_hora,
        max_hora: item.max_hora,
      });
    }
  }

  const result: Record<string, any[]> = {};

  grupos.forEach((g, groupIdx) => {
    const cleanName = g.nombre.replace(/\s+/g, ""); // IDGS15 → IDGS15
    result[cleanName] = [];

    Array.from(materiasMap.entries())
      .filter(([key]) => key.startsWith(`${g.grado}|`))
      .forEach(([key, profsList]) => {
      const [, matName] = key.split('|');
      const assignedProf = profsList[groupIdx % profsList.length]; // rotación

      const matData = materiaMetaByGrade.get(key);
      if (!matData) return;

      result[cleanName].push({
        id: matName,
        H: matData.h,
        rooms: Array.isArray(matData.rooms) ? matData.rooms : [matData.rooms],
        profs: [assignedProf],
        ...(matData.min_hora !== null && matData.min_hora !== undefined ? { min_hora: matData.min_hora } : {}),
        ...(matData.max_hora !== null && matData.max_hora !== undefined ? { max_hora: matData.max_hora } : {})
      });
    });
  });

  console.log("📦 JSON final enviado a Python:", JSON.stringify(result, null, 2));
  return result;
}

    async generateSchedule(grado?: number) {  
      const subjects = await this.getSubjectsFormatted(grado);
      const pythonUrl = process.env.PYTHON_SCHEDULER_URL || 'http://localhost:8000/generar-horario';

    // 1️⃣ Llamar al microservicio Python
const response = await this.httpService.axiosRef.post(
    pythonUrl,
    subjects
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
  const existing = await this.prisma.horarios.findFirst({
  where: { nombregrupo: groupName },
});

if (existing) {
  await this.prisma.horarios.update({
    where: { id: existing.id },
    data: { data: assignments },
  });
} else {
  await this.prisma.horarios.create({
    data: { nombregrupo: groupName, data: assignments },
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

