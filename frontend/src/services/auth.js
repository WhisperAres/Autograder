import axios from "axios";

export const login = async (email) => {
    const res = await axios.post("http://localhost:5000/auth/login", { email });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);
    return res.data;
};
