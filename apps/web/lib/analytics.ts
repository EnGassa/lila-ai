
import posthog from 'posthog-js';

type EventName = 
  // Auth
  | 'login_attempt' | 'login_success' | 'login_error'
  | 'signup_attempt' | 'signup_success' | 'signup_error'
  // Onboarding
  | 'onboarding_start' | 'onboarding_step_view' | 'onboarding_step_complete' | 'onboarding_complete'
  // Intake
  | 'intake_start' | 'intake_attempt' | 'intake_step_complete' | 'intake_complete'
  // Camera & Face Capture
  | 'camera_permission_request' | 'camera_permission_granted' | 'camera_permission_denied'
  | 'camera_start_attempt' | 'camera_start_success' | 'camera_start_error'
  | 'model_load_start' | 'model_load_success' | 'model_load_error'
  | 'face_detected'
  | 'scan_start' | 'scan_step_complete' | 'scan_complete' | 'scan_reset' // First face detected in session
  | 'scan_complete'
  // Upload
  | 'upload_attempt' | 'upload_success' | 'upload_error'
  // Analysis
  | 'analysis_start' | 'analysis_poll' | 'analysis_complete' | 'analysis_failed'
  // Timing
  | 'capture_timing'
  // Dashboard
  | 'dashboard_view' | 'recommendation_click' | 'history_view' | 'routine_toggle';

interface AnalyticsProperties {
  [key: string]: any;
  flow?: 'first_time' | 'returning';
  step?: string;
  error?: string;
}

export const analytics = {
  track: (event: EventName, properties?: AnalyticsProperties) => {
    try {
      posthog.capture(event, properties);
      // Optional: Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${event}`, properties);
      }
    } catch (e) {
      console.warn('Analytics Error:', e);
    }
  },
  
  identify: (userId: string, properties?: AnalyticsProperties) => {
    posthog.identify(userId, properties);
  },

  reset: () => {
    posthog.reset();
  }
};
