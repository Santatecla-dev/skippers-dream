import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SailingTrip } from './SailingTrip'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  email!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  passwordHash!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @OneToMany(() => SailingTrip, (trip) => trip.createdBy)
  trips!: SailingTrip[]
}
