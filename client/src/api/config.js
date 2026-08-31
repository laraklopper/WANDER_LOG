// config.js
/* Single source for the API address, so a change of port or a deployment only
has to be made in one place instead of in every fetch call.
Set REACT_APP_API_URL in client/.env to point at a deployed backend */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Endpoints the app calls, kept together so they cannot drift from the server routes
export const ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  currentUser: `${API_BASE_URL}/users/me`,
  findUsers: `${API_BASE_URL}/users/findUsers`,
};

/* Reads the JSON body of a response without throwing when the body is empty or
is not JSON at all, which is what happens on a 429 from the rate limiter or when
the server is unreachable. Returns an empty object in that case */
export const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

/* Turns a failed response into a single message to show the user.
Falls back through the shapes the API can return: a plain message, an error
string, then the status text */
export const errorMessage = (response, data, fallback) =>
  data?.message || data?.error || response?.statusText || fallback;

// Builds the Authorization header for a request that needs a valid session
export const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});
