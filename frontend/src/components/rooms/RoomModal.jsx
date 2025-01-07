import { useState } from 'react';
import { Users, Lock, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const RoomModal = ({ isOpen, onClose, mode = 'create' }) => {
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    code: '',
    isPrivate: false,
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setRoomData(prev => ({ ...prev, avatar: reader.result }));
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === 'create' ? '/rooms/create' : '/rooms/join';
      const data = mode === 'create' ? roomData : { code: roomData.code };
      
      console.log('Submitting room request:', {
        mode,
        endpoint,
        data
      });

      const response = await api.post(endpoint, data);
      console.log('Room operation successful:', response);

      toast.success(mode === 'create' ? 'Room created successfully!' : 'Joined room successfully!');
      onClose();
      
      // Use a more reliable method to refresh rooms
      const event = new Event('roomsUpdated');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Room submission error:', error);
      toast.error(error.message || 'Failed to process room request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {mode === 'create' ? 'Create New Room' : 'Join Room'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomData.name}
                  onChange={(e) => setRoomData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={roomData.description}
                  onChange={(e) => setRoomData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Avatar
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 cursor-pointer hover:bg-gray-600">
                    <Image className="text-gray-400" size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {roomData.avatar && (
                    <img 
                      src={roomData.avatar} 
                      alt="Room Avatar" 
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox"
                  checked={roomData.isPrivate}
                  onChange={(e) => setRoomData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm text-gray-300 flex items-center">
                  <Lock className="mr-1" size={16} />
                  Private Room
                </label>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Room Code
              </label>
              <input
                type="text"
                value={roomData.code}
                onChange={(e) => setRoomData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Enter room code"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white ${
                isLoading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isLoading ? 'Processing...' : (mode === 'create' ? 'Create Room' : 'Join Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
