// models/User.js (or User.ts)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import Booking from './Booking.js'; // Import related entity
import Notification from './Notification.js'; // Import related entity
import bcrypt from 'bcrypt';

@Entity('users') // Specify table name if different from class name
class User {
    @PrimaryGeneratedColumn()
    user_id; // [cite: 122]

    @Column({ length: 50 })
    first_name; // [cite: 122]

    @Column({ length: 50 })
    last_name; // [cite: 122]

    @Column({ unique: true, length: 100 })
    email; // [cite: 122]

    @Column()
    password_hash; // [cite: 122]

    @Column({ nullable: true, length: 20 })
    phone_number; // [cite: 122]

    @Column({
        type: 'enum',
        enum: ['Admin', 'Co-Barber', 'Client'], // [cite: 33, 34, 35, 122]
        default: 'Client'
    })
    role; // [cite: 122]

    @Column({ nullable: true })
    profile_picture; // [cite: 122]

    @CreateDateColumn()
    created_at; // [cite: 122]

    @UpdateDateColumn()
    updated_at; // [cite: 122]

    // Relationships
    @OneToMany(() => Booking, booking => booking.user) // Link to Booking entity
    bookings; // [cite: 122, 136]

    @OneToMany(() => Notification, notification => notification.user) // Link to Notification entity
    notifications; // [cite: 123, 141]
    barberProfiles: any;

    // Password hashing method (example)
    async hashPassword(password) {
      const saltRounds = 10;
      this.password_hash = await bcrypt.hash(password, saltRounds); // Using bcrypt [cite: 84]
    }

    // Password comparison method (example)
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password_hash);
    }
}

export default User;

// --- Define other models (Barber, Booking, Service, etc.) similarly, ---
// --- including attributes and relationships as defined in the document---