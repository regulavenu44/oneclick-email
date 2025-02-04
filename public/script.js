document.addEventListener("DOMContentLoaded", () => {
    fetch("/get-email")
        .then(response => response.json())
        .then(data => {
            document.getElementById("email").innerText = data.email || "Error loading email";
        })
        .catch(error => console.error("Error fetching email:", error));
});

document.getElementById("fetchOtp").addEventListener("click", () => {
    fetch("/fetch-otp")
        .then(response => response.json())
        .then(data => {
            document.getElementById("otp").innerText = data.otp || "No OTP found";
        })
        .catch(error => {
            console.error("Error fetching OTP:", error);
            document.getElementById("otp").innerText = "Error fetching OTP";
        });
});
