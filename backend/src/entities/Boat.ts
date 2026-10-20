import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SailingTrip } from './SailingTrip'
import { User } from './User'

export const BOAT_OWNERSHIP_TYPES = ['owner', 'co-owner'] as const
export type BoatOwnershipType = (typeof BOAT_OWNERSHIP_TYPES)[number]

@Entity('boats')
export class Boat {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  brand!: string

  @Column({ type: 'varchar' })
  model!: string

  @Column({ type: 'real' })
  lengthMeters!: number

  @Column({ type: 'int' })
  yearBuilt!: number

  @Column({ type: 'varchar' })
  ownershipType!: BoatOwnershipType

  @Column({ type: 'varchar', nullable: true })
  engineType!: string | null

  @Column({ type: 'varchar', nullable: true })
  sailPlan!: string | null

  @Column({ type: 'text', nullable: true })
  renewals!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => User, (user) => user.boats, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User

  @OneToMany(() => SailingTrip, (trip) => trip.boat)
  trips!: SailingTrip[]
}

