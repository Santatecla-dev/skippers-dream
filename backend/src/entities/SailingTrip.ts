import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity('sailing_trips')
export class SailingTrip {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  title!: string

  @Column({ type: 'varchar' })
  boatName!: string

  @Column({ type: 'varchar' })
  departurePort!: string

  @Column({ type: 'timestamptz' })
  departureAt!: Date

  @Column({ type: 'varchar', nullable: true })
  destination!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => User, (user) => user.trips, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null
}
