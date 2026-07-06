import { Injectable, Logger } from '@nestjs/common';

export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;
  verifyOtp(phoneNumber: string, code: string): Promise<boolean>;
}

@Injectable()
export class SmsService implements SmsProvider {
  private readonly logger = new Logger(SmsService.name);
  private readonly codes = new Map<string, string>();

  async sendOtp(phoneNumber: string, code: string) {
    this.codes.set(phoneNumber, code);
    this.logger.log(`Dev OTP for ${phoneNumber}: ${code}`);
  }

  async verifyOtp(phoneNumber: string, code: string) {
    return this.codes.get(phoneNumber) === code;
  }
}
