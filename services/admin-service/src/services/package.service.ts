import { Injectable, Logger } from '@nestjs/common';
import { MicroserviceClientService } from './microservice-client.service';

@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    private readonly microserviceClient: MicroserviceClientService,
  ) {}

  async getAllPackages() {
    this.logger.log('Fetching all packages from package service');
    return this.microserviceClient.getPackages();
  }

  async getPackageById(id: string) {
    this.logger.log(`Fetching package ${id} from package service`);
    return this.microserviceClient.getPackageById(id);
  }

  async createPackage(data: any) {
    this.logger.log('Creating package via package service');
    return this.microserviceClient.createPackage(data);
  }

  async updatePackage(id: string, data: any) {
    this.logger.log(`Updating package ${id} via package service`);
    return this.microserviceClient.updatePackage(id, data);
  }

  async deletePackage(id: string) {
    this.logger.log(`Deleting package ${id} via package service`);
    return this.microserviceClient.deletePackage(id);
  }

  async getAllModules() {
    this.logger.log('Fetching all modules from package service');
    return this.microserviceClient.getModules();
  }

  async assignModulesToPackage(packageId: string, moduleIds: string[]) {
    this.logger.log(`Assigning modules to package ${packageId}`);
    return this.microserviceClient.assignModulesToPackage(packageId, moduleIds);
  }
}
