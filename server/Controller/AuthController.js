import { PythonShell } from "python-shell";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../Models/User.js";
import Election from "../Models/Election.js";
import Candidate from "../Models/Candidate.js";
import nodemailer from "nodemailer";

// http://localhost:5000/api/auth/register
//
// {
//     "username":"prnv",
//     "email":"abc@gmail.com",
//     "mobile":"1111111111",
//     "location":"120",
//     "password":"123"
//     }

//User
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Faces");
  },
  filename: function (req, file, cb) {
    // Unique filename with timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.body.username + "-" + file.fieldname + "-" + uniqueSuffix + "." + file.originalname.split(".").pop());
  },
});
var upload = multer({ storage: storage }).fields([
  { name: 'profile', maxCount: 1 },
  { name: 'idCard', maxCount: 1 }
]);
export const register = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        if (req.body.faceDescriptor && typeof req.body.faceDescriptor === "string") {
          req.body.faceDescriptor = JSON.parse(req.body.faceDescriptor);
        }

        // Generate a 6-digit random passcode
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        req.body.passcode = passcode;
        // Handle multiple files if they exist
        if (req.files) {
          if (req.files.profile) req.body.avatar = req.files.profile[0].filename;
          if (req.files.idCard) req.body.idCardImage = req.files.idCard[0].filename;
        }

        const newUser = await User.create(req.body);

        const mailSubject = "Welcome to E-Voting System";
        const mailContent = `Thank you for registering. You are now officially enrolled for the upcoming election.`;

        // Send a welcome email but DO NOT send the passcode. Passcode is given at login.
        try {
          await sendMail(mailContent, mailSubject, newUser);
          return res.status(201).send("Registration Successful! (You will receive your Session Passcode when you login)");
        } catch (mailError) {
          console.error("Mail Sending Failed during registration:", mailError);
          return res.status(201).send("Registration Successful! (You will receive your Session Passcode when you login)");
        }

      } catch (e) {
        console.error("Registration Error Details:", e);
        return res.status(500).json({
          message: "Registration Failed",
          error: e.message,
          stack: e.stack // For debugging
        });
      }
    });
  },
};

export const login = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    try {
      const findUser = await User.findOne({
        username: req.body.username,
      });

      if (!findUser) {
        return res.status(202).send("Invalid Username");
      }

      if (findUser.password !== req.body.password) {
        return res.status(202).send("Invalid Password");
      }

      // 🏆 RESEARCH FEATURE #8: Session-Unique Passcode
      // Generate a fresh 6-digit passcode for THIS session
      const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
      findUser.passcode = newPasscode;
      await findUser.save();

      console.log(`[SESSION PASSCODE] Issued for ${findUser.username}: ${newPasscode}`);

      return res.status(201).send(findUser);
    } catch (e) {
      console.error("Login Error:", e);
      return res.status(500).send("Server Error");
    }
  },
};

export const users = {
  deleteUserProfile: (user) => {
    // 🚩 FIX: If it's the default Firebase URL, don't try to delete it as a file!
    const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/luxuryhub-3b0f6.appspot.com/o/Site%20Images%2Fprofile.png?alt=media&token=6f94d26d-315c-478b-9892-67fda99d2cd6";

    if (!user.avatar || user.avatar === defaultAvatar || user.avatar.startsWith("http")) {
      console.log("Skipping deletion of default/remote avatar.");
      return true;
    }

    const filePath = path.join("Faces", user.avatar);

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("File deletion error:", err);
          return false;
        }
      });
    }
    return true;
  },
  getUsers: async (req, res) => {
    try {
      const tmp = await User.find();
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  getUser: async (req, res) => {
    try {
      const tmp = await User.findById(req.params.id);
      return res.status(201).send(tmp);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },
  getUserByName: async (req, res) => {
    try {
      const tmp = await User.find({ username: req.params.id });
      return res.status(201).send(tmp);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },
  delete: async (req, res) => {
    try {
      const tmp = await User.findByIdAndDelete(req.params.id);
      const isPhotoDeleted = users.deleteUserProfile(tmp);
      if (isPhotoDeleted) {
        return res
          .status(201)
          .send("Election and photo file deleted successfully");
      } else {
        return res.status(500).send("Error deleting photo file");
      }
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },

  edit: async (req, res) => {
    const tmp = await User.findById(req.params.id);
    const isPhotoDeleted = users.deleteUserProfile(tmp);
    if (!isPhotoDeleted) {
      return res.status(500).send("Error updating User");
    }
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        const user = {
          username: req.body.username,
          email: req.body.email,
          mobile: req.body.mobile,
          fname: req.body.fname,
          lname: req.body.lname,
        };
        const tmp = await User.findByIdAndUpdate(req.params.id, user);
        return res.status(201).send("User Updated Successfully");
      } catch (e) {
        console.log(e);
        return res.status(500).send("error");
      }
    });
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const findUser = await User.findOne({ email });

      if (!findUser) {
        return res.status(202).send("Email not found in our records.");
      }

      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      findUser.password = tempPassword;
      await findUser.save();

      console.log(`[PASSWORD RESET] For ${email}. New Temp Password: ${tempPassword}`);

      return res.status(201).send(`A temporary password has been generated. Please check server console.`);
    } catch (e) {
      console.error(e);
      return res.status(500).send("Server Error");
    }
  },
  markVoted: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { hasVoted: true });
      return res.status(201).send("Voter participation recorded.");
    } catch (e) {
      console.error(e);
      return res.status(500).send("Error recording vote participation.");
    }
  },
};

