const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    predicted: { type: Number, default: 0 },
    created: { type: Number, default: 0 } 
});

const orderSchema = new mongoose.Schema({
    dish_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

const Dish = mongoose.model('Dish', dishSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { Dish, Order };