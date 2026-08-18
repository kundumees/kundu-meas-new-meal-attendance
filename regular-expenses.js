import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    orderBy,
    query,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// HTML ELEMENTS

const expenseMember = document.getElementById("expenseMember");
const expenseDate = document.getElementById("expenseDate");
const expenseAmount = document.getElementById("expenseAmount");

const saveExpense = document.getElementById("saveExpense");

const expenseSummaryBody = document.getElementById("expenseSummaryBody");
const expenseGrandTotal = document.getElementById("expenseGrandTotal");

const printExpense = document.getElementById("printExpense");



// DEFAULT DATE

if(expenseDate){

    expenseDate.value = new Date()
    .toISOString()
    .split("T")[0];

}



// SAVE EXPENSE

if(saveExpense){

saveExpense.onclick = async()=>{

alert("Button clicked");

if(
expenseMember.value === "" ||
expenseDate.value === "" ||
expenseAmount.value === ""
){

alert("Please fill all fields");
return;

}


try{


await addDoc(
collection(db,"regular expenses"),
{

member: expenseMember.value,

date: expenseDate.value,

amount: Number(expenseAmount.value),

createdAt: Timestamp.now()

}

);



alert("Expense Saved Successfully");

expenseAmount.value="";


loadExpense();


}


catch(error){

console.log(error);

alert(error.message);

}


};


}



// LOAD EXPENSE SUMMARY

async function loadExpense(){


if(!expenseSummaryBody) return;



expenseSummaryBody.innerHTML =
"<tr><td colspan='3'>Loading...</td></tr>";



let total = 0;



try{


const q = query(

collection(db,"regular expenses"),

orderBy("date","asc")

);



const snapshot = await getDocs(q);



expenseSummaryBody.innerHTML = "";



snapshot.forEach((doc)=>{


const data = doc.data();



total += Number(data.amount);



expenseSummaryBody.innerHTML += `

<tr>

<td>${data.date}</td>

<td>${data.member}</td>

<td>₹${data.amount}</td>

</tr>

`;


});



expenseGrandTotal.innerHTML = "₹" + total;


}


catch(error){

console.log(error);


expenseSummaryBody.innerHTML =
"<tr><td colspan='3'>Data Loading Error</td></tr>";


}


}




// PRINT EXPENSE SUMMARY

if(printExpense){


printExpense.onclick = ()=>{


let table =
document.getElementById("expenseTable").innerHTML;



let win = window.open("","_blank");



win.document.write(`

<html>

<head>

<title>Regular Expense Report</title>


<style>

body{

font-family:Arial;

padding:20px;

}


h1,h2{

text-align:center;

}


table{

width:100%;

border-collapse:collapse;

}


th,td{

border:1px solid black;

padding:8px;

text-align:center;

}


</style>


</head>


<body>


<h1>💸 Kundu Mees</h1>

<h2>Regular Expense Summary</h2>


<table>

${table}

</table>


</body>


</html>

`);



win.document.close();



setTimeout(()=>{

win.print();

},500);



};


}



// AUTO LOAD

loadExpense();