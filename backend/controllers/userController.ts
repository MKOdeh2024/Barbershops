// backend/controllers/userController.js
import { AppDataSource } from '../config/db.js';
import User from '../config/models/User.js';

const userRepository = AppDataSource.getRepository(User);

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // TODO: Add authorization check (ensure user is Admin)
    const users = await userRepository.find({ select: ['user_id', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'created_at'] });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching users' });
  }
};

// @desc    Get user by ID (Admin or Self)
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    // TODO: Add authorization (Admin or matching user ID)
    const user = await userRepository.findOne({ where: { user_id: req.params.id }, select: ['user_id', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'profile_picture', 'created_at'] });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching user' });
  }
};

// @desc    Update user profile (Self or Admin)
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  const { first_name, last_name, phone_number, profile_picture /* other fields */ } = req.body;
  try {
    // TODO: Add validation
    // TODO: Add authorization (Admin or matching user ID)
    const user = await userRepository.findOneBy({ user_id: req.params.id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields selectively
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone_number) user.phone_number = phone_number;
    if (profile_picture) user.profile_picture = profile_picture;
    // Be careful about updating email or role - might need special handling/permissions

    const updatedUser = await userRepository.save(user);
    // Return only non-sensitive fields
    res.json({
        user_id: updatedUser.user_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email, // Assuming email isn't changed here
        role: updatedUser.role,
        phone_number: updatedUser.phone_number,
        profile_picture: updatedUser.profile_picture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating user' });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    // TODO: Add authorization (Admin only)
    const result = await userRepository.delete(req.params.id);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    // Handle potential foreign key constraint errors if user has related records
    res.status(500).json({ message: 'Server Error deleting user' });
  }
};