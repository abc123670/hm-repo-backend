const mongoose =require('mongoose')

const DoctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    special: { type: String, required: true },
    date: {
        type: Date,
        default: Date.now,
    },
})

const DoctorModel = mongoose.model("Doctor", DoctorSchema)
module.exports = DoctorModel