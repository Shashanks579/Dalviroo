require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Required for creating the HTTP server to integrate with Socket.IO
const {Server} = require('socket.io')
const {Dish, Order} = require('./Sche');



const app = express();
const server = http.createServer(app);



const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" })); 
app.use(express.json());

// Placeholder middleware for authentication and authorization.
const authMiddleware = (req, res, next) => {
    // IMPORTANT: Replace this with actual authentication and role-based authorization logic for production.
    // For demonstration, a basic API Key check is implemented.
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        console.warn('Unauthorized API access attempt due to invalid or missing API Key.');
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing API Key' });
    }
    next();
};

mongoose.connect(process.env.MONGO_URI);

app.get('/api/seed', authMiddleware, async (req, res) => {
  try {
    const count = await Dish.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Database already seeded' });

    await Dish.insertMany([
      { name: 'Jumbo Chicken Wrap', predicted: 123 },
      { name: 'Vegetarian Lasagne', predicted: 456 },
      { name: 'Chicken Rice Feast', predicted: 1230 },
      { name: 'Grilled Chicken Breast', predicted: 1435 }
    ]);

    res.status(201).json({ message: 'Menu seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

app.get('/api/dishes', async (req, res) => {
    try{
        const dishes = await Dish.find();
        res.status(200).json(dishes); 
    } catch(error){
        res.status(500).json({ error: 'Failed to fetch dishes' });
    }
});

app.post('/api/dishes', authMiddleware, async (req, res) => { // Added authMiddleware
    try{
        const {name, predicted} = req.body;

        if(!name || predicted === undefined || isNaN(Number(predicted))){
            return res.status(400).json({error: 'Name and a valid predicted number are required'});
        }

        const newDish = new Dish({name, predicted: Number(predicted) || 0});
        await newDish.save();

        res.status(201).json({message:"Dish added successfully", dish: newDish});
    }catch(error){
        res.status(500).json({ error: 'Failed to add new dish' });
    }
})

app.post('/api/order', authMiddleware, async (req, res) =>{
    try{
       const {dish_id, quantity } = req.body; 
       if (!dish_id || !quantity){
         return res.status(400).json({error: 'missing data'});
       }
       if (!mongoose.Types.ObjectId.isValid(dish_id)) {
           return res.status(400).json({ error: 'Invalid dish ID format' });
       }
       if (typeof quantity !== 'number' || quantity <= 0 || quantity > 1000) { // Added upper bound and type check
           return res.status(400).json({ error: 'Quantity must be a number between 1 and 1000' });
       }

       const newORDER = new Order({dish_id,quantity})
       await newORDER.save();
       await newORDER.populate('dish_id');

       io.emit('new_order', newORDER);

       res.status(201).json({ message: 'Order sent', order: newORDER });
        
    }catch (error){
        res.status(500).json({ error: 'Failed to create order' });
    }
    
});

app.put('/api/dishes/:id', authMiddleware, async (req, res) =>{
    try{
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid dish ID format' });
        }
        const {predicted} = req.body;

        if(predicted === undefined || isNaN(Number(predicted))){
            return res.status(400).json({error: "A valid predicted value is required"});
        }

        const updatedDish = await Dish.findByIdAndUpdate(
            id,
            {predicted: Number(predicted)},
            {returnDocument: 'after'}
        );

        if(!updatedDish){
            return res.status(400).json({error: "Dish not found"});
        }

        io.emit('totals_updated', updatedDish);

        res.status(200).json(updatedDish);

    }catch (error){
        res.status(500).json({error:"Failed to update the prediction number"})
    }
});

app.get('/api/orders/pending', async (req, res) => {
    try {
        const pendingOrders = await Order.find({ status: 'pending' }).populate('dish_id', 'name');
        res.status(200).json(pendingOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
});

app.get('/api/report', authMiddleware, async(req, res) =>{
    try{
        const dishes = await Dish.find();
    

        const reportData = dishes.map(dish => ({
        Dish_Name: dish.name,
        Produced: dish.created,
        Predicted: dish.predicted,
        Variance: dish.created - dish.predicted 
        }));

        res.status(200).json(reportData);
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.get('/api/kitchen-queue', authMiddleware, async (req, res) => {
    try {
        // Fetch all pending orders and attach the dish stats
        const pendingOrders = await Order.find({ status: 'pending' })
            .populate('dish_id')
            .sort({ created_at: 1 });
            
        res.status(200).json(pendingOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
});

app.post('/api/reset-day', authMiddleware, async (req, res) => {
    try {
        // 1. Delete all pending orders from the database
        await Order.deleteMany({});
        
        // 2. Reset the 'created' count to 0 for all dishes
        await Dish.updateMany({}, { $set: { created: 0 } });
        
        // 3. Broadcast the kill signal to all connected tabs
        io.emit('day_reset');
        
        res.status(200).json({ message: "System reset successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset day" });
    }
});

io.on('connection', (socket) => {
    console.log(`Kitchen Screen connected: ${socket.id}`);

    // Cook clicks "DONE"
    socket.on('mark_done', async (orderID) => {
        try {
            const order = await Order.findByIdAndUpdate(
                orderID,
                { status: 'completed' },
                { returnDocument: 'after' }
            );

            if (order) {
                // Get the updated dish data after doing the math
                const updatedDish = await Dish.findByIdAndUpdate(
                    order.dish_id,
                    { $inc: { created: order.quantity } },
                    { returnDocument: 'after' } // Must be true to return the new numbers
                );

                io.emit('order_cleared', orderID);
                
                // NEW LINE: Tell all screens the created count went up
                io.emit('totals_updated', updatedDish);
            }
        } catch(error) {
            console.error('Error marking order done:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Kitchen Screen disconnected: ${socket.id}`);
    });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Sever is active on port http://localhost:${PORT}`);
});
