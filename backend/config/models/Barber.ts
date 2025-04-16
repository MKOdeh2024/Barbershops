// backend/models/Barber.js
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import User from './User.js';
import Booking from './Booking.js';
import Availability from './Availability.js';

@Entity('barbers')
class Barber {
    @PrimaryGeneratedColumn()
    barber_id: number;

    @ManyToOne(() => User, user => user.barberProfiles) // Link back to the User account
    @JoinColumn({ name: 'user_id' }) // Explicitly define the foreign key column name
    user: any; // This holds the User entity associated with the barber

    @Column({ nullable: true }) // Store user_id directly as well if needed, though the relation is preferred
    user_id: any; // Foreign Key to User table

    @Column({ nullable: true, length: 100 })
    specialization : string; //

    // available_hours might be better managed in the Availability entity
    // @Column({ nullable: true })
    // available_hours;

    @Column({
        type: 'enum',
        enum: ['Active', 'Inactive'], //
        default: 'Active'
    })
    status: any;

    @CreateDateColumn()
    created_at: any;

    @UpdateDateColumn()
    updated_at: any;

    // Relationships
    @OneToMany(() => Booking, booking => booking.barber) //
    bookings: any;

    @OneToMany(() => Availability, availability => availability.barber) //
    availabilitySlots: any;
}

export default Barber;