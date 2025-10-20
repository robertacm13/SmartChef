import { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

export default function Register({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState("");

  const handleRegister = async () => {
    const res = await axios.post("http://localhost:8081/register", { email, password });
    if (res.data.otp_uri) setQr(res.data.otp_uri);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        
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
        </div>
        
        <div className="mt-6 space-y-3">
          <button 
            className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={handleRegister}
          >
            Register
          </button>
          <button 
            className="w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={onBack}
          >
            Înapoi
          </button>
        </div>

        {qr && (
          <div className="mt-6 text-center">
            <p className="mb-4 text-gray-700">Scan with Google Authenticator:</p>
            <div className="flex justify-center">
              <QRCodeSVG value={qr} size={200} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
