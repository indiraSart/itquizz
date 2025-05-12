const Faq = require('../models/Faq');

// Create a new FAQ
exports.createFaq = async (req, res) => {
    try {
        const faq = new Faq(req.body);
        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        res.status(500).json({ message: 'Error creating FAQ', error: error.message });
    }
};

// Get all FAQs
exports.getAllFaqs = async (req, res) => {
    try {
        const faqs = await Faq.find();
        res.status(200).json(faqs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
    }
};

// Get a single FAQ by ID
exports.getFaqById = async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json(faq);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching FAQ', error: error.message });
    }
};

// Update an FAQ by ID
exports.updateFaq = async (req, res) => {
    try {
        const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json(faq);
    } catch (error) {
        res.status(500).json({ message: 'Error updating FAQ', error: error.message });
    }
};

// Delete an FAQ by ID
exports.deleteFaq = async (req, res) => {
    try {
        const faq = await Faq.findByIdAndDelete(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
    }
};