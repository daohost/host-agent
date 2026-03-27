import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArtifactsAccessGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessCode =
      request.headers['x-access-code'] ||
      request.query?.accessCode;

    const expectedCode = this.configService.get<string>('artifactsAccessCode');

    if (!expectedCode) {
      throw new UnauthorizedException('Artifacts access code is not configured');
    }

    if (accessCode !== expectedCode) {
      throw new UnauthorizedException('Invalid access code');
    }

    return true;
  }
}
