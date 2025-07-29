import React, { useEffect, useState, useRef } from "react";
import { FaRegFileImage } from "react-icons/fa6";
import { MdDeleteOutline } from "react-icons/md";

const ImageSelector = ({ image, setImage, handleDeleteImg }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    handleDeleteImg();
  };

  useEffect(() => {
    // Cleanup previous preview URL
    if (previewUrl && typeof previewUrl === "string") {
      URL.revokeObjectURL(previewUrl);
    }

    if (typeof image === "string") {
      setPreviewUrl(image);
    } else if (image) {
      setPreviewUrl(URL.createObjectURL(image));
    } else {
      setPreviewUrl(null);
    }

    // Cleanup when component unmounts or image changes
    return () => {
      if (previewUrl && typeof previewUrl === "string") {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [image]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />
      {!image ? (
        <button
          className="w-full h-[200px] flex flex-col items-center justify-center gap-4 bg-slate-50 rounded border border-slate-200/50"
          onClick={onChooseFile}
        >
          <div className="w-14 h-14 flex items-center justify-center bg-cyan-100 p-3 rounded-full border border-slate-200/50">
            <FaRegFileImage className="text-xl text-cyan-500" size={35} />
          </div>
          <p>Browse image files to upload</p>
        </button>
      ) : (
        <div className="w-full relative">
          <img
            src={previewUrl}
            alt="Selected"
            className="w-full h-[300px] object-cover rounded-lg"
          />
          <button
            className="btn-small btn-delete absolute top-2 right-2"
            onClick={handleRemoveImage}
            type="button"
            aria-label="Remove Selected Image"
          >
            <MdDeleteOutline className="text-lg" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
