// backend/models/Availability.js
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import Barber from './Barber.js';

@Entity('availability')
@Index(['barber_id', 'date']) // Index for faster lookups by barber and date
class Availability {
    @PrimaryGeneratedColumn()
    availability_id;

    @ManyToOne(() => Barber, barber => barber.availabilitySlots) // [cite: 134, 142]
    @JoinColumn({ name: 'barber_id' })
    barber;

    @Column()
    barber_id; // Foreign Key to Barber table [cite: 134]

    @Column({ type: 'date' }) // Just the date [cite: 134]
    date;

    @Column({ type: 'time' }) // Start time for this availability block [cite: 134]
    available_from;

    @Column({ type: 'time' }) // End time for this availability block [cite: 134]
    available_until;

    @Column({ type: 'boolean', default: true }) // Can be set to false for breaks, holidays etc.
    is_available;

    @Column({ nullable: true }) // Optional: Reason if not available (e.g., 'Lunch Break', 'Holiday') [cite: 55, 56]
    reason;
}

export default Availability;