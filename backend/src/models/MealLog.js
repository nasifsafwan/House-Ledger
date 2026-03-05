import mongoose from 'mongoose';

const MealLogSchema = new mongoose.Schema({
    messId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mess',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },
    mealsCount: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

MealLogSchema.index({ messId: 1, userId: 1, date: 1 }, { unique: true });

export default mongoose.model('MealLog', MealLogSchema);
