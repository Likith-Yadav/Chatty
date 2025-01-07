import { useRef, useState, useEffect } from "react";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSocketContext } from "../context/SocketContext";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = ({ onSendMessage, roomId }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocketContext();
  const { authUser } = useAuthStore();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (value) => {
    setText(value);
    
    if (socket && roomId) {
      // Emit typing status
      socket.emit("typing", {
        roomId,
        user: {
          _id: authUser._id,
          username: authUser.username,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic
        },
        isTyping: value.length > 0
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to clear typing status
      if (value.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("typing", {
            roomId,
            user: {
              _id: authUser._id,
              username: authUser.username,
              fullName: authUser.fullName,
              profilePic: authUser.profilePic
            },
            isTyping: false
          });
        }, 2000);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Basic validation of base64 image
      const base64Image = reader.result;
      if (!base64Image.startsWith('data:image')) {
        toast.error("Invalid image format");
        return;
      }

      // Optional: Image compression
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scaleFactor = maxWidth / img.width;
        
        canvas.width = maxWidth;
        canvas.height = img.height * scaleFactor;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(compressedImage);
      };
      img.src = base64Image;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Validate onSendMessage prop
    if (typeof onSendMessage !== 'function') {
      console.error('Invalid onSendMessage prop:', {
        type: typeof onSendMessage,
        value: onSendMessage
      });
      toast.error('Message sending is not configured correctly');
      return;
    }

    try {
      // Disable send button during upload
      const sendButton = e.target.querySelector('button[type="submit"]');
      if (sendButton) sendButton.disabled = true;

      console.log('Attempting to send message with:', { 
        text: text.trim(), 
        image: imagePreview ? 'Image present' : null 
      });

      await onSendMessage(text.trim(), imagePreview);

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Clear typing status
      if (socket && roomId) {
        socket.emit("typing", {
          roomId,
          user: {
            _id: authUser._id,
            username: authUser.username,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic
          },
          isTyping: false
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      // Re-enable send button
      const sendButton = e.target.querySelector('button[type="submit"]');
      if (sendButton) sendButton.disabled = false;
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="px-4 py-3 bg-base-200">
      {imagePreview && (
        <div className="relative w-32 h-32 mb-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1 -right-1 bg-error text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 input input-bordered focus:outline-none bg-base-100"
        />
        
        <input
          type="file"
          onChange={handleImageChange}
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-circle btn-ghost"
        >
          <Image size={20} />
        </button>
        
        <button type="submit" className="btn btn-circle btn-primary">
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
