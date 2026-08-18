// Firebase SDK Imports (Matching your specified 12.16.0 Firestore version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Your exact Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdlsMpjq4OEnEwBo3V9dBldl2VTo7vNMo",
  authDomain: "attendanceapp-c1d31.firebaseapp.com",
  projectId: "attendanceapp-c1d31",
  storageBucket: "attendanceapp-c1d31.firebasestorage.app",
  messagingSenderId: "958468196365",
  appId: "1:958468196365:web:13c84d2ba5c465b8c8ad44",
  measurementId: "G-NBXTEYF82W"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const expenseDateInput = document.getElementById("expenseDate");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");
const remarksInput = document.getElementById("remarks");
const saveExpenseBtn = document.getElementById("saveExpense");

const expenseMonthInput = document.getElementById("expenseMonth");
const loadExpenseBtn = document.getElementById("loadExpense");
const printReportBtn = document.getElementById("printReport");
const expenseBody = document.getElementById("expenseBody");

// Auto-fill dates with current system time
const today = new Date();
expenseDateInput.value = today.toISOString().split('T')[0];
expenseMonthInput.value = today.toISOString().substring(0, 7); 

// Reset UI tables to default empty states
function resetSummaryTable() {
    const summaryIDs = ["gas1", "gas2", "electricity", "cook", "bathroom", "wifi", "rice", "extra"];
    summaryIDs.forEach(id => {
        const dateEl = document.getElementById(`${id}Date`);
        const totalEl = document.getElementById(`${id}Total`);
        if (dateEl) dateEl.innerText = "-";
        if (totalEl) totalEl.innerText = "₹0.00";
    });
    document.getElementById("tableGrandTotal").innerText = "₹0.00";
    document.getElementById("divGrandTotal").innerText = "₹0.00";
}

// Fetch and render data from Firestore
async function fetchMonthlyData() {
    const targetMonth = expenseMonthInput.value; // Format: YYYY-MM
    if (!targetMonth) {
        alert("Please select a month first!");
        return;
    }

    expenseBody.innerHTML = '<tr><td colspan="4">Loading historical entries...</td></tr>';
    resetSummaryTable();

    try {
        // Query Firestore collection named 'expenses' filtering by the monthly tracking key
        const expensesRef = collection(db, "expenses");
        const q = query(expensesRef, where("monthKey", "==", targetMonth));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            expenseBody.innerHTML = '<tr><td colspan="4">No expenses found for this month.</td></tr>';
            return;
        }

        let records = [];
        querySnapshot.forEach(doc => {
            records.push(doc.data());
        });

        // Sort items chronologically by date
        records.sort((a, b) => new Date(a.date) - new Date(b.date));

        let historyHTML = "";
        let grandTotal = 0;

        // Structured mapping variables to track categories
        const summaryData = {
            "Gas 1": { total: 0, dates: [] },
            "Gas 2": { total: 0, dates: [] },
            "Electricity": { total: 0, dates: [] },
            "Cook Charge (Masi)": { total: 0, dates: [] },
            "Bathroom Wash": { total: 0, dates: [] },
            "WiFi": { total: 0, dates: [] },
            "Rice": { total: 0, dates: [] }, // Combines Rice 1, Rice 2, Rice 3, Rice 4
            "Extra Expenses": { total: 0, dates: [] }
        };

        records.forEach(item => {
            const amt = parseFloat(item.amount) || 0;
            grandTotal += amt;

            // Append rows into history panel table
            historyHTML += `<tr>
                <td>${item.date}</td>
                <td>${item.category}</td>
                <td>₹${amt.toFixed(2)}</td>
                <td>${item.remarks || '-'}</td>
            </tr>`;

            // Merge dynamic multi-phased rice entries into single "Rice" tracking identifier
            let targetCategory = item.category;
            if (targetCategory.startsWith("Rice ")) {
                targetCategory = "Rice";
            }

            if (summaryData[targetCategory]) {
                summaryData[targetCategory].total += amt;
                // Isolate short date segment to render list summary
                const dateDay = item.date.split("-")[2] || item.date;
                if (!summaryData[targetCategory].dates.includes(dateDay)) {
                    summaryData[targetCategory].dates.push(dateDay);
                }
            }
        });

        expenseBody.innerHTML = historyHTML;

        // UI Target Component Mappings
        const uiMapping = {
            "Gas 1": "gas1",
            "Gas 2": "gas2",
            "Electricity": "electricity",
            "Cook Charge (Masi)": "cook",
            "Bathroom Wash": "bathroom",
            "WiFi": "wifi",
            "Rice": "rice",
            "Extra Expenses": "extra"
        };

        // Render aggregated results out to the individual summary cells
        Object.keys(summaryData).forEach(cat => {
            const prefix = uiMapping[cat];
            const catObj = summaryData[cat];
            
            const dateCell = document.getElementById(`${prefix}Date`);
            const totalCell = document.getElementById(`${prefix}Total`);

            if (dateCell && catObj.dates.length > 0) {
                dateCell.innerText = catObj.dates.join(", ");
            }
            if (totalCell) {
                totalCell.innerText = `₹${catObj.total.toFixed(2)}`;
            }
        });

        // Set Grand Summary Outputs
        document.getElementById("tableGrandTotal").innerText = `₹${grandTotal.toFixed(2)}`;
        document.getElementById("divGrandTotal").innerText = `₹${grandTotal.toFixed(2)}`;

    } catch (error) {
        console.error("Firestore read execution failed: ", error);
        expenseBody.innerHTML = '<tr><td colspan="4" style="color:red;">Error fetching data. Check cloud permissions.</td></tr>';
    }
}

// Push a clean record block out to your Firestore Database
async function saveExpenseItem() {
    const dateValue = expenseDateInput.value;
    const categoryValue = categorySelect.value;
    const amountValue = parseFloat(amountInput.value);
    const remarksValue = remarksInput.value.trim();

    if (!dateValue || !categoryValue || isNaN(amountValue) || amountValue <= 0) {
        alert("Please provide valid date, category choice, and amounts greater than zero!");
        return;
    }

    // Extract YYYY-MM structure context to handle organized query fetches
    const recordMonthKey = dateValue.substring(0, 7);

    const expensePayload = {
        date: dateValue,
        monthKey: recordMonthKey,
        category: categoryValue,
        amount: amountValue,
        remarks: remarksValue,
        createdAt: new Date()
    };

    try {
        const expensesRef = collection(db, "expenses");
        await addDoc(expensesRef, expensePayload);
        alert("Expense entry securely uploaded to Cloud Firestore!");
        
        // Reset operational inputs cleanly
        categorySelect.value = "";
        amountInput.value = "";
        remarksInput.value = "";
        
        // Match chosen summary filter view scope and trigger refresh
        expenseMonthInput.value = recordMonthKey;
        fetchMonthlyData();
    } catch (error) {
        console.error("Firestore write sequence failed: ", error);
        alert("Failed to write to your live database instance. Confirm security rules allow writes.");
    }
}

// Event Triggers Registration
saveExpenseBtn.addEventListener("click", saveExpenseItem);
loadExpenseBtn.addEventListener("click", fetchMonthlyData);
printReportBtn.addEventListener("click", () => window.print());

// Run search inquiry check on initial boot run
fetchMonthlyData();
