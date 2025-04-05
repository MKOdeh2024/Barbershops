// backend/models/AdminSetting.js
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

@Entity('admin_settings')
class AdminSetting {
    @PrimaryGeneratedColumn()
    setting_id;

    @Index({ unique: true }) // Each setting key should be unique
    @Column({ length: 100 })
    setting_key; // e.g., "work_hours_start", "work_hours_end", "lunch_break_start", "peak_hour_multiplier" [cite: 135, 54, 56, 58]

    @Column({ type: 'text' })
    setting_value; // e.g., "14:00", "00:00", "1.5" [cite: 135]

    @Column({ type: 'text', nullable: true })
    description; // Optional description of the setting

    @UpdateDateColumn()
    updated_at; // [cite: 135]
}

export default AdminSetting;