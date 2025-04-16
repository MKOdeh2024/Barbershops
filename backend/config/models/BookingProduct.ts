// backend/models/BookingProduct.js
// This is the join table for the ManyToMany relationship between Booking and Product
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import Booking from './Booking.js';
import Product from './Product.js';

@Entity('booking_products')
class BookingProduct {
    @PrimaryGeneratedColumn()
    booking_product_id: any;

    @ManyToOne(() => Booking, booking => booking.bookingProducts) // [cite: 132, 140]
    @JoinColumn({ name: 'booking_id' })
    booking: any;

    @Column()
    booking_id: any; // Foreign Key to Booking table [cite: 132]

    @ManyToOne(() => Product, product => product.bookingProducts) // [cite: 133, 140]
    @JoinColumn({ name: 'product_id' })
    product: any;

    @Column()
    product_id: any; // Foreign Key to Product table [cite: 132]

    @Column({ type: 'int', default: 1 })
    quantity: any; // [cite: 132]

    @Column({ type: 'decimal', precision: 10, scale: 2 }) // Price at the time of booking for this quantity
    total_price: any; // [cite: 132]
}

export default BookingProduct;