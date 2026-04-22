import { Injectable } from '@nestjs/common';
// import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class UsersService {
  constructor( private prisma: PrismaService) {}


  async findAll() {
    return this.prisma.users.findMany();
  }


  async findByUsername(full_name: string) {
    return this.prisma.users.findMany({
      where: { full_name },
    });
  }


  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName?: string;
    role?: string;
    metadata?: object;
  }) {
    return this.prisma.users.create({
      data: {
        email: data.email,
        password_hash: data.passwordHash,
        full_name: data.fullName,
        role: data.role,
        metadata: data.metadata,
      },
    });
  }

  async update(id: string, data: Partial<{
    email: string;
    passwordHash: string;
    fullName?: string;
    role?: string;
    metadata?: object;
  }>) {
    return this.prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        password_hash: data.passwordHash,
        full_name: data.fullName,
        role: data.role,
        metadata: data.metadata,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.users.delete({
      where: { id },
    });
  }
}

      

