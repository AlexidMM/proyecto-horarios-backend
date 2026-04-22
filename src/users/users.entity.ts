import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ default: 'user', nullable: true })
  role?: string;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ type: 'json', nullable: true, default: () => "'{}'" })
  metadata?: object;
}
