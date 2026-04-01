import { DynamicModule, Logger, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';
import { TelegramUpdate } from './telegram.update';
import { NoopTelegramService } from './noop-telegram.service';

@Module({})
export class TelegramModule {
  private static readonly logger = new Logger(TelegramModule.name);

  static forRoot(): DynamicModule {
    const token = process.env.telegramBotToken;

    if (!token) {
      this.logger.warn(
        'telegramBotToken is not set — Telegram module disabled',
      );
      return {
        module: TelegramModule,
        providers: [
          { provide: TelegramService, useClass: NoopTelegramService },
        ],
        exports: [TelegramService],
      };
    }

    return {
      module: TelegramModule,
      imports: [
        TelegrafModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            token: config.getOrThrow<string>('telegramBotToken'),
          }),
        }),
      ],
      providers: [TelegramService, TelegramUpdate],
      exports: [TelegramService],
    };
  }
}
