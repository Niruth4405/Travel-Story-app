import React, { useState } from "react";
import DateSelector from "../Input/DateSelector";
import ImageSelector from "../Input/ImageSelector";
import TagInput from "../Input/TagInput";
import moment from "moment";
import uploadImage from "../../utils/uploadImage";
import { IoMdClose, IoMdAdd } from "react-icons/io";
import { MdUpdate, MdDeleteOutline } from "react-icons/md";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";


const AddEditTravelStory = ({
  storyInfo,
  type,
  onClose,
  getAllTravelStories,
}) => {
  const [title, setTitle] = useState(storyInfo?.title || ""); // Optionally initialize with storyInfo?.title if editing
  const [storyImg, setStoryImg] = useState(storyInfo?.imageUrl || null);
  const [story, setStory] = useState(storyInfo?.story || "");
  const [visitedLocation, setVisitedLocation] = useState(
    story?.visitedLocation || []
  );
  const [visitedDate, setVisitedDate] = useState(
    storyInfo?.visitedDate || null
  );
  const [error, setError] = useState("");

  // Function to add a new story
  const addNewTravelStory = async () => {
    try {
      let imageUrl = "";
      if (storyImg) {
        const imgUploads = await uploadImage(storyImg);
        imageUrl = imgUploads.imageUrl || "";
      }

      const response = await axiosInstance.post("/add-travel-story", {
        title,
        story,
        imageUrl: imageUrl || "",
        visitedLocation,
        visitedDate: visitedDate
          ? moment(visitedDate).valueOf()
          : moment().valueOf(),
      });

      if (response.data && response.data.story) {
        toast.success("Story added successfully");
        getAllTravelStories(); // Refresh stories list
        onClose(); // Close modal or form
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        //Handle unexpected errors
        setError("An unexpected error occurred.Please try again.");
      }
    }
  };

  // Placeholder: update story function (implement as needed)
  const updateTravelStory = async () => {
    const storyId = storyInfo._id;
    try {
      let imageUrl = "";
      let postData = {
        title,
        story,
        imageUrl: storyInfo.imageUrl || "",
        visitedLocation,
        visitedDate: visitedDate
          ? moment(visitedDate).valueOf()
          : moment().valueOf(),
      };
      if (typeof storyImg === "object") {
        const imgUploadRes = await uploadImage(storyImg);
        imageUrl = imgUploadRes.imageUrl || "";

        postData = {
          ...postData,
          imageUrl: imageUrl,
        };
      }
      //   if (storyImg) {
      //     const imgUploads = await uploadImage(storyImg);
      //     imageUrl = imgUploads.imageUrl || "";
      //   }

      const response = await axiosInstance.post(
        "/edit-story/" + storyId,
        postData
      );

      if (response.data && response.data.story) {
        toast.success("Story updated successfully");
        getAllTravelStories(); // Refresh stories list
        onClose(); // Close modal or form
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        //Handle unexpected errors
        setError("An unexpected error occurred.Please try again.");
      }
    }
  };

  // Handle Add or Update button click
  const handleAddOrUpdateClick = () => {
    // Clear previous error before validation
    setError("");

    if (!title.trim()) {
      setError("Please enter the title");
      return; // Important to stop here
    }
    if (!story.trim()) {
      setError("Please enter story");
      return; // Important to stop here
    }

    if (type === "edit") {
      updateTravelStory();
    } else {
      addNewTravelStory();
    }
  };

  // Placeholder: handle image delete (implement as needed)
  const handleDeleteStoryImg = async () => {
    //Deleting the Image
    const deleteImgRes = await axiosInstance.delete("/delete-image", {
      params: {
        imageUrl: storyInfo.imageUrl,
      },
    });
    if (deleteImgRes.data) {
      const storyId = storyInfo._id;

      const postData = {
        title,
        story,
        visitedLocation,
        visitedDate: moment().valueOf(),
        imageUrl: "",
      };
      //updating story
      const response = await axiosInstance.put(
        "/edit-story/" + storyId,
        postData
      );
      setStoryImg(null);
      if (response.data && response.data.story) {
        toast.success("Story updated successfully");
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h5 className="text-xl font-semibold text-slate-700 select-none">
          {type === "add" ? "Add Story" : "Update Story"}
        </h5>

        <div className="flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg">
          {type === "add" ? (
            <button className="btn-small" onClick={handleAddOrUpdateClick}>
              <IoMdAdd className="text-lg" /> ADD STORY
            </button>
          ) : (
            <>
              <button className="btn-small" onClick={handleAddOrUpdateClick}>
                <MdUpdate className="text-lg" /> UPDATE STORY
              </button>
              <button className="btn-small btn-delete" onClick={onClose}>
                <MdDeleteOutline className="text-lg" /> DELETE
              </button>
            </>
          )}

          <button className="cursor-pointer" onClick={onClose}>
            <IoMdClose className="text-xl text-slate-400" />
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs pt-2 text-right">{error}</p>
        )}
      </div>

      <div>
        <div className="flex-1 flex flex-col gap-2 pt-4">
          <label className="input-label">TITLE</label>
          <input
            type="text"
            className="text-2xl text-slate-950 outline-none"
            placeholder="A day at the great wall"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />

          <div className="my-3">
            <DateSelector date={visitedDate} setDate={setVisitedDate} />
          </div>

          <ImageSelector
            image={storyImg}
            setImage={setStoryImg}
            handleDeleteImg={handleDeleteStoryImg}
          />

          <div className="flex flex-col gap-2 mt-4">
            <label className="input-label">STORY</label>
            <textarea
              className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
              placeholder="Your story"
              rows={10}
              value={story}
              onChange={({ target }) => setStory(target.value)}
            />
          </div>

          <div className="pt-3">
            <label className="input-label">VISITED LOCATIONS</label>
            <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditTravelStory;
