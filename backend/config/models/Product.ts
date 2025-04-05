// backend/models/Product.js
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import BookingProduct from './BookingProduct.js'; // For ManyToMany relation

@Entity('products')
class Product {
    @PrimaryGeneratedColumn()
    product_id;

    @Column({ length: 150 })
    name; // [cite: 131]

    @Column({ type: 'text', nullable: true })
    description; // [cite: 131]

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price; // [cite: 131]

    @Column({ type: 'int', default: 0 })
    stock_quantity; // [cite: 131]

    @Column({
        type: 'enum',
        enum: ['Haircare', 'Skincare', 'Tools', 'Beardcare'], // [cite: 131, 71] Added Beardcare based on doc
        nullable: true
    })
    category;

    @Column({ nullable: true }) // URL for product image
    image_url;

    @CreateDateColumn()
    created_at; // [cite: 131]

    @UpdateDateColumn()
    updated_at; // [cite: 131]

    // Relationships
    @OneToMany(() => BookingProduct, bookingProduct => bookingProduct.product) // For ManyToMany with Booking [cite: 140]
    bookingProducts;
}

export default Product;