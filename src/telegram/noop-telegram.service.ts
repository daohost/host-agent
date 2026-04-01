import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NoopTelegramService {
  public readonly markdown = 'HTML';
  public readonly daoUsers: Record<string, Record<string, number>> = {};

  private readonly logger = new Logger(NoopTelegramService.name);

  async onModuleInit() {}

  async getDaosInfo(): Promise<string> {
    return '';
  }

  async getSingleDaoInfo(): Promise<string> {
    return '';
  }

  async getDaoSelectionKeyboard() {
    return { inline_keyboard: [] };
  }

  async getDaoTelegramStats(): Promise<string> {
    return '';
  }

  async updateChatMembersCount() {}

  async sendMessage() {
    this.logger.warn('Telegram bot is not configured — message not sent');
  }
}
