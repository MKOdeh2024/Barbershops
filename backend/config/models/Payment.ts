// backend/models/Payment.js
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import Booking from './Booking.js';

@Entity('payments')
class Payment {
    @PrimaryGeneratedColumn()
    payment_id: any;

    @OneToOne(() => Booking, booking => booking.payment) // [cite: 129, 139]
    @JoinColumn({ name: 'booking_id' })
    booking: any;

    @Column({ unique: true }) // Each booking should have only one primary payment record
    booking_id: any; // Foreign Key to Booking table [cite: 129]

    @Column({
        type: 'enum',
        enum: ['Credit Card', 'PayPal', 'Cash', 'Mobile Wallet'], // [cite: 129, 14]
        nullable: true // Might be null until payment is attempted/completed
    })
    payment_method: any;

    @Column({ type: 'timestamp', nullable: true })
    payment_date: Date; // [cite: 129]

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: any; // [cite: 129]

    @Column({
        type: 'enum',
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'], // [cite: 129]
        default: 'Pending'
    })
    payment_status: string;

    @Column({ nullable: true }) // Store transaction ID from payment gateway
    transaction_id: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({type : 'timestamp'})
    updated_at: Date;
}

export default Payment;