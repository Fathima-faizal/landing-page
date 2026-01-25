
//login//
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    if(email && password) {
        alert(`Attempting to sign in with: ${email}`);
        // Here you would typically send data to your server
    } else {
        alert("Please fill in all fields.");
    }
});
