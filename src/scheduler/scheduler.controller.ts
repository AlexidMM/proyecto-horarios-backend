import { Controller, Post,Get, Body } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('generate')
  async generateSchedule(
    @Body()
    body: {
      grado?: number | string;
      grupos?: string[];
      materias?: string[];
    },
  ) {
    const result = await this.schedulerService.generateSchedule(body);
    return { result };
  } 
  @Get('allschedules')
  async getAllSchedules() {
    const schedules = await this.schedulerService.getAllSchedules();
    return { schedules }; 
  }
  @Get('subjectsschedules')
  async getSubjectsSchedules() {
    const subjectsSchedules = await this.schedulerService.getSubjectsFormatted();
    return  subjectsSchedules ;
  }

  @Post('manual-move')
  async moveClassManual(
    @Body()
    body: {
      groupName: string;
      fromStart: string;
      toStart: string;
      subject: string;
      professor: string;
      room: string;
    },
  ) {
    const result = await this.schedulerService.moveClassManual(body);
    return { result };
  }
}
