import { useState } from "react";
import axios from "axios";

export default function Login({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");

  const handleLogin = async () => {
    const res = await axios.post("http://localhost:8081/login", { email, password, otp_code: otp });
    setToken(res.data.token || "Invalid credentials");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        
        <div className="space-y-4">
          <input 
            className="w-full p-3 border rounded"
            placeholder="Email" 
            value={email}
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="w-full p-3 border rounded"
            placeholder="Password" 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)} 
          />
          <input 
            className="w-full p-3 border rounded"
            placeholder="2FA Code" 
            value={otp}
            onChange={e => setOtp(e.target.value)} 
          />
        </div>
        
        <div className="mt-6 space-y-3">
          <button 
            className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleLogin}
          >
            Login
          </button>
          <button 
            className="w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={onBack}
          >
            Înapoi
          </button>
        </div>
        
        {token && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
            <p className="text-green-800">Token: {token}</p>
          </div>
        )}
      </div>
    </div>
  );
}
