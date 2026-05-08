const ERROR_MESSAGES = {
    // Authentication
    LOGIN_REQUIRED: "Please log in to continue.",
    INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
    
    // Authorization
    ACCESS_DENIED: "You don't have permission to view this page.",
    
    // Resources
    NOT_FOUND: "The requested item was not found.",
    UPLOAD_ERROR: "Failed to upload the image. Please try again.",
    
    // Server
    INTERNAL_SERVER_ERROR: "Something went wrong. Please try again later."
};

module.exports = ERROR_MESSAGES;