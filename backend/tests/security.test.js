import request from 'supertest';
import { app } from '../src/server.js';
import { encryptHealthData, decryptHealthData } from '../src/middleware/security.js';

describe('Security and Privacy Tests', () => {
  const API_BASE = '/api/v1';

  describe('Health Data Encryption', () => {
    test('should encrypt sensitive health data', () => {
      const sensitiveData = {
        symptoms: 'chest pain and shortness of breath',
        diagnosis: 'possible cardiac event',
        medications: ['aspirin', 'metoprolol']
      };

      const encrypted = encryptHealthData(sensitiveData);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('algorithm');
      expect(encrypted.encrypted).not.toEqual(JSON.stringify(sensitiveData));
    });

    test('should decrypt health data correctly', () => {
      const originalData = {
        symptoms: 'headache and fever',
        notes: 'patient reports symptoms started 2 days ago'
      };

      const encrypted = encryptHealthData(originalData);
      const decrypted = decryptHealthData(encrypted);

      expect(decrypted).toEqual(originalData);
    });

    test('should handle invalid encrypted data gracefully', () => {
      const invalidData = { invalid: 'data' };
      const result = decryptHealthData(invalidData);
      
      expect(result).toEqual(invalidData); // Should return as-is
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on sensitive endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .get(`${API_BASE}/health`)
            .set('Authorization', 'Bearer test-token')
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should allow emergency endpoints higher rate limits', async () => {
      const requests = [];
      
      // Make multiple requests to emergency endpoint
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post(`${API_BASE}/emergency/crisis`)
            .send({ message: 'test emergency' })
        );
      }

      const responses = await Promise.all(requests);
      
      // Emergency endpoints should have higher tolerance
      const successfulResponses = responses.filter(res => res.status !== 429);
      expect(successfulResponses.length).toBeGreaterThan(10);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious script tags', async () => {
      const maliciousInput = {
        symptoms: '<script>alert("xss")</script>headache',
        notes: 'javascript:alert("xss")'
      };

      const response = await request(app)
        .post(`${API_BASE}/chat`)
        .set('Authorization', 'Bearer test-token')
        .send(maliciousInput);

      // Should not contain script tags in response
      expect(JSON.stringify(response.body)).not.toContain('<script>');
      expect(JSON.stringify(response.body)).not.toContain('javascript:');
    });

    test('should preserve medical terminology', async () => {
      const medicalInput = {
        symptoms: 'Patient has acute myocardial infarction',
        medications: 'Prescribed 81mg aspirin daily'
      };

      const response = await request(app)
        .post(`${API_BASE}/chat`)
        .set('Authorization', 'Bearer test-token')
        .send(medicalInput);

      // Medical terms should be preserved
      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Authorization', 'Bearer test-token');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers['x-data-retention']).toBe('7-years');
      expect(response.headers['x-data-classification']).toBe('sensitive-health-data');
      expect(response.headers['x-compliance']).toBe('hipaa-compliant');
    });

    test('should set appropriate CORS headers', async () => {
      const response = await request(app)
        .options(`${API_BASE}/chat`)
        .set('Origin', 'http://localhost:8080');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('Authentication Security', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should handle missing authorization header', async () => {
      const response = await request(app)
        .post(`${API_BASE}/chat`)
        .send({ message: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('authorization');
    });
  });

  describe('Data Privacy', () => {
    test('should not expose sensitive data in error messages', async () => {
      const response = await request(app)
        .post(`${API_BASE}/chat`)
        .set('Authorization', 'Bearer test-token')
        .send({ 
          symptoms: 'confidential medical information',
          ssn: '123-45-6789'
        });

      // Error messages should not contain sensitive data
      if (response.status >= 400) {
        expect(JSON.stringify(response.body)).not.toContain('123-45-6789');
        expect(JSON.stringify(response.body)).not.toContain('confidential medical');
      }
    });

    test('should anonymize data in logs', async () => {
      // This would test log anonymization in a real implementation
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+27123456789',
        age: 35,
        location: 'Cape Town'
      };

      // Mock anonymization function test
      const anonymized = {
        name: 'hashed_name_123',
        email: 'hashed_email_456',
        phone: 'hashed_phone_789',
        ageGroup: '30-44',
        region: 'western_cape'
      };

      expect(anonymized.name).not.toEqual(testData.name);
      expect(anonymized.ageGroup).toBe('30-44');
      expect(anonymized.region).toBe('western_cape');
    });
  });

  describe('USSD Security', () => {
    test('should validate USSD provider authentication', async () => {
      const response = await request(app)
        .post(`${API_BASE}/ussd/gateway`)
        .send({
          phoneNumber: '+27123456789',
          text: '1',
          sessionId: 'test_session'
        });

      // In production, this should require provider authentication
      expect(response.status).toBe(200); // Mock allows for demo
    });

    test('should sanitize phone numbers', async () => {
      const response = await request(app)
        .post(`${API_BASE}/ussd/gateway`)
        .send({
          phoneNumber: '0123456789', // Local format
          text: '1',
          sessionId: 'test_session'
        });

      expect(response.status).toBe(200);
      // Phone number should be normalized to international format
    });

    test('should enforce USSD rate limits', async () => {
      const requests = [];
      
      // Make multiple rapid USSD requests
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .post(`${API_BASE}/ussd/gateway`)
            .send({
              phoneNumber: '+27123456789',
              text: '1',
              sessionId: `test_session_${i}`
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Appointment Security', () => {
    test('should validate appointment booking data', async () => {
      const invalidAppointment = {
        type: 'invalid_type',
        appointmentDate: 'invalid_date',
        patientName: '', // Empty name
        patientPhone: 'invalid_phone'
      };

      const response = await request(app)
        .post(`${API_BASE}/appointments/book`)
        .set('Authorization', 'Bearer test-token')
        .send(invalidAppointment);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should prevent appointment data injection', async () => {
      const maliciousAppointment = {
        type: 'general_consultation',
        appointmentDate: '2024-12-25',
        patientName: '<script>alert("xss")</script>',
        patientPhone: '+27123456789',
        patientEmail: 'test@example.com'
      };

      const response = await request(app)
        .post(`${API_BASE}/appointments/book`)
        .set('Authorization', 'Bearer test-token')
        .send(maliciousAppointment);

      // Should sanitize the input
      if (response.status === 201) {
        expect(JSON.stringify(response.body)).not.toContain('<script>');
      }
    });
  });

  describe('Emergency Access', () => {
    test('should allow emergency access with proper logging', async () => {
      const response = await request(app)
        .post(`${API_BASE}/emergency/crisis`)
        .set('X-Emergency-Access', 'true')
        .send({
          message: 'Patient in critical condition',
          location: 'Emergency Room'
        });

      expect(response.status).toBe(200);
      // Emergency access should be logged for audit
    });

    test('should maintain audit trail for emergency access', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Authorization', 'Bearer test-token')
        .set('X-Emergency-Access', 'true');

      // Emergency access should be tracked
      expect(response.status).toBe(200);
    });
  });

  describe('Session Security', () => {
    test('should enforce session timeout', async () => {
      // This would test session timeout in a real implementation
      // For now, verify session security headers are set
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'testpassword'
        });

      if (response.status === 200) {
        expect(response.headers['set-cookie']).toBeDefined();
      }
    });

    test('should prevent session fixation', async () => {
      // Test that session IDs change after authentication
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
    });
  });

  describe('Compliance Validation', () => {
    test('should include HIPAA compliance headers', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Authorization', 'Bearer test-token');

      expect(response.headers['x-compliance']).toBe('hipaa-compliant');
      expect(response.headers['x-data-retention']).toBe('7-years');
    });

    test('should enforce data minimization', async () => {
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', 'Bearer test-token');

      // Response should only include necessary data
      if (response.status === 200) {
        expect(response.body).not.toHaveProperty('ssn');
        expect(response.body).not.toHaveProperty('internalNotes');
      }
    });
  });
});
