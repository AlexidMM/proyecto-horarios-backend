
import { Controller, Get, Post, Body, Param, Patch, Delete, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';


@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}
  

  @Get()
  async getAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }
@Post('login')
async login(@Body() body: { email: string; password: string }) {
  const user = await this.usersService.findByEmail(body.email);

  if (!user) {
    return {
      success: false,
      error: 'El correo no existe',
    };
  }

  const bcrypt = await import('bcryptjs');
  const passwordMatches = await bcrypt.compare(body.password, user.password_hash);

  if (!passwordMatches) {
    return {
      success: false,
      error: 'Contraseña incorrecta',
    };
  }

  // Usuario válido, devolver datos
  const { password_hash, ...safeUser } = user;
  return {
    success: true,
    message: 'Login exitoso',
    user: safeUser,
  };
}

@Post('login-admin')
async loginAdmin(@Body() body: { email: string; password: string }) {
  const user = await this.usersService.findByEmail(body.email);

  if (!user) {
    return {
      success: false,
      error: 'El correo no existe',
    };
  }
  if (user.role !== 'administrador') {
    return {
      success: false,
      error: 'Acceso denegado: no es un usuario administrador',
    };
  }

  const bcrypt = await import('bcryptjs');
  const passwordMatches = await bcrypt.compare(body.password, user.password_hash);

  if (!passwordMatches) {
    return {
      success: false,
      error: 'Contraseña incorrecta',
    };
  }

  // Generar y devolver JWT usando authService.login
  return this.authService.login(user.email, body.password);
}

  
  @Post('register')
  async create(@Body() body: { email: string; passwordHash: string; fullName?: string; role?: string; metadata?: object }) {
    // if (!body.email.endsWith('@uteq.edu.mx')) {
    //   return { error: 'error' };
    // }
    // Validar si el email ya existe
    const exists = await this.usersService.findByEmail(body.email);
    if (exists) {
      return { error: 'El correo ya está registrado.' };
    }
    try {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.passwordHash, salt);
      const user = await this.usersService.create({
        ...body,
        passwordHash: hashedPassword,
      });
      
    } catch (err) {
      // Prisma error de restricción única
      if (err.code === 'P2002') {
        return { error: 'El correo ya está registrado.' };
      }
      return { error: 'Error al registrar usuario.' };
    }
  }


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ email: string; passwordHash: string; fullName?: string; role?: string; metadata?: object }>
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
