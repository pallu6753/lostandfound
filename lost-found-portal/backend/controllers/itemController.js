const Item = require('../models/Item');

// @desc    Get all items with filters
// @route   GET /api/items
exports.getItems = async (req, res) => {
    try {
        const { 
            type, 
            category, 
            search, 
            status = 'active',
            page = 1, 
            limit = 10 
        } = req.query;

        // Build filter object
        const filter = { status };
        if (type) filter.type = type;
        if (category) filter.category = category;
        
        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Item.countDocuments(filter);

        res.json({
            success: true,
            data: items,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching items: ' + error.message 
        });
    }
};

// @desc    Get single item
// @route   GET /api/items/:id
exports.getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching item: ' + error.message 
        });
    }
};

// @desc    Create new item
// @route   POST /api/items
exports.createItem = async (req, res) => {
    try {
        const item = await Item.create(req.body);
        
        res.status(201).json({ 
            success: true, 
            message: 'Item reported successfully!',
            data: item 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: 'Error creating item: ' + error.message 
        });
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Item updated successfully',
            data: item 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: 'Error updating item: ' + error.message 
        });
    }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Item deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting item: ' + error.message 
        });
    }
};