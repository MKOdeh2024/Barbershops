// backend/models/Service.js
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import Booking from './Booking.js';

@Entity('services')
class Service {
    @PrimaryGeneratedColumn()
    service_id;

    @Column({ length: 100 })
    name; // [cite: 128]

    @Column({ type: 'text', nullable: true })
    description; // [cite: 128]

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price; // [cite: 128, 75]

    @Column() // In minutes or similar unit
    estimated_duration; // [cite: 128, 41]

    @Column({ length: 50, nullable: true }) // e.g., 'Haircut Services', 'Hair Dye & Coloring Services' [cite: 41, 75]
    category;

    @CreateDateColumn()
    created_at;

    @UpdateDateColumn()
    updated_at;

    // Relationships
    @OneToMany(() => Booking, booking => booking.service) // [cite: 128, 138]
    bookings;
}

export default Service;