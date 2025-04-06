// backend/controllers/serviceController.js
import { AppDataSource } from '../config/db.js';
import Service from '../config/models/Service.js';

const serviceRepository = AppDataSource.getRepository(Service);

// @desc    Create a new service (Admin only)
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req, res) => {
  const { name, description, price, estimated_duration, category } = req.body;
  try {
    // TODO: Validation
    const service = new Service();
    service.name = name;
    service.description = description;
    service.price = price;
    service.estimated_duration = estimated_duration;
    service.category = category;

    const savedService = await serviceRepository.save(service);
    res.status(201).json(savedService);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating service' });
  }
};

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getAllServices = async (req, res) => {
  try {
    const services = await serviceRepository.find({ order: { category: 'ASC', name: 'ASC'} });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching services' });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
  try {
    const service = await serviceRepository.findOneBy({ service_id: req.params.id });
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching service' });
  }
};

// @desc    Update service (Admin only)
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req, res) => {
  const { name, description, price, estimated_duration, category } = req.body;
  try {
    // TODO: Validation
    const service = await serviceRepository.findOneBy({ service_id: req.params.id });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (estimated_duration !== undefined) service.estimated_duration = estimated_duration;
    if (category !== undefined) service.category = category;

    const updatedService = await serviceRepository.save(service);
    res.json(updatedService);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating service' });
  }
};

// @desc    Delete service (Admin only)
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req, res) => {
  try {
    // Check if service is used in bookings? Maybe prevent deletion or mark inactive instead.
    const result = await serviceRepository.delete(req.params.id);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting service' });
  }
};