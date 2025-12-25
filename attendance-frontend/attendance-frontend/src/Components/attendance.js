import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import "../index.css";
import "../App.css";
import "./Attendance.css";

function Attendance() {
  // Views: 'KIOSK' | 'LOGIN' | 'DASHBOARD'
  const [view, setView] = useState("KIOSK");

  // Kiosk Input
  const [mobile, setMobile] = useState("");

  // Auth User State
  const [user, setUser] = useState(null); // { name, role, mobile }

  // Login Inputs
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Data
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const webcamRef = useRef(null);

  // ---------------- HELPER FUNCTIONS ----------------
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const isLate = (dateObj) => {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    // 10:15 AM = 10 hours, 15 minutes
    if (hours > 10) return true;
    if (hours === 10 && minutes > 15) return true;
    return false;
  };

  // Filter Logic
  const filteredRecords = records.filter(r => {
    const rDate = new Date(r.checkIn || r.check_in);

    // 1. Month/Year Filter
    if (
      rDate.getMonth() !== currentMonth.getMonth() ||
      rDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      return false;
    }

    // 2. Search Term Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const name = (r.name || r.user_name || "").toLowerCase();
      const mob = (r.mobile || r.user_mobile || "").toLowerCase();
      if (!name.includes(lowerSearch) && !mob.includes(lowerSearch)) {
        return false;
      }
    }

    return true;
  });

  // ---------------- LOGIN LOGIC ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: loginMobile, password: loginPassword })
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setView("DASHBOARD");
        setLoginMobile("");
        setLoginPassword("");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRecords([]);
    setView("KIOSK");
  };

  // ---------------- DATA FETCHING ----------------
  useEffect(() => {
    if (view === "DASHBOARD" && user) {
      if (user.role === "ADMIN") {
        fetch("http://localhost:8080/api/attendance/all")
          .then(res => res.json())
          .then(data => setRecords(Array.isArray(data) ? data : []))
          .catch(err => console.error(err));
      } else {
        // Employee User
        fetch(`http://localhost:8080/api/attendance/employee/${user.mobile}`)
          .then(res => res.json())
          .then(data => setRecords(Array.isArray(data) ? data : []))
          .catch(err => console.error(err));
      }
    }
  }, [view, user]);


  // ---------------- KIOSK ACTIONS ----------------
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert("Camera not ready");
      return null;
    }
    return imageSrc;
  };

  const handleCheckIn = async () => {
    if (!mobile) return alert("Enter mobile number");

    const image = captureImage();
    if (!image) return;

    try {
      const response = await fetch("http://localhost:8080/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, image })
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        setMobile(""); // Clear input on success
      }
    } catch (error) {
      console.error(error);
      alert("Check-in failed due to network error");
    }
  };

  const handleCheckOut = async () => {
    if (!mobile) return alert("Enter mobile number");

    try {
      const response = await fetch("http://localhost:8080/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        setMobile(""); // Clear input on success
      }
    } catch (error) {
      console.error(error);
      alert("Check-out failed due to network error");
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className={`container ${view === "DASHBOARD" ? "dashboard-container" : ""}`}>
      {/* HEADER BAR */}
      <div className="top-bar">
        <h2>
          {view === "KIOSK" ? "Welcome" :
            view === "LOGIN" ? "Login" :
              `Hello, ${user?.name} (${user?.role})`}
        </h2>

        <div>
          {view === "KIOSK" && (
            <button className="link-btn" onClick={() => setView("LOGIN")}>
              Login
            </button>
          )}
          {view === "LOGIN" && (
            <button className="link-btn" onClick={() => setView("KIOSK")}>
              Back
            </button>
          )}
          {view === "DASHBOARD" && (
            <button className="link-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* 1. KIOSK VIEW (PUBLIC) */}
      {view === "KIOSK" && (
        <div className="attendance-box">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={350}
            height={300}
            className="webcam-view"
          />

          <input
            placeholder="Enter your registered mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mobile-input"
          />

          <div className="button-group">
            <button onClick={handleCheckIn} className="check-btn in">
              Check-In
            </button>
            <button onClick={handleCheckOut} className="check-btn out">
              Check-Out
            </button>
          </div>
          <p className="instruction">
            Enter your mobile number and click Check-In/Check-Out.
          </p>
        </div>
      )}

      {/* 2. LOGIN VIEW */}
      {view === "LOGIN" && (
        <div className="login-container-inner">
          <form onSubmit={handleLogin} className="login-form">
            <input
              placeholder="Registered Mobile"
              value={loginMobile}
              onChange={(e) => setLoginMobile(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
        </div>
      )}

      {/* 3. DASHBOARD VIEW (PROTECTED) */}
      {view === "DASHBOARD" && (
        <div className="attendance-box admin-view">
          <h3>{user.role === "ADMIN" ? "All Records" : "Your History"}</h3>

          <div className="filter-controls">
            {/* Search Filter */}
            <input
              type="text"
              placeholder="Filter by Name or Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            {/* Month Navigation */}
            <div className="month-nav">
              <button className="nav-btn" onClick={handlePrevMonth}>&lt;</button>
              <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button className="nav-btn" onClick={handleNextMonth}>&gt;</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                {user.role === "ADMIN" && <th>Name</th>}
                {user.role === "ADMIN" && <th>Mobile</th>}
                <th>Check-In</th>
                <th>Check-Out</th>
                {user.role === "ADMIN" && <th>Image</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr><td colSpan="5" className="no-data">No records found for this month</td></tr>
              ) : (
                filteredRecords.map((r, i) => {
                  const checkInDate = new Date(r.checkIn || r.check_in);
                  const isLateCheck = isLate(checkInDate);
                  const rowClass = isLateCheck ? "row-late" : "row-on-time";

                  return (
                    <tr key={i} className={rowClass}>
                      {user.role === "ADMIN" && <td>{r.name || r.user_name}</td>}
                      {user.role === "ADMIN" && <td>{r.mobile || r.user_mobile}</td>}
                      <td>{checkInDate.toLocaleString()}</td>
                      <td>
                        {r.checkOut || r.check_out
                          ? new Date(r.checkOut || r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "-"}
                      </td>
                      {user.role === "ADMIN" && (
                        <td>
                          {r.image && (
                            <img
                              src={r.image}
                              alt="attn"
                              width="40"
                              height="40"
                              style={{ borderRadius: '50%' }}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Attendance;
