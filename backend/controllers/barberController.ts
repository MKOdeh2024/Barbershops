// backend/controllers/barberController.js
import { AppDataSource } from '../config/db.js';
import Barber from '../config/models/Barber.js';
import User from '../config/models/User.js';
import Availability from '../config/models/Availability.js';

const barberRepository = AppDataSource.getRepository(Barber);
const availabilityRepository = AppDataSource.getRepository(Availability);
const userRepository = AppDataSource.getRepository(User);

// @desc    Create a new barber profile (Admin only)
// @route   POST /api/barbers
// @access  Private/Admin
export const createBarber = async (req, res) => {
  const { user_id, specialization, status } = req.body;
  try {
    // TODO: Validation
    // Check if user exists and has role 'Co-Barber'
    const user = await userRepository.findOneBy({ user_id: user_id, role: 'Co-Barber' });
    if (!user) {
        return res.status(400).json({ message: 'Valid Co-Barber User ID is required' });
    }
    // Check if barber profile already exists for this user
    const existingBarber = await barberRepository.findOneBy({ user_id: user_id });
    if (existingBarber) {
        return res.status(400).json({ message: 'Barber profile already exists for this user' });
    }

    const barber = new Barber();
    barber.user_id = user_id;
    barber.specialization = specialization;
    barber.status = status || 'Active'; // Default to active

    const savedBarber = await barberRepository.save(barber);
    res.status(201).json(savedBarber);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating barber profile' });
  }
};

// @desc    Get all barbers (Public or Private)
// @route   GET /api/barbers
// @access  Public
export const getAllBarbers = async (req, res) => {
  try {
    // Fetch barbers and join with user details (select specific fields)
    const barbers = await barberRepository.find({
        where: { status: 'Active'}, // Optionally filter only active barbers for public view
        relations: ['user'],
        select: { // Select specific fields to avoid exposing sensitive data
            barber_id: true,
            specialization: true,
            status: true,
            user: {
                user_id: true,
                first_name: true,
                last_name: true,
                profile_picture: true
            }
        }
    });
    res.json(barbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching barbers' });
  }
};

// @desc    Get barber by ID (Public or Private)
// @route   GET /api/barbers/:id
// @access  Public
export const getBarberById = async (req, res) => {
  try {
    const barber = await barberRepository.findOne({
        where: { barber_id: req.params.id },
        relations: ['user', 'availabilitySlots'], // Include availability
         select: {
            barber_id: true,
            specialization: true,
            status: true,
            user: { user_id: true, first_name: true, last_name: true, profile_picture: true },
            availabilitySlots: true // Include full availability details
        }
    });
    if (barber) {
      res.json(barber);
    } else {
      res.status(404).json({ message: 'Barber not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching barber' });
  }
};

// @desc    Update barber profile (Admin only)
// @route   PUT /api/barbers/:id
// @access  Private/Admin
export const updateBarber = async (req, res) => {
  const { specialization, status } = req.body;
  try {
    // TODO: Validation
    const barber = await barberRepository.findOneBy({ barber_id: req.params.id });
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (specialization !== undefined) barber.specialization = specialization;
    if (status !== undefined) barber.status = status;

    const updatedBarber = await barberRepository.save(barber);
    res.json(updatedBarber);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating barber' });
  }
};

// @desc    Delete barber profile (Admin only)
// @route   DELETE /api/barbers/:id
// @access  Private/Admin
export const deleteBarber = async (req, res) => {
  try {
    // Consider implications: reassign bookings? mark as inactive instead?
    const result = await barberRepository.delete(req.params.id);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Barber not found' });
    }
    res.json({ message: 'Barber profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting barber' });
  }
};


// --- Availability Management ---

// @desc    Set/Update barber availability
// @route   POST /api/barbers/:id/availability
// @access  Private (Assigned Barber or Admin)
export const setBarberAvailability = async (req, res) => {
    const barber_id = req.params.id;
    const availabilityData = req.body; // Expecting an array of { date, available_from, available_until, is_available, reason }

    try {
        // TODO: Authorization (check if logged-in user matches barber or is admin)
        // TODO: Validation of input data array
        // TODO: Consider using a transaction to update multiple slots

        // Example: Replace all availability for a specific date range or just add/update
        // This is simplified - real implementation might need merging or deleting old slots

        const savedSlots: Availability[] = [];
        for (const slotData of availabilityData) {
            // Find existing or create new
            // let slot = await availabilityRepository.findOneBy({ barber_id, date: slotData.date, available_from: slotData.available_from });
            // if (!slot) {
            //     slot = new Availability();
            // }
            const slot = new Availability(); // Simplification: creating new slots here
            slot.barber_id = parseInt(barber_id, 10);
            slot.date = slotData.date;
            slot.available_from = slotData.available_from;
            slot.available_until = slotData.available_until;
            slot.is_available = slotData.is_available !== undefined ? slotData.is_available : true;
            slot.reason = slotData.reason;
            const saved = await availabilityRepository.save(slot);
            savedSlots.push(saved);
        }

        res.status(201).json(savedSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error setting availability' });
    }
};

// @desc    Get barber availability for a date range
// @route   GET /api/barbers/:id/availability
// @access  Public (or Private depending on requirements)
export const getBarberAvailability = async (req, res) => {
    const barber_id = req.params.id;
    const { startDate, endDate } = req.query; // Expecting date strings

    try {
        // TODO: Add date validation
        const queryBuilder = availabilityRepository.createQueryBuilder("availability")
            .where("availability.barber_id = :barber_id", { barber_id });

        if (startDate) {
            queryBuilder.andWhere("availability.date >= :startDate", { startDate });
        }
        if (endDate) {
             queryBuilder.andWhere("availability.date <= :endDate", { endDate });
        }
        queryBuilder.orderBy("availability.date", "ASC").addOrderBy("availability.available_from", "ASC");

        const availabilitySlots = await queryBuilder.getMany();

        res.json(availabilitySlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching availability' });
    }
};