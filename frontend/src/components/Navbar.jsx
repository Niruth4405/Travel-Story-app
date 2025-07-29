import React from "react";
import ProfileInfo from "./Cards/ProfileInfo";
import { useNavigate } from "react-router-dom";

const Navbar = ({ userInfo }) => {
  const isToken = localStorage.getItem("token");
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="bg-white flex item-center justify-between px-6 py-4 drop-shadow sticky top-0 z-10 ">
      <h1 className="font-semibold text-cyan-700 text-xl italic">
        Travel Story
      </h1>
      {isToken && <ProfileInfo userInfo={userInfo} onLogout={onLogout} />}
    </div>
  );
};

export default Navbar;
