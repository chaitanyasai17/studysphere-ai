import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Queue to track requests that fail with 401 while refreshing the token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];
let serverTimeOffset = 0; // serverTime - clientTime (ms)

export const getServerTimeOffset = () => serverTimeOffset;

const updateClockOffset = (response: any) => {
  if (response?.headers?.date) {
    const serverTime = new Date(response.headers.date).getTime();
    if (!isNaN(serverTime)) {
      serverTimeOffset = serverTime - Date.now();
    }
  }
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Registry of pending AbortControllers to support navigation auto-cancellation
let pendingRequests: Array<AbortController> = [];

export const cancelAllPendingRequests = () => {
  pendingRequests.forEach((controller) => {
    try {
      controller.abort();
    } catch (e) {
      // ignore abort failures
    }
  });
  pendingRequests = [];
};

// Request Interceptor: Attach JWT Token and register AbortController
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Track AbortController for cancel-on-navigate
    if (!config.signal) {
      const controller = new AbortController();
      config.signal = controller.signal;
      pendingRequests.push(controller);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSafeMethod = (method?: string) => {
  if (!method) return false;
  const m = method.toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
};

const shouldRetry = (error: any) => {
  const config = error.config;
  if (!config) return false;
  
  // Only retry safe methods
  if (!isSafeMethod(config.method)) return false;
  
  // Do not retry auth routes or uploads
  if (
    config.url.includes("/api/auth/login") ||
    config.url.includes("/api/auth/register") ||
    config.url.includes("/api/auth/refresh") ||
    config.url.includes("/upload")
  ) {
    return false;
  }

  // Check if retry count limit reached
  config._retryCount = config._retryCount || 0;
  if (config._retryCount >= 3) return false;

  // Retry on network errors (no response status) or 5xx server status codes
  if (!error.response || (error.response.status >= 500 && error.response.status <= 504)) {
    return true;
  }
  
  return false;
};

// Response Interceptor: Handle Token Expiration and cleanup pending controllers
api.interceptors.response.use(
  (response) => {
    updateClockOffset(response);
    
    // Remove the AbortController from pending registry
    if (response.config?.signal) {
      pendingRequests = pendingRequests.filter(
        (controller) => controller.signal !== response.config.signal
      );
    }
    
    return response;
  },
  async (error) => {
    updateClockOffset(error.response);
    const originalRequest = error.config;
    
    // Remove the AbortController from pending registry on failure
    if (originalRequest?.signal) {
      pendingRequests = pendingRequests.filter(
        (controller) => controller.signal !== originalRequest.signal
      );
    }
    
    // Check if error is 401, not a retry, and we have a refresh token
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes("/api/auth/login") &&
      !originalRequest.url.includes("/api/auth/register") &&
      !originalRequest.url.includes("/api/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: new_refresh_token, user } = response.data;
          
          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", new_refresh_token);
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            window.dispatchEvent(new Event("storage_sync_user"));
          }
          
          // Broadcast token refresh to all other tabs
          try {
            const channel = new BroadcastChannel("studysphere_auth_channel");
            channel.postMessage({
              type: "TOKEN_REFRESH",
              accessToken: access_token,
              refreshToken: new_refresh_token,
              user: user
            });
            channel.close();
          } catch (e) {
            // BroadcastChannel fallback triggers storage event
            localStorage.setItem("authSyncTimestamp", Date.now().toString());
          }
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          isRefreshing = false;
          
          return api(originalRequest);
        } catch (refreshError: any) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Only log out if the backend explicitly rejects the refresh token (400, 401, 403)
          const isInvalidToken = refreshError.response && (
            refreshError.response.status === 400 ||
            refreshError.response.status === 401 ||
            refreshError.response.status === 403
          );
          
          if (isInvalidToken) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            
            // Broadcast logout to all other tabs
            try {
              const channel = new BroadcastChannel("studysphere_auth_channel");
              channel.postMessage({ type: "LOGOUT" });
              channel.close();
            } catch (e) {
              localStorage.setItem("authLogoutTimestamp", Date.now().toString());
            }

            if (!window.location.pathname.includes("/login")) {
              window.location.href = "/login?session_expired=true";
            }
          }
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Check if the safe request should be retried automatically
    if (shouldRetry(error)) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      originalRequest._retryCount += 1;
      
      const backoffDelay = 250 * Math.pow(2, originalRequest._retryCount); // 500ms, 1000ms, 2000ms
      await delay(backoffDelay);
      
      const token = localStorage.getItem("accessToken");
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export default api;
