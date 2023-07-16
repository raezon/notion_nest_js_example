import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}
  @Get()
  @Render('index')
  async root() {
    const interventions = await this.appService.getIntervention();
    const interventionsJSON = JSON.stringify(interventions);
    console.log(interventionsJSON);
    return { interventions: interventions, interventionsJSON };
  }
  @Post('planifier')
  async planifier(@Body() data: any) {
    return this.appService.planifier(data);
  }
}
