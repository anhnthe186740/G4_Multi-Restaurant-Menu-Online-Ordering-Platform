import axios from "axios";
import fs from "fs";

async function test() {
  try {
    const resAuth = await axios.post("http://localhost:5000/api/auth/login", {
      email: "manager1@rms.vn",
      password: "Manager@123",
    });
    const token = resAuth.data.token;
    console.log("Login success.");

    const resInfo = await axios.get("http://localhost:5000/api/manager/branch-info", {
      headers: { Authorization: `Bearer ${token}` }
    });
    fs.writeFileSync('test.json', JSON.stringify(resInfo.data, null, 2), 'utf-8');
    console.log("Written to test.json");

  } catch (err) {
    if (err.response) {
      console.error("API Error Status:", err.response.status);
      console.error("API Error Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

test();
