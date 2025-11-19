const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lost-found', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Create sample data if database is empty
        await createSampleData();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create sample data for testing
async function createSampleData() {
    const Item = require('../models/Item');
    const User = require('../models/User');
    
    const itemCount = await Item.countDocuments();
    const userCount = await User.countDocuments();
    
    if (itemCount === 0) {
        console.log('📝 Creating sample items...');
        await Item.create([
            {
                title: "Black iPhone 13",
                description: "Black iPhone 13 with blue silicone case. Lost near library entrance.",
                category: "electronics",
                type: "lost",
                location: "Main Library",
                contactEmail: "john@campus.edu",
                color: "Black",
                brand: "Apple"
            },
            {
                title: "Student ID Card - Sarah Johnson",
                description: "Student ID card found in cafeteria. Name: Sarah Johnson.",
                category: "documents",
                type: "found", 
                location: "Student Cafeteria",
                contactEmail: "security@campus.edu",
                color: "White",
                brand: "University"
            },
            {
                title: "Blue Water Bottle",
                description: "Blue Hydro Flask with adventure stickers. Half full with water.",
                category: "other",
                type: "lost",
                location: "Gym Locker Room",
                contactEmail: "mike@campus.edu",
                color: "Blue",
                brand: "Hydro Flask"
            }
        ]);
        console.log('✅ Sample items created!');
    }
    
    if (userCount === 0) {
        console.log('👤 Creating sample user...');
        await User.create({
            name: "Demo User",
            email: "demo@campus.edu",
            password: "$2a$10$exampleHashedPassword",
            studentId: "20240001"
        });
        console.log('✅ Sample user created!');
    }
}

module.exports = connectDB;
