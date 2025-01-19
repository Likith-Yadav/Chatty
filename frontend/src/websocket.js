const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "wss://your-backend-url.workers.dev";

const socket = io(BACKEND_URL, {
  // Enable automatic reconnect with Cloudflare-optimized settings
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  
  // Cloudflare-specific settings
  transports: ['websocket'],
  upgrade: false,
  path: '/socket.io/',
  
  // Additional options for reliability
  timeout: 20000,
  withCredentials: true,
  
  // Error handling
  autoConnect: true,
  forceNew: true
});

// Listen for incoming messages
socket.on("message", (data) => {
    console.log("New message received:", data);
    // Update the UI to display the new message
});

// Emit a message when sending
function sendMessage(message) {
    if (socket.connected) {
      socket.emit("message", message);
    } else {
      console.log("Socket is not connected. Cannot send message.");
    }
}

// Listen for user connection and disconnection events
socket.on("userConnected", (userId) => {
    console.log(`User ${userId} has connected`);
    // Update UI to reflect the online status
});

socket.on("userDisconnected", (userId) => {
    console.log(`User ${userId} has disconnected`);
    // Update UI to reflect the offline status
});

// Listen for socket connection and disconnection events
socket.on("connect", () => {
  console.log("Socket connected");
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("reconnect", () => {
  console.log("Socket reconnected");
});

socket.on("reconnect_attempt", () => {
  console.log("Socket reconnect attempt");
});

socket.on("reconnect_error", (error) => {
  console.log("Socket reconnect error:", error);
});

socket.on("reconnect_failed", () => {
  console.log("Socket reconnect failed");
});

// Enhanced error handling
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  // Implement your error handling logic here
});

socket.on("connect_timeout", () => {
  console.error("Connection timeout");
  // Implement your timeout handling logic here
});
