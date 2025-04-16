// backend/models/Product.js
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import BookingProduct from './BookingProduct.js'; // For ManyToMany relation

@Entity('products')
class Product {
    @PrimaryGeneratedColumn()
    product_id: any;

    @Column({ length: 150 })
    name: string; // [cite: 131]

    @Column({ type: 'text', nullable: true })
    description: any; // [cite: 131]

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: any; // [cite: 131]

    @Column({ type: 'int', default: 0 })
    stock_quantity: any; // [cite: 131]

    @Column({
        type: 'enum',
        enum: ['Haircare', 'Skincare', 'Tools', 'Beardcare'], // [cite: 131, 71] Added Beardcare based on doc
        nullable: true
    })
    category: any;

    @Column({ nullable: true }) // URL for product image
    image_url: string;

    @CreateDateColumn()
    created_at: any; // [cite: 131]

    @UpdateDateColumn()
    updated_at: any; // [cite: 131]

    // Relationships
    @OneToMany(() => BookingProduct, bookingProduct => bookingProduct.product) // For ManyToMany with Booking [cite: 140]
    bookingProducts: any;
}

export default Product;