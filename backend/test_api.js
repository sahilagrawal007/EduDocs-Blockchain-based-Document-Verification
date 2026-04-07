async function test() {
    console.log("1. Logging in as Master Admin...");
    let res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@edudocs.portal', password: 'Password123!' })
    });
    let data = await res.json();
    
    if (data.error) {
        console.error("Login Failed:", data.error);
        return;
    }
    const token = data.token;
    console.log("Logged in! Token obtained.");

    console.log("2. Creating new issuer user...");
    res = await fetch('http://localhost:3000/api/auth/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            masterAdminToken: token,
            email: 'testing_issuer2@edudocs.test',
            password: 'SuperPassword123!',
            role: 'issuer'
        })
    });
    data = await res.json();
    if (data.error) {
         console.error("Create User Failed:", data.error);
    } else {
         console.log("Created User successfully. Check the backend server terminal for the Ethereal Email Link!");
    }
}

test();
