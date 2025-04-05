// backend/models/Notification.js
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import User from './User.js';

@Entity('notifications')
class Notification {
    @PrimaryGeneratedColumn()
    notification_id;

    @ManyToOne(() => User, user => user.notifications) // [cite: 130, 141]
    @JoinColumn({ name: 'user_id' })
    user; // User receiving the notification

    @Column()
    user_id; // Foreign Key to User table [cite: 130]

    @Column({ type: 'text' })
    message; // [cite: 130]

    @Column({
        type: 'enum',
        enum: ['Sent', 'Read', 'Unread'], // [cite: 130]
        default: 'Unread'
    })
    status;

    @Column({ nullable: true }) // Optional: Type of notification (e.g., 'Reminder', 'Confirmation', 'Cancellation')
    type;

    @CreateDateColumn()
    created_at; // [cite: 130]
}

export default Notification;