import { Body, Controller, Post } from '@nestjs/common';

@Controller('school-applications')
export class SchoolApplicationsController {
  @Post()
  submit(@Body() _body: any) {
    // Placeholder for future workflow.
    return { success: true };
  }
}

