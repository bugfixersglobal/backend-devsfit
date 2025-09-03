import { Injectable, Logger } from '@nestjs/common';
import { MicroserviceClientService } from './microservice-client.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly microserviceClient: MicroserviceClientService,
  ) {}

  async getAllUsers(filters: any = {}) {
    this.logger.log('Fetching all users from user service');
    return this.microserviceClient.getUsers(filters);
  }

  async getUserById(id: string) {
    this.logger.log(`Fetching user ${id} from user service`);
    return this.microserviceClient.getUserById(id);
  }

  async updateUser(id: string, data: any) {
    this.logger.log(`Updating user ${id} via user service`);
    return this.microserviceClient.updateUser(id, data);
  }

  async deactivateUser(id: string) {
    this.logger.log(`Deactivating user ${id} via user service`);
    return this.microserviceClient.deactivateUser(id);
  }
}
