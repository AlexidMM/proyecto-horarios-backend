import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    console.log('🔐 Roles requeridos:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('👤 Usuario en request.user:', user);

    if (!user) {
      console.log('❌ No hay usuario en request.user, acceso denegado');
      return false;
    }

    const allowed = requiredRoles.includes(user.role);
    console.log('⚡ Acceso permitido:', allowed);
    return allowed;
  }
}

