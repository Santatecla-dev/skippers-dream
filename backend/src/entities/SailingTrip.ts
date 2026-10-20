import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'
import { Boat } from './Boat'

export const TRIP_STATUSES = ['planned', 'completed'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

@Entity('sailing_trips')
export class SailingTrip {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  title!: string

  @Column({ type: 'varchar', nullable: true })
  boatName!: string | null

  @Column({ type: 'varchar' })
  departurePort!: string

  @Column({ type: 'timestamptz' })
  departureAt!: Date

  @Column({ type: 'varchar', nullable: true })
  destination!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ type: 'varchar', default: 'planned' })
  status!: TripStatus

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => User, (user) => user.trips, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null

  @ManyToOne(() => Boat, (boat) => boat.trips, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'boatId' })
  boat!: Boat | null
}
