# Login Page Documentation

## Overview
The Login page (`/login`) provides the primary user authentication interface for the Netzwächter monitoring system. It handles user credential validation and session establishment for standard user accounts.

## Page Content & Layout

### 1. Page Header Section
- **Logo**: Animated Brain icon with pulsing animation
- **Title**: "KI-geführter Netzwächter" (AI-guided Network Guardian)
- **Subtitle**: "Intelligente Überwachung und Optimierung Ihrer Heizungsanlagen"
- **Background**: Gradient background (blue tones) with full-screen centering

### 2. Login Form Card
- **Card Style**: Semi-transparent white background with backdrop blur
- **Max Width**: 400px, centered horizontally
- **Title**: "Benutzer-Anmeldung" (User Login)

#### Form Fields
**Username/Email Field**
- **Label**: "Benutzername oder E-Mail" (Username or Email)
- **Type**: Text input
- **Placeholder**: "Ihr Benutzername oder E-Mail-Adresse"
- **Validation**: Required field
- **State**: `loginForm.username`

**Password Field**
- **Label**: "Passwort" (Password)
- **Type**: Password (toggleable visibility)
- **Placeholder**: "Ihr Passwort"
- **Features**:
  - Password visibility toggle (Eye/EyeOff icons)
  - Secure input type by default
- **State**: `loginForm.password`

#### Submit Button
- **Text**: "Anmelden" / "Anmelden..." (Login/Login...)
- **Full Width**: Spans entire form width
- **Loading State**: Disabled during authentication with loading text
- **Type**: Submit button

### 3. Footer Section
- **Copyright**: "© 2025 HeizungsManager - Heizungsanlagen-Management-System"
- **Styling**: Small gray text, centered

## Functions & Logic

### Core Functions

#### `handleUserLogin(e)`
- **Purpose**: Handles form submission and user authentication
- **Parameters**: `e` (React.FormEvent)
- **Validation**:
  - Prevents default form submission
  - Checks for empty username/password fields
  - Shows error toast if validation fails

- **Authentication Process**:
  1. Sets loading state to true
  2. Makes POST request to `/api/user-login`
  3. Handles response based on status

- **Success Handling**:
  - Parses JSON response
  - Shows success toast: "Erfolgreich angemeldet" / "Willkommen zurück!"
  - Extracts start page from user profile: `result.user?.userProfile?.startPage || "/"`
  - Redirects using `window.location.href`

- **Error Handling**:
  - **4xx Responses**: Shows login error message from API
  - **Network Errors**: Shows connection error message
  - **Toast Notifications**: Uses destructured toast function

- **Cleanup**: Sets loading state to false in finally block

## Variables & State

### React State
```typescript
const [showPassword, setShowPassword] = useState(false);
const [loginForm, setLoginForm] = useState({
  username: "",
  password: ""
});
const [isLoading, setIsLoading] = useState(false);
```

### External Hooks
```typescript
const { toast } = useToast(); // Toast notifications
```

### Form State Management
- **Controlled Components**: All inputs use controlled state
- **State Updates**: Uses spread operator for immutable updates
- **Validation**: Client-side required attribute + manual validation

## API Endpoints Used

