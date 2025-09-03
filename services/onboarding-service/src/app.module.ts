import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingOrchestratorService } from './services/onboarding-orchestrator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingOrchestratorService],
  exports: [OnboardingOrchestratorService],
})
export class AppModule {}
