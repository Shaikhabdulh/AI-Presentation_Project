import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  phone: string

  @Column()
  category: string

  @Column()
  address: string

  @Column()
  city: string

  @Column({ type: 'decimal', default: 0 })
  rating: number

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  registeredAt: Date
}