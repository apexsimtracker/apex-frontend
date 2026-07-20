import { lazy } from "react";

/* Admin */
export const AdminDashboard = lazy(() =>
  import(/* webpackChunkName: "admin-dashboard" */ "@/pages/admin/AdminDashboard"),
);
export const AdminUsers = lazy(() =>
  import(/* webpackChunkName: "admin-users" */ "@/pages/admin/AdminUsers"),
);
export const AdminSubscriptions = lazy(() =>
  import(
    /* webpackChunkName: "admin-subscriptions" */ "@/pages/admin/AdminSubscriptions"
  ),
);
export const AdminUserDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-user-detail" */ "@/pages/admin/AdminUserDetail"
  ),
);
export const AdminChallenges = lazy(() =>
  import(
    /* webpackChunkName: "admin-challenges" */ "@/pages/admin/AdminChallenges"
  ),
);
export const AdminTracks = lazy(() =>
  import(/* webpackChunkName: "admin-tracks" */ "@/pages/admin/AdminTracks"),
);
export const AdminChallengeDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-challenge-detail" */ "@/pages/admin/AdminChallengeDetail"
  ),
);
export const AdminContact = lazy(() =>
  import(/* webpackChunkName: "admin-contact" */ "@/pages/admin/AdminContact"),
);
export const AdminContactDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-contact-detail" */ "@/pages/admin/AdminContactDetail"
  ),
);
export const AdminCommunity = lazy(() =>
  import(
    /* webpackChunkName: "admin-community" */ "@/pages/admin/AdminCommunity"
  ),
);
export const AdminCommunityDiscussionDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-community-discussion" */ "@/pages/admin/AdminCommunityDiscussionDetail"
  ),
);
export const AdminLeaderboards = lazy(() =>
  import(
    /* webpackChunkName: "admin-leaderboards" */ "@/pages/admin/AdminLeaderboards"
  ),
);
export const AdminSessions = lazy(() =>
  import(/* webpackChunkName: "admin-sessions" */ "@/pages/admin/AdminSessions"),
);
export const AdminSessionDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-session-detail" */ "@/pages/admin/AdminSessionDetail"
  ),
);
export const AdminDevices = lazy(() =>
  import(/* webpackChunkName: "admin-devices" */ "@/pages/admin/AdminDevices"),
);
export const AdminEmailAuth = lazy(() =>
  import(
    /* webpackChunkName: "admin-email-auth" */ "@/pages/admin/AdminEmailAuth"
  ),
);
export const AdminFollows = lazy(() =>
  import(/* webpackChunkName: "admin-follows" */ "@/pages/admin/AdminFollows"),
);
export const AdminFollowUserDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-follow-user" */ "@/pages/admin/AdminFollowUserDetail"
  ),
);
export const AdminNotifications = lazy(() =>
  import(
    /* webpackChunkName: "admin-notifications" */ "@/pages/admin/AdminNotifications"
  ),
);
export const AdminSystem = lazy(() =>
  import(/* webpackChunkName: "admin-system" */ "@/pages/admin/AdminSystem"),
);
export const AdminBroadcastDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-broadcast-detail" */ "@/pages/admin/AdminBroadcastDetail"
  ),
);
export const AdminCampaignDetail = lazy(() =>
  import(
    /* webpackChunkName: "admin-campaign-detail" */ "@/pages/admin/AdminCampaignDetail"
  ),
);

/* Legal / informational */
export const Pricing = lazy(() =>
  import(/* webpackChunkName: "pricing" */ "@/pages/Pricing"),
);
export const About = lazy(() =>
  import(/* webpackChunkName: "about" */ "@/pages/About"),
);
export const Contact = lazy(() =>
  import(/* webpackChunkName: "contact" */ "@/pages/Contact"),
);
export const FAQ = lazy(() =>
  import(/* webpackChunkName: "faq" */ "@/pages/FAQ"),
);
export const MaintenanceNotice = lazy(() =>
  import(
    /* webpackChunkName: "maintenance-notice" */ "@/pages/MaintenanceNotice"
  ),
);
export const TermsAndConditions = lazy(() =>
  import(
    /* webpackChunkName: "legal-terms" */ "@/pages/TermsAndConditions"
  ),
);
export const PrivacyPolicy = lazy(() =>
  import(/* webpackChunkName: "legal-privacy" */ "@/pages/PrivacyPolicy"),
);
export const CookiePolicy = lazy(() =>
  import(/* webpackChunkName: "legal-cookie" */ "@/pages/CookiePolicy"),
);
export const EULA = lazy(() =>
  import(/* webpackChunkName: "legal-eula" */ "@/pages/EULA"),
);

/* Heavy analysis */
export const SessionDetail = lazy(() =>
  import(/* webpackChunkName: "session-detail" */ "@/pages/SessionDetail"),
);

/* Secondary product islands */
export const Agent = lazy(() =>
  import(/* webpackChunkName: "agent" */ "@/pages/Agent"),
);
export const Leaderboards = lazy(() =>
  import(/* webpackChunkName: "leaderboards" */ "@/pages/Leaderboards"),
);
export const Challenges = lazy(() =>
  import(/* webpackChunkName: "challenges" */ "@/pages/Challenges"),
);
export const Community = lazy(() =>
  import(/* webpackChunkName: "community" */ "@/pages/Community"),
);
export const DiscussionDetail = lazy(() =>
  import(/* webpackChunkName: "discussion-detail" */ "@/pages/DiscussionDetail"),
);
export const ChallengeDetail = lazy(() =>
  import(/* webpackChunkName: "challenge-detail" */ "@/pages/ChallengeDetail"),
);
export const Settings = lazy(() =>
  import(/* webpackChunkName: "settings" */ "@/pages/Settings"),
);
export const Profile = lazy(() =>
  import(/* webpackChunkName: "profile" */ "@/pages/Profile"),
);
export const UserProfile = lazy(() =>
  import(/* webpackChunkName: "user-profile" */ "@/pages/UserProfile"),
);
export const Upload = lazy(() =>
  import(/* webpackChunkName: "upload" */ "@/pages/Upload"),
);
export const ManualActivity = lazy(() =>
  import(/* webpackChunkName: "manual-activity" */ "@/pages/ManualActivity"),
);
export const EditActivity = lazy(() =>
  import(/* webpackChunkName: "edit-activity" */ "@/pages/EditActivity"),
);
export const Sessions = lazy(() =>
  import(/* webpackChunkName: "sessions" */ "@/pages/Sessions"),
);
export const PersonalBests = lazy(() =>
  import(/* webpackChunkName: "personal-bests" */ "@/pages/PersonalBests"),
);

/* Auth pages */
export const Login = lazy(() =>
  import(/* webpackChunkName: "auth-login" */ "@/pages/Login"),
);
export const Signup = lazy(() =>
  import(/* webpackChunkName: "auth-signup" */ "@/pages/Signup"),
);
export const ForgotPassword = lazy(() =>
  import(/* webpackChunkName: "auth-forgot" */ "@/pages/ForgotPassword"),
);
export const VerifyEmail = lazy(() =>
  import(/* webpackChunkName: "auth-verify" */ "@/pages/VerifyEmail"),
);
