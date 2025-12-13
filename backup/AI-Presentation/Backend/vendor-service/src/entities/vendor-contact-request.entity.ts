import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Vendor } from './vendor.entity'

@Entity('vendor_contact_requests')
export class VendorContactRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  vendorId: string

  @Column({ type: 'uuid' })
  itemId: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'enum', enum: ['pending', 'responded', 'fulfilled'], default: 'pending' })
  status: 'pending' | 'responded' | 'fulfilled'

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor
}