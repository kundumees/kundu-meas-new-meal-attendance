import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const loginBtn = document.getElementById("login");

loginBtn.addEventListener("click", async () => {

const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

if(email==="" || password===""){

alert("Please enter email and password.");

return;

}

try{

const userCredential = await signInWithEmailAndPassword(

auth,
email,
password

);

const uid = userCredential.user.uid;

const adminDoc = await getDoc(doc(db,"admins",uid));

if(!adminDoc.exists()){

alert("This account is not an Admin.");

await auth.signOut();

return;

}

alert("✅ Admin Login Successful");

window.location.href = "admin.html";

}

catch(error){

console.error(error);

alert("Login Failed\n\n"+error.message);

}

});