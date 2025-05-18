import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import backendConnection from "../api/BackendConnection";
import { showToast } from "../util/alertHelper";

function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    title: user?.title || ""
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Form errors
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    // Update profile form when user data changes
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        title: user.title || ""
      });
    }
    
    // Load active sessions when tab is selected
    if (activeTab === "sessions") {
      fetchActiveSessions();
    }
  }, [activeTab, user]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      const response = await backendConnection.getActiveSessions();
      setSessions(response || []);
    } catch (error) {
      showToast("error", "Failed to load active sessions: " + error.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      setLoading(true);
      await backendConnection.logoutAllSessions();
      showToast("success", "All other sessions have been logged out");
      await fetchActiveSessions();
    } catch (error) {
      showToast("error", "Failed to logout sessions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      setLoading(true);
      await backendConnection.logoutSession(sessionId);
      showToast("success", "Session has been logged out");
      await fetchActiveSessions();
    } catch (error) {
      showToast("error", "Failed to logout session: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileForm.firstName) {
      errors.firstName = "First name is required";
    }
    
    if (!profileForm.lastName) {
      errors.lastName = "Last name is required";
    }
    
    if (!profileForm.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = "Email address is invalid";
    }
    
    if (!profileForm.title) {
      errors.title = "Title is required";
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    
    // Current password is no longer validated since we're using a direct update approach
    
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords must match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    try {
      // Check if user exists and has ID
      if (!user || !user.id) {
        showToast("error", "User information is missing. Please log in again.");
        return;
      }

      const response = await backendConnection.updateProfile(user.id, profileForm);
      
      // Update user in context and localStorage
      const updatedUser = { ...user, ...response };
      setUser(updatedUser);
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      
      showToast("success", "Profile updated successfully");
    } catch (error) {
      showToast("error", "Failed to update profile: " + error.message);
    }
  };
  
  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      // Set loading state for better UX
      setLoading(true);
      
      // Note: Current password is no longer needed but we keep it for API compatibility
      await backendConnection.changePassword(
        "dummy-value-not-used", // Current password is not actually used
        passwordForm.newPassword
      );
      
      // Clear the form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Show success message
      showToast("success", "Password changed successfully");
    } catch (error) {
      showToast("error", "Failed to change password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Account Management</h1>
      
      <div className="flex border-b mb-6">
        <button
          className={`mr-4 py-2 px-4 ${activeTab === "profile" ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Information
        </button>
        <button
          className={`mr-4 py-2 px-4 ${activeTab === "password" ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "sessions" ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("sessions")}
        >
          Active Sessions
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  value={profileForm.title}
                  onChange={handleProfileChange}
                  className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
                {profileErrors.title && <div className="text-red-600 mt-1">{profileErrors.title}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.firstName && <div className="text-red-600 mt-1">{profileErrors.firstName}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.lastName && <div className="text-red-600 mt-1">{profileErrors.lastName}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.email && <div className="text-red-600 mt-1">{profileErrors.email}</div>}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "password" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {passwordErrors.newPassword && <div className="text-red-600 mt-1">{passwordErrors.newPassword}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {passwordErrors.confirmPassword && <div className="text-red-600 mt-1">{passwordErrors.confirmPassword}</div>}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <button
              onClick={handleLogoutAllSessions}
              disabled={loading || sessions.length === 0}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Logout All Other Sessions
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No other active sessions found. This is your only active session.
            </div>
          ) : (
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device/IP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Login Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.device || "Unknown"} ({session.createdByIp})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(session.created).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(session.expires).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleLogoutSession(session.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                        >
                          Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Note: Sessions are automatically expired after 7 days of inactivity.</p>
            <p>If you believe your account has been compromised, change your password immediately.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile; 