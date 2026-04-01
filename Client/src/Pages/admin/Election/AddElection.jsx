import React from "react";
import { Button, Grid, Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import InputField from "../../../Components/Form/InputField";
import InputTags from "../../../Components/Form/InputTags";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink } from "../../../Data/Variables";

const AddElection = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const startHour = parseInt(e.target.startHour.value) || 9;
    const endHour = parseInt(e.target.endHour.value) || 17;
    const data = { name, candidates, startHour, endHour };
    console.log(data);

    axios
      .post(serverLink + "election/register", data)
      .then((res) => {
        console.log(res.status);
        if (res.status === 201) {
          navigate("/admin/election");
        }
      });
  };

  return (
    <>
      <div className="admin__content">
        <ContentHeader />
        <div className="content">
          <form onSubmit={handleSubmit} method="POST">
            <Paper elevation={3}>
              <Box px={3} py={2}>
                <Typography variant="h6" align="center" margin="dense">
                  Elections
                </Typography>
                <Grid container pt={3} spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <InputField label="name" name="name" fullWidth={true} />
                  </Grid>
                  <Grid item xs={12} sm={6}></Grid>
                  <Grid item xs={12} sm={6}>
                    <InputTags
                      setCandidates={setCandidates}
                      candidates={candidates}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField label="Start Hour (0-23) e.g. 9 for 9 AM" name="startHour" fullWidth={true} type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField label="End Hour (0-23) e.g. 17 for 5 PM" name="endHour" fullWidth={true} type="number" />
                  </Grid>
                </Grid>
                <Box mt={3}>
                  <Button type="submit" variant="contained" color="primary">
                    Save
                  </Button>
                </Box>
              </Box>
            </Paper>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddElection;
