// =====================================================
// KUNDU MEES - BALANCE SHEET
// Income + Regular Expenses + Monthly Expenses + Rice
// =====================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("=================================");
console.log("BALANCE JS STARTED");
console.log("=================================");


// =====================================================
// HTML ELEMENTS
// =====================================================

const monthInput = document.getElementById("balanceMonth");
const loadButton = document.getElementById("loadBalance");

const incomeBox = document.getElementById("income");
const regularBox = document.getElementById("regular");
const monthlyBox = document.getElementById("monthly");
const riceBox = document.getElementById("rice");
const expensesBox = document.getElementById("expenses");
const balanceBox = document.getElementById("balance");


// =====================================================
// CHECK HTML
// =====================================================

if (!monthInput) {
    console.error("balanceMonth not found");
}

if (!loadButton) {
    console.error("loadBalance button not found");
}

if (!incomeBox) {
    console.error("income box not found");
}

if (!regularBox) {
    console.error("regular box not found");
}

if (!monthlyBox) {
    console.error("monthly box not found");
}

if (!riceBox) {
    console.error("rice box not found");
}

if (!expensesBox) {
    console.error("expenses box not found");
}

if (!balanceBox) {
    console.error("balance box not found");
}


// =====================================================
// CURRENT MONTH
// =====================================================

function getCurrentMonth() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

const currentMonth = getCurrentMonth();

monthInput.value = currentMonth;


// =====================================================
// MONEY FORMAT
// =====================================================

function money(value) {

    const number =
        Number(value) || 0;

    return "₹" + number.toFixed(2);
}


// =====================================================
// GET NUMBER
// =====================================================

function getAmount(data) {

    if (!data) {
        return 0;
    }

    const amount =
        Number(data.amount);

    if (!isNaN(amount)) {
        return amount;
    }

    return 0;
}


// =====================================================
// CHECK DATE BELONGS TO MONTH
// =====================================================

function belongsToMonth(data, month) {

    if (!data) {
        return false;
    }


    // -------------------------------------------------
    // date
    // Example: 2026-08-10
    // -------------------------------------------------

    if (data.date) {

        const date =
            String(data.date);

        if (date.startsWith(month)) {
            return true;
        }
    }


    // -------------------------------------------------
    // monthKey
    // Example: 2026-08
    // -------------------------------------------------

    if (data.monthKey) {

        const monthKey =
            String(data.monthKey);

        if (monthKey === month) {
            return true;
        }
    }


    // -------------------------------------------------
    // month
    // -------------------------------------------------

    if (data.month) {

        const monthValue =
            String(data.month);

        if (monthValue === month) {
            return true;
        }
    }


    return false;
}


// =====================================================
// LOAD INCOME
// =====================================================

async function loadIncome(month) {

    let totalIncome = 0;


    try {

        console.log("Loading Income:", month);


        // -------------------------------------------------
        // Your Income structure
        // Document ID = month
        // -------------------------------------------------

        const incomeRef =
            doc(
                db,
                "Income",
                month
            );


        const incomeSnap =
            await getDoc(incomeRef);


        if (incomeSnap.exists()) {

            const data =
                incomeSnap.data();


            console.log(
                "Income document:",
                data
            );


            // -------------------------------------------------
            // records array
            // -------------------------------------------------

            if (Array.isArray(data.records)) {

                data.records.forEach(record => {

                    totalIncome +=
                        Number(record.amount) || 0;

                });

            }


            // -------------------------------------------------
            // If direct amount exists
            // -------------------------------------------------

            if (
                data.amount !== undefined &&
                !Array.isArray(data.records)
            ) {

                totalIncome +=
                    Number(data.amount) || 0;

            }

        }


        console.log(
            "TOTAL INCOME:",
            totalIncome
        );

    }

    catch (error) {

        console.error(
            "Income Error:",
            error
        );

    }


    return totalIncome;
}


// =====================================================
// LOAD REGULAR EXPENSES
// Collection = "regular expenses"
// =====================================================

async function loadRegularExpenses(month) {

    let totalRegular = 0;


    try {

        console.log(
            "Loading Regular Expenses..."
        );


        const ref =
            collection(
                db,
                "regular expenses"
            );


        const snapshot =
            await getDocs(ref);


        console.log(
            "Regular documents:",
            snapshot.size
        );


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            console.log(
                "Regular:",
                docSnap.id,
                data
            );


            if (
                belongsToMonth(
                    data,
                    month
                )
            ) {

                totalRegular +=
                    getAmount(data);

            }

        });


        console.log(
            "TOTAL REGULAR:",
            totalRegular
        );

    }

    catch (error) {

        console.error(
            "Regular Expenses Error:",
            error
        );

    }


    return totalRegular;
}


// =====================================================
// LOAD MONTHLY EXPENSES
// Collection = "expenses"
// =====================================================

