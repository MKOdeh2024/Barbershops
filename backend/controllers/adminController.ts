// backend/controllers/adminController.js
import { AppDataSource } from '../config/db.js';
import AdminSetting from '../config/models/AdminSetting.js';
// Import other models as needed (User, Booking, etc.)

const adminSettingRepository = AppDataSource.getRepository(AdminSetting);

// @desc    Get all admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getAllSettings = async (req, res) => {
  try {
    const settings = await adminSettingRepository.find();
    // Convert array to key-value object for easier frontend use
    const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching settings' });
  }
};

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  const settingsToUpdate = req.body; // Expecting an object like { "setting_key": "new_value", ... }

  try {
    // Use a transaction to update multiple settings safely
    await AppDataSource.transaction(async transactionalEntityManager => {
        for (const key in settingsToUpdate) {
            if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
                let setting = await transactionalEntityManager.findOne(AdminSetting, { where: { setting_key: key } });
                if (setting) {
                    setting.setting_value = settingsToUpdate[key];
                    await transactionalEntityManager.save(setting);
                } else {
                    // Optionally create if not exists, or throw error
                    console.warn(`Admin setting with key "${key}" not found. Skipping update.`);
                    // Alternatively:
                    // const newSetting = new AdminSetting();
                    // newSetting.setting_key = key;
                    // newSetting.setting_value = settingsToUpdate[key];
                    // await transactionalEntityManager.save(newSetting);
                }
            }
        }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating settings' });
  }
};

// Add other Admin-specific functions here:
// - Get system stats (total users, bookings today, etc.)
// - Manually trigger maintenance tasks
// - View audit logs (if implemented)
// - Force user logout / session invalidation