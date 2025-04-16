// backend/models/Notification.js
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import User from './User.js';

@Entity('notifications')
class Notification {
    @PrimaryGeneratedColumn()
    notification_id: any;

    @ManyToOne(() => User, user => user.notifications) // [cite: 130, 141]
    @JoinColumn({ name: 'user_id' })
    user: any; // User receiving the notification

    @Column()
    user_id: any; // Foreign Key to User table [cite: 130]

    @Column({ type: 'text' })
    message: any; // [cite: 130]

    @Column({
        type: 'enum',
        enum: ['Sent', 'Read', 'Unread'], // [cite: 130]
        default: 'Unread'
    })
    status: any;

    @Column({ nullable: true }) // Optional: Type of notification (e.g., 'Reminder', 'Confirmation', 'Cancellation')
    type: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date; // [cite: 130]
}

export default Notification;