async function loadMonthlyExpenses(month) {

    let totalMonthly = 0;


    try {

        console.log(
            "Loading Monthly Expenses..."
        );


        const ref =
            collection(
                db,
                "expenses"
            );


        const snapshot =
            await getDocs(ref);


        console.log(
            "Monthly documents:",
            snapshot.size
        );


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            console.log(
                "Monthly:",
                docSnap.id,
                data
            );


            if (
                belongsToMonth(
                    data,
                    month
                )
            ) {

                totalMonthly +=
                    getAmount(data);

            }

        });


        console.log(
            "TOTAL MONTHLY:",
            totalMonthly
        );

    }

    catch (error) {

        console.error(
            "Monthly Expenses Error:",
            error
        );

    }


    return totalMonthly;
}


// =====================================================
// LOAD RICE EXPENSES
// Collection = "RiceExpenses"
// =====================================================

async function loadRiceExpenses(month) {

    let totalRice = 0;


    try {

        console.log(
            "Loading Rice Expenses..."
        );


        const ref =
            collection(
                db,
                "RiceExpenses"
            );


        const snapshot =
            await getDocs(ref);


        console.log(
            "Rice documents:",
            snapshot.size
        );


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            console.log(
                "Rice:",
                docSnap.id,
                data
            );


            if (
                belongsToMonth(
                    data,
                    month
                )
            ) {

                totalRice +=
                    getAmount(data);

            }

        });


        console.log(
            "TOTAL RICE:",
            totalRice
        );

    }

    catch (error) {

        console.error(
            "Rice Expenses Error:",
            error
        );

    }


    return totalRice;
}


// =====================================================
// MAIN BALANCE
// =====================================================

async function loadBalance(month) {

    if (!month) {

        alert(
            "Please select a month."
        );

        return;
    }


    console.log("");
    console.log(
        "================================="
    );

    console.log(
        "MONTH:",
        month
    );

    console.log(
        "Loading Balance Sheet..."
    );

    console.log(
        "================================="
    );


    // -------------------------------------------------
    // Show loading
    // -------------------------------------------------

    incomeBox.textContent = "Loading...";
    regularBox.textContent = "Loading...";
    monthlyBox.textContent = "Loading...";
    riceBox.textContent = "Loading...";
    expensesBox.textContent = "Loading...";
    balanceBox.textContent = "Loading...";


    try {

        // =================================================
        // LOAD ALL DATA
        // =================================================

        const [
            totalIncome,
            totalRegular,
            totalMonthly,
            totalRice
        ] = await Promise.all([

            loadIncome(month),

            loadRegularExpenses(month),

            loadMonthlyExpenses(month),

            loadRiceExpenses(month)

        ]);


        // =================================================
        // TOTAL EXPENSE
        // =================================================

        const totalExpenses =
            totalRegular +
            totalMonthly +
            totalRice;


        // =================================================
        // REMAINING BALANCE
        // =================================================

        const remainingBalance =
            totalIncome -
            totalExpenses;


        // =================================================
        // DISPLAY
        // =================================================

        incomeBox.textContent =
            money(totalIncome);


        regularBox.textContent =
            money(totalRegular);


        monthlyBox.textContent =
            money(totalMonthly);


        riceBox.textContent =
            money(totalRice);


        expensesBox.textContent =
            money(totalExpenses);


        balanceBox.textContent =
            money(remainingBalance);


        // =================================================
        // CONSOLE RESULT
        // =================================================

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "MONTH:",
            month
        );

        console.log(
            "INCOME:",
            totalIncome
        );

        console.log(
            "REGULAR:",
            totalRegular
        );

        console.log(
            "MONTHLY:",
            totalMonthly
        );

        console.log(
            "RICE:",
            totalRice
        );

        console.log(
            "TOTAL EXPENSE:",
            totalExpenses
        );

        console.log(
            "REMAINING BALANCE:",
            remainingBalance
        );

        console.log(
            "================================"
        );


    }

    catch (error) {

        console.error(
            "BALANCE ERROR:",
            error
        );


        // Do not crash the page

        incomeBox.textContent =
            money(0);

        regularBox.textContent =
            money(0);

        monthlyBox.textContent =
            money(0);

        riceBox.textContent =
            money(0);

        expensesBox.textContent =
            money(0);

        balanceBox.textContent =
            money(0);


        alert(
            "Balance Sheet Error:\n\n" +
            error.message
        );

    }

}


// =====================================================
// LOAD BUTTON
// =====================================================

loadButton.addEventListener(
    "click",
    function () {

        const month =
            monthInput.value;

        loadBalance(month);

    }
);


// =====================================================
// AUTO LOAD CURRENT MONTH
// =====================================================

loadBalance(currentMonth);


console.log(
    "BALANCE JS READY"
);