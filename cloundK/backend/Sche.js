const mongo = require('mongoose')

const dishes = new mongo.Schema({
    name:{type: String, require: true},
    predicted: {type: Number, default: 0},
    created: {type: Number, default: 0}
})

const order = new mongo.Schema({
    dish_id: {type: mongo.Schema.Types.ObjectId, ref:'Dish', require: true},
    quantity: {type: Number, require: true, min:1},
    status: {type: String, enum:['pending', 'completed'], default:'pending'},
    created_at: {type:Date, default:Date.now}
});

const Dish = mongo.model('Dish', dishes);
const Order = mongo.model('Order', order);

module.exports = {Dish, Order};