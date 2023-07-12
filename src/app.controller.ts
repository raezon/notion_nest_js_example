import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}
  @Get()
  @Render('index')
  async root() {
    const interventions = await this.appService.getIntervention();
    return { interventions: interventions };
  }
}
