import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // JWT Configuration - Backward compatible
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Backward compatibility
    privateKey: process.env.JWT_PRIVATE_KEY || process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    publicKey: process.env.JWT_PUBLIC_KEY || process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY || '3600'), // 1 hour
    refreshTokenExpiry: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY || '604800'), // 7 days
    
    // Enhanced JWT Security
    issuer: process.env.JWT_ISSUER || 'devsfit-auth-service',
    audience: process.env.JWT_AUDIENCE || 'devsfit-app',
    algorithm: 'HS256', // Consider RS256 for production with asymmetric keys
  },

  // Google OAuth Configuration - Fixed property name
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback', // Backward compatibility
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@devsfit.com',
  },

  // SMS Configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
  },

  // Enhanced Security Configuration
  security: {
    // Password Requirements (NIST SP 800-63B compliant)
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'), // Increased from 8
      maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128'),
      requireComplexity: process.env.PASSWORD_REQUIRE_COMPLEXITY === 'true', // Generally false per NIST
      preventCommonPasswords: true,
      preventLeakedPasswords: true,
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15'), // minutes
    },

    // Two-Factor Authentication Configuration
    twoFactor: {
      // TOTP Settings (RFC 6238 compliant)
      totp: {
        issuer: process.env.TOTP_ISSUER || 'Devsfit',
        secretLength: parseInt(process.env.TOTP_SECRET_LENGTH || '32'), // bytes, industry standard
        window: parseInt(process.env.TOTP_TIME_WINDOW || '2'), // time steps (30s each)
        algorithm: process.env.TOTP_ALGORITHM || 'SHA1', // SHA1 is standard for TOTP
        digits: parseInt(process.env.TOTP_DIGITS || '6'),
        step: parseInt(process.env.TOTP_STEP || '30'), // seconds
      },

      // Backup Codes Configuration
      backupCodes: {
        count: parseInt(process.env.BACKUP_CODES_COUNT || '10'), // NIST recommends 8-10
        length: parseInt(process.env.BACKUP_CODES_LENGTH || '6'), // digits
        hashRounds: parseInt(process.env.BACKUP_CODES_HASH_ROUNDS || '12'), // bcrypt rounds
      },
      
      // Rate Limiting Configuration
      rateLimiting: {
        maxAttempts: parseInt(process.env.TOTP_MAX_ATTEMPTS || '5'),
        windowMs: parseInt(process.env.TOTP_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        lockoutDuration: parseInt(process.env.TOTP_LOCKOUT_DURATION || '900000'), // 15 minutes
        
        // Separate limits for different methods
        totpMaxAttempts: parseInt(process.env.TOTP_MAX_ATTEMPTS || '5'),
        backupMaxAttempts: parseInt(process.env.BACKUP_MAX_ATTEMPTS || '3'),
        
        // Progressive delays (in milliseconds)
        progressiveDelay: {
          enabled: process.env.PROGRESSIVE_DELAY_ENABLED === 'true',
          baseDelay: parseInt(process.env.BASE_DELAY_MS || '1000'), // 1 second
          maxDelay: parseInt(process.env.MAX_DELAY_MS || '30000'), // 30 seconds
          multiplier: parseFloat(process.env.DELAY_MULTIPLIER || '2'),
        },
      },

      // WebAuthn/FIDO2 Configuration (Future implementation)
      webauthn: {
        enabled: process.env.WEBAUTHN_ENABLED === 'true',
        rpId: process.env.WEBAUTHN_RP_ID || 'devsfit.com',
        rpName: process.env.WEBAUTHN_RP_NAME || 'Devsfit',
        origin: process.env.WEBAUTHN_ORIGIN || 'https://devsfit.com',
        timeout: parseInt(process.env.WEBAUTHN_TIMEOUT || '60000'), // 60 seconds
        
        // Attestation requirements
        attestation: process.env.WEBAUTHN_ATTESTATION || 'none', // 'none', 'indirect', 'direct'
        userVerification: process.env.WEBAUTHN_USER_VERIFICATION || 'preferred', // 'required', 'preferred', 'discouraged'
        
        // Authenticator requirements
        authenticatorAttachment: process.env.WEBAUTHN_AUTHENTICATOR_ATTACHMENT || 'platform', // 'platform', 'cross-platform'
        requireResidentKey: process.env.WEBAUTHN_REQUIRE_RESIDENT_KEY === 'true',
      },
    },

    // Session Management
    session: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '3600000'), // 1 hour in milliseconds
      inactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT || '1800000'), // 30 minutes
      
      // AAL-specific session timeouts (NIST SP 800-63B)
      aal1MaxAge: parseInt(process.env.AAL1_SESSION_MAX_AGE || '2592000000'), // 30 days
      aal2MaxAge: parseInt(process.env.AAL2_SESSION_MAX_AGE || '43200000'), // 12 hours
      aal3MaxAge: parseInt(process.env.AAL3_SESSION_MAX_AGE || '43200000'), // 12 hours
      
      aal1InactivityTimeout: parseInt(process.env.AAL1_INACTIVITY_TIMEOUT || '0'), // No timeout
      aal2InactivityTimeout: parseInt(process.env.AAL2_INACTIVITY_TIMEOUT || '1800000'), // 30 minutes
      aal3InactivityTimeout: parseInt(process.env.AAL3_INACTIVITY_TIMEOUT || '900000'), // 15 minutes
    },

    // Rate limiting for API endpoints - Backward compatibility
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // requests per window
      
      // Specific endpoint limits
      auth: {
        login: {
          windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
          max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'), // attempts per window
        },
        signup: {
          windowMs: parseInt(process.env.SIGNUP_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
          max: parseInt(process.env.SIGNUP_RATE_LIMIT_MAX || '3'), // attempts per window
        },
        twoFactor: {
          setup: {
            windowMs: parseInt(process.env.TOTP_SETUP_RATE_LIMIT_WINDOW || '300000'), // 5 minutes
            max: parseInt(process.env.TOTP_SETUP_RATE_LIMIT_MAX || '3'), // attempts per window
          },
          verify: {
            windowMs: parseInt(process.env.TOTP_VERIFY_RATE_LIMIT_WINDOW || '300000'), // 5 minutes
            max: parseInt(process.env.TOTP_VERIFY_RATE_LIMIT_MAX || '10'), // attempts per window
          },
          regenerate: {
            windowMs: parseInt(process.env.BACKUP_REGENERATE_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
            max: parseInt(process.env.BACKUP_REGENERATE_RATE_LIMIT_MAX || '2'), // attempts per window
          },
        },
      },
    },
  },

  // Backward compatibility for existing rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // requests per window
  },

  // Environment Configuration
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Feature Flags
  features: {
    registration: process.env.REGISTRATION_ENABLED !== 'false',
    socialLogin: process.env.SOCIAL_LOGIN_ENABLED !== 'false',
    emailVerification: process.env.EMAIL_VERIFICATION_ENABLED !== 'false',
    smsVerification: process.env.SMS_VERIFICATION_ENABLED === 'true',
    twoFactorAuth: process.env.TWO_FACTOR_AUTH_ENABLED !== 'false',
    webauthn: process.env.WEBAUTHN_ENABLED === 'true',
    biometrics: process.env.BIOMETRICS_ENABLED === 'true',
    
    // Beta features
    passkeys: process.env.PASSKEYS_ENABLED === 'true',
    adaptiveAuth: process.env.ADAPTIVE_AUTH_ENABLED === 'true',
    riskBasedAuth: process.env.RISK_BASED_AUTH_ENABLED === 'true',
  },
})); 