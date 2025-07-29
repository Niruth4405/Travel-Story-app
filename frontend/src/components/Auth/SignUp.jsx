import React, { useState } from "react";
import { Link } from "react-router-dom";
import Beach from "../../assets/beach.jpg";
import PasswordInput from "../Input/PasswordInput";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  // Manage form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation with immediate return on failure
    if (!fullName) {
      setError("Please enter fullName");
      return; // Important: stop further execution!
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    // Clear any previous errors
    setError("");

    // Signup API call
    try {
      const response = await axiosInstance.post("/create-account", {
        fullName: fullName,
        email: email,
        password: password,
      });

      // If successful, store token and navigate
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (error) {
      // Corrected logical AND operator
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("invalid credentials");
      }
    }
  };

  return (
    <div className="h-screen bg-cyan-50 overflow-hidden relative">
      <div className="container h-screen flex items-center justify-center px-20 mx-auto gap-16">
        {/* Left side - image and text */}
        <div className="w-2/4 h-[90vh] flex flex-col justify-end rounded-lg p-0 z-50 overflow-hidden relative bg-white shadow">
          <img
            src={Beach} // Image path as provided
            className="w-full h-full object-cover"
            alt="Travel illustration"
          />
          <div className="p-10">
            <h4 className="text-4xl font-bold leading-relaxed text-gray-800">
              Capture Your <br />
              Journeys
            </h4>
            <p className="mt-6 text-base font-light max-w-xs text-gray-600">
              Record your travel experiences and memories in your personal
              travel journal.
            </p>
          </div>
        </div>

        {/* Right side - form */}
        <div className="w-2/4 bg-white rounded-lg p-10 shadow-lg z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h4 className="text-2xl font-semibold mb-4">SignUp</h4>

            <input
              type="text"
              placeholder="Full Name"
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-red-500 text-xs pb-1">{error}</p>}

            <button
              type="submit"
              className="cursor-pointer px-4 py-3 bg-cyan-600 text-white rounded-md font-semibold hover:bg-cyan-700 transition "
            >
              SIGNUP
            </button>

            <p className="text-center text-sm text-gray-500 mb-0">Or</p>

            <Link to="/login">
              <button
                type="button"
                className="cursor-pointer w-full px-4 py-3 border border-cyan-600 text-cyan-600 rounded-md font-semibold hover:bg-cyan-50 transition"
              >
                LOGIN
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
