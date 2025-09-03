import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Forgot Password (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset OTP for valid email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('password reset code has been sent');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);
    });

    it('should return 400 for missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return 400 for invalid OTP', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com',
          token: '000000',
          newPassword: 'NewSecurePass123!'
        })
        .expect(400);
    });

    it('should return 400 for invalid password format', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com',
          token: '123456',
          newPassword: 'weak'
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com'
        })
        .expect(400);
    });
  });
}); 