### POST `/api/user-login`
- **Purpose**: Authenticates user credentials and establishes session
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "user": {
      "id": "number",
      "username": "string",
      "email": "string",
      "userProfile": {
        "startPage": "string" // Optional custom start page
      }
    }
  }
  ```
- **Error Response** (401/400):
  ```json
  {
    "message": "string" // Error description
  }
  ```

## Database Calls

### Authentication Query
- **Table**: `users`
- **Fields**: `username`, `email`, `password_hash`, `user_profile`
- **Validation**: Password verification using bcrypt/hash comparison
- **Session Creation**: Creates session record in `sessions` table
- **User Permissions**: Loads user role and object permissions

### User Profile Query
- **Purpose**: Retrieves user's start page preference
- **Table**: `user_profiles` or embedded in users table
- **Field**: `start_page` (optional)
- **Fallback**: Defaults to "/" if not set

## Required Files & Components

### Core Files
- `client/src/pages/Login.tsx` - Main login page component
- `client/src/hooks/use-toast.ts` - Toast notification hook

### UI Components
- `client/src/components/ui/card.tsx` - Card container
- `client/src/components/ui/button.tsx` - Form button
- `client/src/components/ui/input.tsx` - Form inputs
- `client/src/components/ui/label.tsx` - Form labels

### External Dependencies
- **Lucide Icons**: `Lock`, `Building2`, `Eye`, `EyeOff`, `Brain`
- **React**: `useState` for state management
- **Fetch API**: Browser-native HTTP requests

## Navigation & Routing

### Incoming Routes
- `/login` - Main login route
- `/anmelden` - Alternative German login route (handled by LoginStrawa.tsx)

### Outgoing Navigation
- **Success Redirect**: User-defined start page or "/" (homepage)
- **Method**: `window.location.href` (full page reload for session establishment)

### Route Parameters
- **None**: Simple authentication route without parameters

## Security Considerations

### Authentication Security
- **Session-based**: Creates HTTP session on successful login
- **No Token Storage**: Does not store JWT tokens in localStorage/cookies
- **Server-side Sessions**: Session data managed server-side

### Input Validation
- **Client-side**: HTML5 required attributes
- **Server-side**: Username/password validation in API
- **No XSS**: React's automatic escaping prevents XSS attacks

### Password Handling
- **No Plaintext**: Password never stored or logged in plaintext
- **Secure Transmission**: HTTPS required for production
- **Visibility Toggle**: User-controlled password visibility

## Error Handling

### Validation Errors
- **Empty Fields**: "Bitte geben Sie Benutzername und Passwort ein"
- **Toast Display**: Red variant for destructive/error messages

### Authentication Errors
- **Invalid Credentials**: "Ungültiger Benutzername oder Passwort"
- **API Error Messages**: Displays server-provided error messages
- **Toast Display**: Error variant with descriptive messages

### Network Errors
- **Connection Issues**: "Verbindungsfehler" / "Bitte versuchen Sie es später erneut"
- **Catch Block**: Handles all network and parsing errors

## Loading States

### Form Submission
- **Button State**: Disabled during loading
- **Button Text**: Changes to "Anmelden..." during submission
- **Loading Indicator**: Text-based loading state
- **User Feedback**: Prevents multiple submissions

### Page Loading
- **Animation**: `animate-fade-in` class for smooth page appearance
- **No Skeleton**: Simple loading via button state only

## Browser Compatibility

### Supported Features
- **ES6 Modules**: Modern JavaScript module system
- **Async/Await**: Modern async function syntax
- **Fetch API**: Modern HTTP request API
- **CSS Grid/Flexbox**: Modern layout systems

### Progressive Enhancement
- **JavaScript Required**: Form submission requires JavaScript
- **Graceful Degradation**: Basic HTML form structure
- **Accessibility**: Proper labels and form structure

## Performance Considerations

### Bundle Size
- **Lightweight**: Minimal dependencies (React, UI components, icons)
- **Tree Shaking**: Only used icons imported from lucide-react

### Network Requests
- **Single Request**: One API call per login attempt
- **No Prefetching**: No unnecessary data loading
- **Error Boundaries**: Network failures handled gracefully

### State Management
- **Local State**: Simple useState for form and loading states
- **No Global State**: Authentication managed by useAuth hook (not on this page)

## Accessibility Features

### Form Accessibility
- **Proper Labels**: All inputs have associated labels
- **Required Fields**: Visual and semantic required indicators
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML structure

### Visual Feedback
- **Loading States**: Clear indication of form submission
- **Error Messages**: Descriptive error text via toasts
- **Success Feedback**: Confirmation messages for successful login

### Color Contrast
- **High Contrast**: White text on gradient background
- **Focus Indicators**: Button and input focus states
- **Error States**: Red variants for destructive actions
