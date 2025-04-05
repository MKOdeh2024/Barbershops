// backend/models/Booking.js
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import User from './User.js';
import Barber from './Barber.js';
import Service from './Service.js';
import Payment from './Payment.js';
import BookingProduct from './BookingProduct.js'; // For ManyToMany relation

@Entity('bookings')
class Booking {
    @PrimaryGeneratedColumn()
    booking_id;

    @ManyToOne(() => User, user => user.bookings) // [cite: 125, 136]
    @JoinColumn({ name: 'user_id' })
    user; // Client making the booking

    @Column()
    user_id; // Foreign Key to User table [cite: 125]

    @ManyToOne(() => Barber, barber => barber.bookings) // [cite: 125, 137]
    @JoinColumn({ name: 'barber_id' })
    barber; // Barber assigned to the booking

    @Column()
    barber_id; // Foreign Key to Barber table [cite: 125]

    @ManyToOne(() => Service, service => service.bookings) // [cite: 127, 138]
    @JoinColumn({ name: 'service_id' })
    service; // Service booked

    @Column()
    service_id; // Foreign Key to Service table [cite: 125]

    @Column({
        type: 'enum',
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], // [cite: 125]
        default: 'Pending'
    })
    status;

    @Column({ type: 'timestamp' })
    booking_time; // [cite: 125]

    @Column({ nullable: true }) // In minutes or similar unit
    estimated_duration; // Calculated based on service [cite: 125]

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    total_price; // [cite: 125]

    @Column({
        type: 'enum',
        enum: ['Pending', 'Paid', 'Refunded'], // [cite: 125]
        default: 'Pending'
    })
    payment_status;

    @CreateDateColumn()
    created_at;

    @UpdateDateColumn()
    updated_at;

    // Relationships
    @OneToOne(() => Payment, payment => payment.booking) // [cite: 129, 139]
    payment; // Associated payment details

    @OneToMany(() => BookingProduct, bookingProduct => bookingProduct.booking) // For ManyToMany with Product [cite: 140]
    bookingProducts; // Products associated with this booking
}

export default Booking;