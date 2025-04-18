// models/User.js (or User.ts)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import Booking from './Booking.js'; // Import related entity
import Notification from './Notification.js'; // Import related entity
import bcrypt from 'bcrypt';

@Entity('users') // Specify table name if different from class name
class User {
    @PrimaryGeneratedColumn()
    user_id: number; // [cite: 122]

    @Column({ length: 50 })
    first_name: string; // [cite: 122]

    @Column({ length: 50 })
    last_name: string; // [cite: 122]

    @Column({ unique: true, length: 50})
    email: string; // [cite: 122]

    @Column()
    password_hash: string; // [cite: 122]

    @Column({ nullable: true, length: 20 })
    phone_number: string; // [cite: 122]

    @Column({
        type: 'enum',
        enum: ['Admin', 'barber', 'Co-Barber', 'Client'], // [cite: 33, 34, 35, 122]
        default: 'Client'
    })
    role: string; // [cite: 122]

    @Column({ nullable: true })
    profile_picture: string; // [cite: 122]

    // --- New Fields for Email Confirmation ---
    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false }) // Select false prevents fetching by default
    confirmation_token: string | null;

    @Column({ type: 'timestamp', nullable: true, select: false }) // Select false prevents fetching by default
    confirmation_token_expires: Date | null;
    // --- End New Fields ---

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date; // [cite: 122]

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date; // [cite: 122]

    // Relationships
    @OneToMany(() => Booking, booking => booking.user) // Link to Booking entity
    bookings: string; // [cite: 122, 136]

    @OneToMany(() => Notification, notification => notification.user) // Link to Notification entity
    notifications: string; // [cite: 123, 141]
    barberProfiles: string;

    // Password hashing method (example)
    async hashPassword(password: string | Buffer) {
      const saltRounds = 10;
      this.password_hash = await bcrypt.hash(password, saltRounds); // Using bcrypt [cite: 84]
    }

    // Password comparison method (example)
    async comparePassword(candidatePassword: string | Buffer) {
      return bcrypt.compare(candidatePassword, this.password_hash);
    }
}

export default User;

// --- Define other models (Barber, Booking, Service, etc.) similarly, ---
// --- including attributes and relationships as defined in the document---