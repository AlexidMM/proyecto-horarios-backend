import { Controller, Post,Get, Body } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('generate')
  async generateSchedule(@Body() body: { grado?: number }) {
    const result = await this.schedulerService.generateSchedule(body?.grado);
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
}
