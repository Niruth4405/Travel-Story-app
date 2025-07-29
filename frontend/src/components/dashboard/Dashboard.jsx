import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import AddEditTravelStory from "./AddEditTravelStory";
import axiosInstance from "../../utils/axiosInstance";
import { IoMdAdd } from "react-icons/io";
import TravelStoryCard from "../Cards/TravelStoryCard";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-modal";
import ViewTravelStory from "./ViewTravelStory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const [openViewModal, setOpenViewModal] = useState({
    isShown: false,
    data: null,
  });


  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  // Fetch all travel stories
  const getAllTravelStories = async () => {
    try {
      const response = await axiosInstance.get("/get-all-stories");
      console.log("Fetched stories raw:", response.data);
      if (Array.isArray(response.data)) {
        setAllStories(response.data);
      } else if (response.data && Array.isArray(response.data.stories)) {
        setAllStories(response.data.stories);
      } else {
        setAllStories([]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      setAllStories([]);
    }
  };

  // Handlers for interaction (implement as needed)
  const handleEdit = (data) => {
    setOpenAddEditModal({ isShown: true, type: "edit", data: data });
  };

  const handleViewStory = (data) => {
    setOpenViewModal({ isShown: true, data });
  };

  const updateIsFavourite = async (storyData) => {
    const storyId = storyData._id;

    try {
      await axiosInstance.put("/update-is-favourite/" + storyId, {
        isFavourite: !storyData.isFavourite,
      });

      // Immediately update React state locally for instant UI response
      setAllStories((prevStories) =>
        prevStories.map((story) =>
          story._id === storyId
            ? { ...story, isFavourite: !story.isFavourite }
            : story
        )
      );
      toast.success("story updated successfully");
    } catch (error) {
      console.error("Failed to update favorite:", error);
      alert("Failed to update favorite status. Please try again.");
    }
  };

  //Delete Story
  const deleteTravelStory = async (data) => {
    const storyId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-story/" + storyId);
      if (response.data && !response.data.error) {
        toast.error("Story Deleted Successfully!");
        setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
        getAllTravelStories();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        // Handle unexpected errors
        setError("An unexpected error occurred. Please try again.");
        toast.error("Failed to delete Travel Story")
        
      }
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    getAllTravelStories();
    fetchUserInfo();
    return () => {};
  }, []);

  return (
    <>
      <Navbar userInfo={userInfo} />

      <div className="container mx-auto py-10">
        <div className="flex gap-7">
          <div className="flex-1">
            {allStories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 justify-center items-center">
                {allStories.map((item) => (
                  <TravelStoryCard
                    key={item._id}
                    imgUrl={item.imageUrl}
                    title={item.title}
                    date={item.visitedDate}
                    story={item.story}
                    visitedLocation={item.visitedLocation}
                    isFavourite={item.isFavourite}
                    onEdit={() => handleEdit(item)}
                    onClick={() => handleViewStory(item)}
                    onFavouriteClick={() => updateIsFavourite(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600">
                No Travel Stories Found
              </p>
            )}
          </div>

          <div className="w-[320px]">
            {/* You may add sidebar or additional components here */}
          </div>
        </div>
      </div>
      {/*Add & Edit travel modal */}
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <AddEditTravelStory
          type={openAddEditModal.type}
          storyInfo={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({ isShown: false, type: "add", data: null });
          }}
          getAllTravelStories={getAllTravelStories}
        />
      </Modal>

      {/*View Travel Story Model*/}
      <Modal
        isOpen={openViewModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <ViewTravelStory
          storyInfo={openViewModal.data || null}
          onClose={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
          }}
          onEditClick={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
            handleEdit(openViewModal.data || null);
          }}
          onDeleteClick={() => {
            deleteTravelStory(openViewModal.data || null);
          }}
        />
      </Modal>

      <button
        className="cursor-pointer w-16 h-16 flex items-center justify-center rounded-full bg-cyan-300 hover:bg-cyan-400 fixed right-10 bottom-10"
        onClick={() => {
          setOpenAddEditModal({ isShown: true, type: "add", data: null });
        }}
      >
        <IoMdAdd className="text-[32px] text-white" />
      </button>

      <ToastContainer />
    </>
  );
};

export default Dashboard;
