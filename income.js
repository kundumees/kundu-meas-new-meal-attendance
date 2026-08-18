// Import database instance directly from your config file
import { db } from "./firebase.js"; // Ensure path matches your setup file name
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Initialize Application Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Automatically fetch and load default set months
    loadMonthlyIncome();

    // Attach click listeners to your HTML buttons
    document.getElementById("saveIncome").addEventListener("click", saveDeposit);
    document.getElementById("loadIncome").addEventListener("click", loadMonthlyIncome);
    document.getElementById("incomeMonth").addEventListener("change", loadMonthlyIncome);
});

// 1. SAVE DEPOSIT FUNCTION
async function saveDeposit() {
    const member = document.getElementById("member").value;
    const date = document.getElementById("incomeDate").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const saveButton = document.getElementById("saveIncome");

    // Form Validation Check
    if (!member || !date || isNaN(amount) || amount <= 0) {
        alert("⚠️ Please select a member, valid date, and enter an amount!");
        return;
    }

    // Extract Year-Month (YYYY-MM) to organize data cleanly
    const recordMonth = date.slice(0, 7); 

    try {
        // Prevent double form submissions
        saveButton.disabled = true;
        saveButton.innerText = "⏳ Saving...";

        // Reference target document inside 'Income' collection matching selected month
        const docRef = doc(db, "Income", recordMonth);
        const docSnap = await getDoc(docRef);

        let monthData = { records: [] };
        if (docSnap.exists()) {
            monthData = docSnap.data();
            if (!monthData.records) monthData.records = [];
        }

        // Push new record structure to array map
        monthData.records.push({ member, date, amount });

        // Push changes up to Firestore Cloud 
        await setDoc(docRef, monthData);

        // Mirror locally inside browser localCache as structural backup
        let allIncome = JSON.parse(localStorage.getItem("kundu_mees_income")) || {};
        allIncome[recordMonth] = monthData.records;
        localStorage.setItem("kundu_mees_income", JSON.stringify(allIncome));

        // Clear input form fields for subsequent entries
        document.getElementById("member").value = "";
        document.getElementById("amount").value = "";

        // Instantly refresh layout tables
        await loadMonthlyIncome();
        alert("💾 Deposit saved to Firebase successfully!");

    } catch (error) {
        console.error("Firebase Sync Error: ", error);
        alert("❌ Error connecting to Database server. Entry failed.");
    } finally {
        saveButton.disabled = false;
        saveButton.innerText = "💾 Save Deposit";
    }
}

// 2. LOAD & GENERATE SUMMARY TABLE FUNCTION
async function loadMonthlyIncome() {
    const selectedMonth = document.getElementById("incomeMonth").value;
    const tableBody = document.getElementById("incomeSummaryBody");
    const grandTotalElement = document.getElementById("summaryGrandTotal");

    // Clear old table rows layout
    tableBody.innerHTML = "";

    if (!selectedMonth) {
        grandTotalElement.innerText = "₹0";
        return;
    }

    let currentMonthRecords = [];

    try {
        // Direct remote fetch query
        const docRef = doc(db, "Income", selectedMonth);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentMonthRecords = docSnap.data().records || [];
        }
    } catch (error) {
        console.warn("Using offline fallback storage due to connection profile:", error);
        const allIncome = JSON.parse(localStorage.getItem("kundu_mees_income")) || {};
        currentMonthRecords = allIncome[selectedMonth] || [];
    }

    // Fixed validation roster array matching markup selections
    const membersList = [
        "Ramu", "Nabin", "Sovon", "Suman", "Riman", "Dipankar", 
        "Krishna", "Pradip", "Santu", "Madhav", "Deep", "Mohit", 
        "Suman 2", "Surojit", "Bikash", "Riju"
    ];

    // Build functional matrix block
    let summaryMap = {};
    membersList.forEach(m => {
        summaryMap[m] = { history: [], total: 0 };
    });

    // Populate data structures accurately
    currentMonthRecords.forEach(record => {
        if (summaryMap[record.member]) {
            summaryMap[record.member].history.push(`₹${record.amount}`);
            summaryMap[record.member].total += record.amount;
        }
    });

    let overallGrandTotal = 0;

    // Build markup elements iteratively
    membersList.forEach(member => {
        const data = summaryMap[member];
        overallGrandTotal += data.total;

        const historyText = data.history.length > 0 ? data.history.join(" + ") : "—";
        const highlightClass = data.total > 0 ? "class='total'" : "";

        const rowHTML = `
            <tr ${highlightClass}>
                <td><b>${member}</b></td>
                <td>${historyText}</td>
                <td><b>₹${data.total}</b></td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", rowHTML);
    });

    grandTotalElement.innerText = `₹${overallGrandTotal}`;
}
