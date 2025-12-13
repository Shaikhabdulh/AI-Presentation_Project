import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'int' })
  minThreshold: number

  @Column()
  unit: string

  @Column()
  category: string

  @Column({ type: 'uuid' })
  userId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  get isLowStock(): boolean {
    return this.quantity <= this.minThreshold
  }
}