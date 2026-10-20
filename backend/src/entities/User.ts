import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SailingTrip } from './SailingTrip'
import { Boat } from './Boat'

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

  @OneToMany(() => Boat, (boat) => boat.createdBy)
  boats!: Boat[]
}
