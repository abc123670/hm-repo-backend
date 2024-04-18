const mongoose =require('mongoose')

const AppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    creationdate: {
        type: Date,
        default: Date.now,
    },
})

const AppointmentModel = mongoose.model("Appointment", AppointmentSchema)
module.exports = AppointmentModel