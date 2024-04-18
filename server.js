const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const AdminModel = require('./models/Admin');
const PatientModel = require('./models/Patient');
const DoctorModel = require('./models/Doctor');
const AppointmentModel = require('./models/Appointment');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors(
  {
  origin: ["http://localhost:5173"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true
  }
));
app.use(cookieParser());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/images')
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
  storage: storage
})

mongoose.connect('mongodb://0.0.0.0:27017/Hospital_React');

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "The token was not available" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        console.error(err);
        return res.json({ Error: "Token is wrong" });
      }
      console.log('Decoded Token:', decoded);
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  }
};

app.get('/home',verifyUser, (req, res) => {
  return res.json({Status: "Success", role: req.role, id: req.id})
})

// Start Admin All code *****

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  AdminModel.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (password !== user.password) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }

      const token = jwt.sign(
        { role: 'admin', id: user._id, email: user.email },
        "jwt-secret-key",
        { expiresIn: "1d" }
      );

      res.cookie("token", token);

      res.json({ message: "Login successful" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Database error.' });
    });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json( {Status: 'Logout successful'});
});

app.post('/createPatient', (req, res) => {
    const { name, gender, contact, address } = req.body;
  
    PatientModel.create({ name, gender, contact, address })
      .then(patient => res.json(patient))
      .catch(err => res.status(500).json({ error: 'Patient creation failed' }));
  });

  app.get('/view_Patient', (req, res) => {
    PatientModel.find()
      .then(patient => {
        res.json(patient);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve Patient data' });
      });
  });
  
  app.get('/getPatient/:id', (req, res) => {
    const patientId = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID.' });
    }
  
    PatientModel.findById(patientId)
      .then((patient) => {
        if (!patient) {
          return res.status(404).json({ error: 'patient not found.' });
        }
        res.status(200).json({ Status: 'Success', patient });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve patient.' });
      });
  });
  
  app.put('/updatePatient/:id', (req, res) => {
    const patientId = req.params.id;
    const { name, gender, contact, address } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID.' });
    }
  
    PatientModel.findByIdAndUpdate(
      patientId,
      { name: name, gender: gender, contact: contact, address: address },
      { new: true }
    )
      .then((updatedPatient) => {
        if (!updatedPatient) {
          return res.status(404).json({ error: 'Patient not found.' });
        }
        res.status(200).json({ Status: 'Success', message: 'Patient updated successfully.', updatedPatient });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to update patient.' });
      });
  });

  app.delete('/deletePatient/:id', async (req, res) => {
    const patientId = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
  
    try {
      // Find and delete related bookings first
      await AppointmentModel.deleteMany({ patientId: patientId });

      // Then delete the user
      const deletedPatient = await PatientModel.findByIdAndDelete(patientId);
  
      if (!deletedPatient) {
        return res.status(404).json({ error: 'Patient not found.' });
      }
  
      res.status(200).json({ Status: 'Success', message: 'Patient, associated Appointment items deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete Patient items.' });
    }
  });

