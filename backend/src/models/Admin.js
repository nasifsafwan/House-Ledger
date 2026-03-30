import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 40
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
