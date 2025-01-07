import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Save } from "lucide-react";
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast installed

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      setIsImageChanged(true);
    };
  };

  const handleSaveProfile = async () => {
    try {
      if (isImageChanged) {
        console.log('Attempting to save profile picture:', selectedImg.substring(0, 100)); // Log first 100 chars
        await updateProfile({ profilePic: selectedImg });
        setIsImageChanged(false);
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Detailed Profile Save Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(error.response.data.message || 'Failed to update profile picture');
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error('Error preparing profile picture upload');
      }
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="text-base-100 size-5" />
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            {isImageChanged && (
              <button 
                onClick={handleSaveProfile}
                disabled={isUpdatingProfile}
                className={`
                  flex items-center gap-2 
                  btn btn-primary 
                  ${isUpdatingProfile ? "btn-disabled" : ""}
                `}
              >
                <Save className="size-5" />
                Save Changes
              </button>
            )}

            <div className="w-full space-y-4">
              <div className="flex items-center gap-4 bg-base-200 p-3 rounded-lg">
                <User className="size-6 text-base-content" />
                <div className="flex-1">
                  <p className="font-semibold">Full Name</p>
                  <p>{authUser.fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-base-200 p-3 rounded-lg">
                <Mail className="size-6 text-base-content" />
                <div className="flex-1">
                  <p className="font-semibold">Email</p>
                  <p>{authUser.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