app.post('/createDoctor', (req, res) => {
    const { name, contact, special } = req.body;
  
    DoctorModel.create({ name, contact, special })
      .then(doctor => res.json(doctor))
      .catch(err => res.status(500).json({ error: 'Doctor creation failed' }));
  });

  app.get('/view_Doctor', (req, res) => {
    DoctorModel.find()
      .then(doctor => {
        res.json(doctor);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve Doctor data' });
      });
  });
  
  app.get('/getDoctor/:id', (req, res) => {
    const doctorId = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ error: 'Invalid doctor ID.' });
    }
  
    DoctorModel.findById(doctorId)
      .then((doctor) => {
        if (!doctor) {
          return res.status(404).json({ error: 'doctor not found.' });
        }
        res.status(200).json({ Status: 'Success', doctor });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve doctor.' });
      });
  });
  
  app.put('/updateDoctor/:id', (req, res) => {
    const doctorId = req.params.id;
    const { name, contact, special } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ error: 'Invalid doctor ID.' });
    }
  
    DoctorModel.findByIdAndUpdate(
      doctorId,
      { name: name, contact: contact, special: special },
      { new: true }
    )
      .then((updatedDoctor) => {
        if (!updatedDoctor) {
          return res.status(404).json({ error: 'Doctor not found.' });
        }
        res.status(200).json({ Status: 'Success', message: 'Doctor updated successfully.', updatedDoctor });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to update Doctor.' });
      });
  });
  
  app.delete('/deleteDoctor/:id', async (req, res) => {
    const doctorId = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
  
    try {
      // Find and delete related bookings first
      await AppointmentModel.deleteMany({ doctorId: doctorId });

      // Then delete the user
      const deletedDoctor = await DoctorModel.findByIdAndDelete(doctorId);
  
      if (!deletedDoctor) {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
  
      res.status(200).json({ Status: 'Success', message: 'Doctor, associated Appointment items deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete Doctor items.' });
    }
  });

app.post('/createAppointment', (req, res) => {
    const { patientId, doctorId, date, time } = req.body;
  
    AppointmentModel.create({ patientId, doctorId, date, time })
      .then(appointment => res.json(appointment))
      .catch(err => res.status(500).json({ error: 'appointment creation failed' }));
  });

app.get('/view_Appointment', (req, res) => {
  AppointmentModel.find()
    .populate('doctorId', 'name')
    .populate('patientId', 'name')
    .then(appointments => {
      res.json(appointments);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve appointment data' });
    });
});
  
app.get('/getAppointment/:id', async (req, res) => {
  const appointmentId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return res.status(400).json({ error: 'Invalid appointment ID.' });
  }

  try {
    const appointment = await AppointmentModel
      .findById(appointmentId)
      .populate('doctorId', 'name')
      .populate('patientId', 'name');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    res.status(200).json({ Status: 'Success', appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve appointment.' });
  }
});
  
  app.put('/updateAppointment/:id', (req, res) => {
    const appointmentId = req.params.id;
    const { patientId, doctorId, date, time } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
  
    AppointmentModel.findByIdAndUpdate(
      appointmentId,
      { patientId: patientId, doctorId: doctorId, date, date, time: time },
      { new: true }
    )
      .then((updatedAppointment) => {
        if (!updatedAppointment) {
          return res.status(404).json({ error: 'Appointment not found.' });
        }
        res.status(200).json({ Status: 'Success', message: 'Appointment updated successfully.', updatedAppointment });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to update Appointment.' });
      });
  });
  
  app.delete('/deleteAppointment/:id', async (req, res) => {
    const appointmentId = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
  
    try {
      const deletedAppointment = await AppointmentModel.findByIdAndDelete(appointmentId);
  
      if (!deletedAppointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      res.status(200).json({ Status: 'Success', message: 'Appointment deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete Appointment.' });
    }
  });

  app.get('/patientCount', async (req, res) => {
    try {
      const patientCount = await PatientModel.countDocuments();
      res.json([{ patient: patientCount }]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/doctorCount', async (req, res) => {
    try {
      const doctorCount = await DoctorModel.countDocuments();
      res.json([{ doctor: doctorCount }]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/appointmentCount', async (req, res) => {
    try {
      const appointmentCount = await AppointmentModel.countDocuments();
      res.json([{ appointment: appointmentCount }]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
  app.put('/changePassword', verifyUser, (req, res) => {
    const userId = req.id;
    const { currentPassword, newPassword } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
  
    AdminModel.findById(userId)
      .then((user) => {
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
  
        // Compare the provided current password with the stored password (not recommended)
        if (currentPassword !== user.password) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
  
        // Update the user's password with the new password (not recommended)
        user.password = newPassword;
        user.save()
          .then((updatedUser) => {
            // Password changed successfully
            res.status(200).json({ message: 'Password changed successfully' });
          })
          .catch((saveErr) => {
            console.error(saveErr);
            res.status(500).json({ error: 'User update failed.' });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Password change failed.' });
      });
  });
  
app.listen(8081, () => {
    console.log('Server is running on port 8081');
  });