//Candidate
export const candidateRegister = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    const candidate = await Candidate.create({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      qualification: req.body.qualification,
      join: req.body.join,
      location: req.body.location,
      description: req.body.description,
    });
    return res.status(201).send("Candidate Added");
  },
};

export const candidates = {
  getCandidates: async (req, res) => {
    const data = await Candidate.find();
    return res.status(201).send(data);
  },
  register: async (req, res) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        let profileImage = "";
        // We use the same 'profile' fieldname as the User registration
        if (req.files && req.files.profile) {
          profileImage = req.files.profile[0].filename;
        }

        const candidate = await Candidate.create({
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          dob: req.body.dob,
          qualification: req.body.qualification,
          join: req.body.join,
          location: req.body.location,
          description: req.body.description,
          profileImage: profileImage,
        });
        return res.status(201).send("Candidate Added");
      } catch (e) {
        console.error("Candidate Registration Error:", e);
        return res.status(500).send("Registration Failed");
      }
    });
  },
  getCandidate: async (req, res) => {
    const data = await Candidate.findOne({ username: req.params.username });
    if (data == null) {
      return res.status(500).send("Candidate Not Found");
    }
    return res.status(201).send(data);
  },
  delete: async (req, res) => {
    try {
      const data = await Candidate.findByIdAndDelete(req.params.id);
      return res.status(201).send("Candidate Deleted Successfully");
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
};

export const phase = {
  controller: async (req, res) => {
    const data = await Election.findByIdAndUpdate(req.params.id, {
      currentPhase: req.body.currentPhase,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    }, { new: true });
    return res.status(201).send(data);
  },
};

//Election

export const elections = {
  controller: async (req, res) => {
    try {
      const tmp = await Election.find();
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  register: async (req, res) => {
    try {
      const newElection = await Election.create({
        name: req.body.name,
        candidates: req.body.candidates,
        startHour: req.body.startHour || 9,
        endHour: req.body.endHour || 17,
      });
      return res.status(201).send("Election Successfully Added");
    } catch (e) {
      return res.status(500).send("Internal Error" + e);
    }
  },
  getElection: async (req, res) => {
    try {
      const data = await Election.findById(req.params.id);
      return res.status(201).send(data);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  voting: async (req, res) => {
    try {
      const tmp = await Election.find({ currentPhase: "voting" });
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  result: async (req, res) => {
    try {
      const tmp = await Election.find({ currentPhase: "result" });
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  delete: async (req, res) => {
    try {
      const tmp = await Election.findByIdAndDelete(req.params.id);
      return res.status(201).send("Election Deleted Successfully");
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
};

const sendMail = async (mailContent, mailSubject, user) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: mailSubject,
    text: mailContent,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Mail Error:", error);
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(info);
      }
    });
  });

};

export const a = {
  sc: async (req, res) => {
    const { username, image } = req.body; // image is now base64 string from frontend
    
    if (!image) {
      return res.status(400).send("No image captured");
    }

    // 1. Create a unique temporary filename for this login attempt
    const tempFilename = `temp-${username}-${Date.now()}.jpg`;
    const tempPath = path.resolve(process.cwd(), "Faces", tempFilename);

    try {
      // 2. Decode the base64 image and save it to disk
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(tempPath, base64Data, 'base64');

      const scriptPath = path.resolve(process.cwd(), "Controller", "fr.py");

      // 3. Run Python script with TWO arguments: username AND the temp image path
      PythonShell.run(scriptPath, { args: [username, tempPath] }, function (err, result) {
        // ALWAYS delete the temp file after the script runs
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        if (err) {
          console.error("Biometric Engine Error:", err);
          return res.status(500).send("Biometric Engine Error");
        }

        console.log("Python Result:", result);

        // 4. Success if Python prints "Match"
        if (result && result.includes("Match")) {
          return res.status(201).send("Biometric Verified");
        } else {
          return res.status(202).send("Face Identity Mismatch");
        }
      });
    } catch (e) {
      console.error("Save Temp Image Error:", e);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).send("Verification Process Error");
    }
  },
};

//Voting Mail

export const votingMail = {
  send: async (req, res) => {
    const mailContent =
      "Thank You For The Voting but if it's not you contact admin@votingsystem.com";

    const mailSubject = "Voting Success";

    const findUser = await User.findOne({ _id: req.body.id });

    try {
      await sendMail(mailContent, mailSubject, findUser);
      return res.status(201).send("Email Sent");
    } catch (mailError) {
      console.error("Voting email failed:", mailError);
      return res.status(201).send("Email Failed (Vote cast successfully)");
    }
  },
};

// --- OTP TRIAL LOGIC (REMOVED) ---

const sendSMS = async (content, mobile) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    throw new Error("Twilio credentials missing in .env");
  }

  const client = twilio(accountSid, authToken);

  // 🏆 PREPENDING +91 for Indian phone numbers if it's missing (a common Twilio mistake)
  const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

  return client.messages.create({
    body: content,
    from: twilioNumber,
    to: formattedMobile,
  });
};
