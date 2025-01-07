import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  MessageSquare, 
  Shield, 
  Users, 
  Smartphone, 
  Globe 
} from 'lucide-react';
import { 
  FaGithub, 
  FaLinkedin, 
  FaHeart, 
  FaGlobe 
} from 'react-icons/fa';

const LandingPage = () => {
  const { authUser } = useAuthStore();

  const features = [
    {
      icon: MessageSquare,
      title: 'Real-Time Messaging',
      description: 'Instant communication with WebSocket technology'
    },
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Military-grade security for your conversations'
    },
    {
      icon: Users,
      title: 'Group Chats',
      description: 'Create and manage dynamic group conversations'
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform',
      description: 'Seamless experience across all devices'
    }
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-grow">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-10 items-center min-h-[calc(100vh-250px)] px-4 md:px-8 lg:px-16">
          <div className="animate-subtle-bounce order-2 md:order-1 space-y-4">
            <h1 className="text-4xl font-bold mb-4 text-primary">
              Welcome to Chatty
            </h1>
            <p className="text-xl text-base-content/70 mb-6 max-w-lg">
              Experience the future of communication with our cutting-edge chat platform.
              Secure, fast, and intuitive messaging for the modern world.
            </p>
            
            <div className="flex space-x-4">
              <Link 
                to={authUser ? "/home" : "/login"}
                className="btn btn-primary shadow-vibrant-primary transition-elegant hover:scale-105 hover:shadow-xl"
              >
                {authUser ? 'Enter Chat' : 'Get Started'}
              </Link>
              <a 
                href="#features" 
                className="btn btn-outline transition-elegant hover:scale-105"
              >
                Learn More
              </a>
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-center animate-gentle-pulse order-1 md:order-2">
            <div className="mockup-phone border-primary shadow-elegant-lg">
              <div className="camera"></div> 
              <div className="display">
                <div className="artboard artboard-demo phone-1 bg-base-200">
                  <div className="chat chat-start">
                    <div className="chat-bubble">Hey there!</div>
                  </div>
                  <div className="chat chat-end">
                    <div className="chat-bubble chat-bubble-primary">Hi! How are you?</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-primary">
            Why Choose Chatty?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card bg-base-200 shadow-lg transition-elegant hover:scale-105 hover:shadow-vibrant-primary"
              >
                <div className="card-body items-center text-center">
                  <feature.icon className="w-12 h-12 text-primary mb-4 animate-subtle-bounce" />
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 bg-base-200 rounded-box">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-primary mb-4">
                What Our Early Users Say
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto">
                Real experiences from people who've transformed their communication
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-base-100 shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <div className="avatar mr-4">
                    <div className="w-12 rounded-full ring ring-primary ring-offset-base-100">
                      <img src="https://i.pravatar.cc/150?img=4" alt="User Avatar" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base-content">Sarah Johnson</h3>
                    <p className="text-sm text-base-content/70">Startup Founder</p>
                  </div>
                </div>
                <p className="italic text-base-content/80">
                  "Chatty has revolutionized how our team communicates. It's intuitive, secure, and just works!"
                </p>
              </div>
              
              <div className="card bg-base-100 shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <div className="avatar mr-4">
                    <div className="w-12 rounded-full ring ring-primary ring-offset-base-100">
                      <img src="https://i.pravatar.cc/150?img=5" alt="User Avatar" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base-content">Mike Rodriguez</h3>
                    <p className="text-sm text-base-content/70">Remote Worker</p>
                  </div>
                </div>
                <p className="italic text-base-content/80">
                  "As someone who works remotely, Chatty has been a game-changer for staying connected."
                </p>
              </div>
              
              <div className="card bg-base-100 shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <div className="avatar mr-4">
                    <div className="w-12 rounded-full ring ring-primary ring-offset-base-100">
                      <img src="https://i.pravatar.cc/150?img=6" alt="User Avatar" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base-content">Emma Lee</h3>
                    <p className="text-sm text-base-content/70">Student</p>
                  </div>
                </div>
                <p className="italic text-base-content/80">
                  "Never thought messaging could be this smooth and fun. Chatty is awesome!"
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Link 
                to={authUser ? "/home" : "/login"}
                className="btn btn-primary btn-wide shadow-vibrant-primary transition-elegant hover:scale-105"
              >
                {authUser ? 'Continue Chatting' : 'Join the Conversation'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="bg-base-200 py-8">
        <div className="container mx-auto flex flex-col items-center justify-center">
          <div className="flex space-x-6 mb-4 text-3xl">
            <a 
              href="https://github.com/Likith-Yadav" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <FaGithub />
            </a>
            <a 
              href="https://linkedin.com/in/likithyadavgn" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <FaLinkedin />
            </a>
            <a 
              href="https://portfolio-likith-yadavs-projects.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <FaGlobe />
            </a>
          </div>
          
          <div className="text-center text-base-content/70">
            <p className="flex items-center justify-center">
              Made with <FaHeart className="text-red-500 mx-2" /> by Likith Yadav
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
