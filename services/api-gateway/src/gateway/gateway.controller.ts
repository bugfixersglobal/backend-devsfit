import { Controller, All, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@Controller('*')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All()
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.gatewayService.routeRequest(req);
      
      // Set response headers
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }

      // Send response
      res.status(result.status).send(result.data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Gateway routing error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
