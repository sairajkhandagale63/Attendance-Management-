import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function FaceCheck({ user, onSuccess }) {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return alert("Camera not ready");

    const res = await fetch("http://localhost:5000/api/face/verify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ mobile: user.mobile, image: imageSrc })
    });

    const data = await res.json();
    setLoading(false);

    if (data.message) {
      alert("Face verified successfully");
      onSuccess();
    } else {
      alert(data.error || "Face verification failed");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={250} />
      <div style={{ marginTop: "10px" }}>
        <button onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify Face"}
        </button>
      </div>
    </div>
  );
}

export default FaceCheck;
