import * as React from "react";
import { TextField, Button, Typography, Box, Grid, Paper } from "@mui/material";
import DatePicker from "../../../Components/Form/DatePicker";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink } from "../../../Data/Variables";
import InputField from "../../../Components/Form/InputField";
import { ErrorMessage } from "../../../Components/Form/ErrorMessage";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function AddCandidate() {
  const today = new Date();
  const maxDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const navigate = useNavigate();
  const [join, setJoin] = useState(2000);
  const [profileFile, setProfileFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const firstName = e.target.fname.value;
    const lastName = e.target.lname.value;
    const dob = e.target.dob.value;
    const qualification = e.target.qualification.value;
    console.log(join);
    const location = e.target.location.value;
    const description = e.target.description.value;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("username", username);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("dob", dob);
    formData.append("qualification", qualification);
    formData.append("join", join);
    formData.append("location", location);
    formData.append("description", description);
    
    if (profileFile) {
      formData.append("profile", profileFile);
    }

    axios
      .post(serverLink + "candidate/register", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((res) => {
        console.log(res.status);
        if (res.status === 201) {
          navigate("/admin/candidate");
        }
      })
      .catch((err) => {
        console.error("Error adding candidate:", err);
        alert("Failed to add candidate. Please try again.");
      });
  };

  return (
    <div className="admin__content">
      <ContentHeader />
      <div className="content">
        <form onSubmit={handleSubmit} method="POST">
          <Paper elevation={3}>
            <Box px={3} py={2}>
              <Typography variant="h6" align="center" margin="dense">
                Add Candidate
              </Typography>
              <Grid container pt={3} spacing={3}>
                <Grid item xs={12} sm={12}>
                  <InputField
                    label="username"
                    name="username"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                {/* CANDIDATE PROFILE IMAGE UPLOAD */}
                <Grid item xs={12} sm={12} textAlign="center">
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Candidate Profile Photo
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="candidate-profile-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="candidate-profile-upload">
                    <Button variant="outlined" component="span" color="primary" style={{ marginBottom: "15px" }}>
                      Upload Photo
                    </Button>
                  </label>
                  {previewImage && (
                    <Box mt={2}>
                      <img 
                        src={previewImage} 
                        alt="Candidate Preview" 
                        style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "2px solid #ccc" }} 
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="First Name"
                    name="fname"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField label="Last Name" name="lname" fullWidth={true} />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker name="dob" title="Birth Date" max={maxDate} />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    label="Politices Join From (Year)"
                    fullWidth
                    readOnly
                    inputProps={{ min: 1900, max: 2099 }}
                    value={join}
                    onChange={(e) => {
                      setJoin(e.target.value);
                    }}
                    variant="outlined"
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="Qualification"
                    name="qualification"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="Location"
                    name="location"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    label="Description"
                    name="description"
                    multiline
                    rows={5}
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
              </Grid>
              <Box mt={3}>
                <Button type="submit" variant="contained" color="primary">
                  Add Candidate
                </Button>
              </Box>
            </Box>
          </Paper>
        </form>
      </div>
    </div>
  );
}
