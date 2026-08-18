import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// =====================================================
// MEMBERS
// =====================================================

const MEMBERS = [
    "Ramu",
    "Nabin",
    "Sovon",
    "Suman",
    "Riman",
    "Dipankar",
    "Krishna",
    "Pradip",
    "Santu",
    "Madhav",
    "Deep",
    "Mohit",
    "Suman 2",
    "Surojit",
    "Bikash",
    "Riju"
];


// =====================================================
// GLOBAL DATA
// =====================================================

let attendanceData = {};
let regularExpensesData = [];
let riceExpensesData = [];
let monthlyExpensesData = [];
let incomeData = [];
let chargesData = [];

let guests = [];
let guestMealRate = 40;

let reportData = {
    month: "",
    regularMeals: {},
    extraMeals: {},
    income: {},
    charges: {},
    regularExpense: 0,
    riceExpense: 0,
    monthlyExpense: 0,
    masiCharge: 2200,
    totalMeal: 0,
    mealRate: 0,
    finalMealCharges: {},
    finalMealTotals: {},
    establishmentTotal: 0,
    establishmentPerMember: 0
};


// =====================================================
// BASIC HELPERS
// =====================================================

function toNumber(value) {

    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
}


function money(value) {

    return "₹" + toNumber(value).toFixed(2);
}


function getMonthFromDate(value) {

    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value.substring(0, 7);
    }

    if (value instanceof Timestamp) {

        const d = value.toDate();

        return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0")
        );
    }

    if (value && typeof value.toDate === "function") {

        const d = value.toDate();

        return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0")
        );
    }

    if (value && value.seconds) {

        const d = new Date(
            value.seconds * 1000
        );

        return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0")
        );
    }

    return "";
}


function getSelectedMonth() {

    const input =
        document.getElementById("reportMonth");

    if (!input || !input.value) {

        throw new Error(
            "Please select a month."
        );
    }

    return input.value;
}


function setStatus(text) {

    const element =
        document.getElementById("status");

    if (element) {

        element.textContent = text;

    }
}


// =====================================================
// LOAD ATTENDANCE
// =====================================================

async function loadAttendance(month) {

    attendanceData = {};

    const snapshot =
        await getDocs(
            collection(db, "Attendance")
        );

    snapshot.forEach(item => {

        const date =
            item.id;

        if (
            date.substring(0, 7) === month
        ) {

            attendanceData[date] =
                item.data();

        }

    });

    console.log(
        "Attendance:",
        attendanceData
    );
}


// =====================================================
// LOAD RICE EXPENSES
// =====================================================

async function loadRiceExpenses(month) {

    riceExpensesData = [];

    const snapshot =
        await getDocs(
            collection(db, "RiceExpenses")
        );

    snapshot.forEach(item => {

        const data =
            item.data();

        riceExpensesData.push({

            id: item.id,

            ...data

        });

    });

    console.log(
        "RiceExpenses:",
        riceExpensesData
    );
}


// =====================================================
// LOAD REGULAR EXPENSES
// =====================================================

async function loadRegularExpenses(month) {

    regularExpensesData = [];

    const snapshot =
        await getDocs(
            collection(db, "regular expenses")
        );

    snapshot.forEach(item => {

        const data =
            item.data();

        regularExpensesData.push({

            id: item.id,

            ...data

        });

    });

    console.log(
        "regular expenses:",
        regularExpensesData
    );
}


// =====================================================
// LOAD MONTHLY EXPENSES
// =====================================================

async function loadMonthlyExpenses(month) {

    monthlyExpensesData = [];

    const snapshot =
        await getDocs(
            collection(db, "expenses")
        );

    snapshot.forEach(item => {

        const data =
            item.data();

        monthlyExpensesData.push({

            id: item.id,

            ...data

        });

    });

    console.log(
        "expenses:",
        monthlyExpensesData
    );
}


// =====================================================
// LOAD INCOME
// =====================================================

async function loadIncome(month) {

    incomeData = [];

    const incomeRef =
        doc(
            db,
            "Income",
            month
        );

    const snapshot =
        await getDoc(
            incomeRef
        );

    if (!snapshot.exists()) {

        console.log(
            "Income document not found:",
            month
        );

        return;
    }

    const data =
        snapshot.data();

    if (
        Array.isArray(data.records)
    ) {

        incomeData =
            data.records;

    } else if (
        Array.isArray(data.income)
    ) {

        incomeData =
            data.income;

    } else if (
        Array.isArray(data.entries)
    ) {

        incomeData =
            data.entries;

    }

    console.log(
        "Income:",
        incomeData
    );
}


// =====================================================
// LOAD CHARGES
// =====================================================

async function loadCharges(month) {

    chargesData = [];

    const snapshot =
        await getDocs(
            collection(db, "Charges")
        );

    snapshot.forEach(item => {

        const data =
            item.data();

        /*
         * Keep all Firebase Charge data.
         * Month filtering is flexible because
         * different charge documents may use
         * different field names.
         */

        const chargeMonth =
            data.month ||
            data.Month ||
            getMonthFromDate(data.date) ||
            getMonthFromDate(data.createdAt) ||
            getMonthFromDate(data.timestamp) ||
            getMonthFromDate(data.chargeDate);

        /*
         * If the document has a month/date field,
         * only selected month will be loaded.
         *
         * If no month/date field exists,
         * keep the document so existing Firebase
         * charge data is not lost.
         */

        if (
            !chargeMonth ||
            chargeMonth === month
        ) {

            chargesData.push({

                id: item.id,

                ...data

            });

        }

    });

    console.log(
        "Charges:",
        chargesData
    );
}


// =====================================================
// CALCULATE CHARGES BY MEMBER
// =====================================================

function calculateChargesByMember() {

    const result = {};

    MEMBERS.forEach(member => {

        result[member] = 0;

    });


    chargesData.forEach(item => {

        const member =
            item.member ||
            item.Member ||
            item.name ||
            item.memberName ||
            "";

        const amount =
            toNumber(
                item.chargeAmount ||
                item.amount ||
                item.charge ||
                item.fine
            );


        if (
            result.hasOwnProperty(member)
        ) {

            result[member] +=
                amount;

        }

    });


    console.log(
        "Charges By Member:",
        result
    );


    return result;
}


// =====================================================
// REGULAR EXPENSE TOTAL
// =====================================================

function calculateRegularExpense() {

    let total = 0;

    regularExpensesData.forEach(item => {

        total +=
            toNumber(item.amount);

    });

    return total;
}


// =====================================================
// RICE EXPENSE TOTAL
// =====================================================

function calculateRiceExpense() {

    let total = 0;

    riceExpensesData.forEach(item => {

        total +=
            toNumber(item.amount);

    });

    return total;
}


// =====================================================
// MONTHLY EXPENSE TOTAL
// =====================================================

function calculateMonthlyExpense() {

    let total = 0;

    monthlyExpensesData.forEach(item => {

        total +=
            toNumber(item.amount);

    });

    return total;
}


// =====================================================
// REGULAR MEAL CALCULATION
// =====================================================

function calculateRegularMeals() {

    const result = {};

    const bonusElement =
        document.getElementById("bonusMeal");

    const bonusMeal =
        bonusElement
            ? Number(bonusElement.value) || 0
            : 0;


    MEMBERS.forEach(member => {

        result[member] = {

            day: 0,

            night: 0,

            actual: 0,

            counted: 0

        };

    });


    // =================================================
    // COUNT DAY / NIGHT ATTENDANCE
    // =================================================

    Object.values(
        attendanceData
    ).forEach(dayData => {

        MEMBERS.forEach(member => {

            const memberData =
                dayData[member];

            if (!memberData) {

                return;

            }


            const day =
                memberData.day === true ||
                memberData.day === 1 ||
                memberData.day === "true";


            const night =
                memberData.night === true ||
                memberData.night === 1 ||
                memberData.night === "true";


            if (day) {

                result[member].day++;

            }


            if (night) {

                result[member].night++;

            }

        });

    });


    // =================================================
    // ACTUAL + COUNTED MEAL
    // =================================================

    MEMBERS.forEach(member => {

        result[member].actual =
            result[member].day +
            result[member].night;


        result[member].counted =
            Math.max(
                result[member].actual,
                bonusMeal
            );

    });


    return result;
}


// =====================================================
// EXTRA MEAL CALCULATION
// =====================================================

function calculateExtraMeals() {

    const result = {};

    MEMBERS.forEach(member => {

        result[member] = {

            day: 0,

            night: 0,

            egg: 0,

            fish: 0,

            chicken: 0,

            total: 0

        };

    });


    Object.values(
        attendanceData
    ).forEach(dayData => {

        let extra =
            dayData.extraMeals ||
            dayData.extraMeal ||
            dayData.extra ||
            null;


        if (!extra) {

            return;

        }


        if (Array.isArray(extra)) {

            extra.forEach(item => {

                const member =
                    item.member ||
                    item.Member;

                if (
                    !member ||
                    !result[member]
                ) {

                    return;

                }


                const time =
                    String(
                        item.time ||
                        item.mealTime ||
                        ""
                    ).toLowerCase();


                const quantity =
                    toNumber(
                        item.quantity
                    ) || 1;


                const meal =
                    String(
                        item.meal ||
                        item.mealType ||
                        ""
                    ).toLowerCase();


                if (time === "day") {

                    result[member].day +=
                        quantity;

                }


                if (time === "night") {

                    result[member].night +=
                        quantity;

                }


                if (meal === "egg") {

                    result[member].egg +=
                        quantity;

                }


                if (meal === "fish") {

                    result[member].fish +=
                        quantity;

                }


                if (meal === "chicken") {

                    result[member].chicken +=
                        quantity;

                }

            });

            return;
        }


        MEMBERS.forEach(member => {

            const item =
                extra[member];

            if (!item) {

                return;

            }


            result[member].day +=
                toNumber(item.day);


            result[member].night +=
                toNumber(item.night);


            result[member].egg +=
                toNumber(item.egg);


            result[member].fish +=
                toNumber(item.fish);


            result[member].chicken +=
                toNumber(item.chicken);

        });

    });


    MEMBERS.forEach(member => {

        result[member].total =
            result[member].day +
            result[member].night;

    });


    return result;
}


// =====================================================
// INCOME BY MEMBER
// =====================================================

function calculateIncomeByMember() {

    const result = {};

    MEMBERS.forEach(member => {

        result[member] = 0;

    });


    incomeData.forEach(item => {

        const member =
            item.member ||
            item.Member ||
            item.name ||
            "";


        const amount =
            toNumber(item.amount);


        if (
            result.hasOwnProperty(member)
        ) {

            result[member] +=
                amount;

        }

    });


    return result;
}


// =====================================================
// MEAL RATE
// =====================================================

function calculateMealRate() {

    const cost =
        reportData.regularExpense +
        reportData.riceExpense -
        reportData.masiCharge;


    const totalMeal =
        reportData.totalMeal;


    const mealCostElement =
        document.getElementById("mealCost");


    if (mealCostElement) {

        mealCostElement.textContent =
            money(cost);

    }


    if (totalMeal <= 0) {

        const rateElement =
            document.getElementById("mealRate");

        if (rateElement) {

            rateElement.textContent =
                "₹0.00";

        }

        return 0;
    }


    const rate =
        cost / totalMeal;


    const rateElement =
        document.getElementById("mealRate");


    if (rateElement) {

        rateElement.textContent =
            money(rate);

    }


    return rate;
}


// =====================================================
// RENDER REGULAR TABLE
// =====================================================

function renderRegularTable() {

    const body =
        document.getElementById(
            "regularBody"
        );

    if (!body) return;

    body.innerHTML = "";

    let actualTotal = 0;

    let countedTotal = 0;

    let chargeTotal = 0;


    const bonusElement =
        document.getElementById(
            "bonusMeal"
        );

    const bonusMeal =
        bonusElement
            ? Number(bonusElement.value) || 0
            : 0;


    MEMBERS.forEach(member => {

        if (
            guests.includes(member)
        ) {

            return;

        }


        const data =
            reportData.regularMeals[member];


        if (!data) {

            return;

        }


        if (
            data.editedCounted === undefined
        ) {

            data.counted =
                Math.max(
                    Number(data.actual) || 0,
                    bonusMeal
                );

        } else {

            data.counted =
                Number(data.editedCounted) || 0;

        }


        const charge =
            data.counted *
            reportData.mealRate;


        actualTotal +=
            Number(data.actual) || 0;


        countedTotal +=
            Number(data.counted) || 0;


        chargeTotal +=
            charge;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${member}</td>

            <td>${data.day}</td>

            <td>${data.night}</td>

            <td>${data.actual}</td>

            <td>

                <input
                    type="number"
                    class="counted-meal-input"
                    value="${data.counted}"
                    min="0"
                    step="1"
                    style="
                        width:80px;
                        text-align:center;
                        font-size:17px;
                        font-weight:bold;
                    "
                >

            </td>

            <td class="meal-charge-cell">

                ${data.counted} ×
                ${money(reportData.mealRate)}
                =
                ${money(charge)}

            </td>

        `;


        const input =
            row.querySelector(
                ".counted-meal-input"
            );


        input.addEventListener(
            "input",
            function () {

                const newCounted =
                    Number(this.value) || 0;


                data.editedCounted =
                    newCounted;


                data.counted =
                    newCounted;


                const newCharge =
                    newCounted *
                    reportData.mealRate;


                row.querySelector(
                    ".meal-charge-cell"
                ).textContent =
                    `${newCounted} × ` +
                    `${money(reportData.mealRate)} = ` +
                    `${money(newCharge)}`;


                updateRegularTotals();

                renderFinalMealTable();

                renderFinalSheet();

            }
        );


        body.appendChild(row);

    });


    const actualElement =
        document.getElementById(
            "regularActualTotal"
        );


    if (actualElement) {

        actualElement.textContent =
            actualTotal;

    }


    const countedElement =
        document.getElementById(
            "regularCountedTotal"
        );


    if (countedElement) {

        countedElement.textContent =
            countedTotal;

    }


    const chargeElement =
        document.getElementById(
            "regularChargeTotal"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}


// =====================================================
// UPDATE REGULAR TOTALS
// =====================================================

function updateRegularTotals() {

    let actualTotal = 0;

    let countedTotal = 0;

    let chargeTotal = 0;


    MEMBERS.forEach(member => {

        const data =
            reportData.regularMeals[member];


        if (!data) {

            return;

        }


        actualTotal +=
            Number(data.actual) || 0;


        countedTotal +=
            Number(data.counted) || 0;


        chargeTotal +=
            (Number(data.counted) || 0) *
            (Number(reportData.mealRate) || 0);

    });


    const actualElement =
        document.getElementById(
            "regularActualTotal"
        );


    if (actualElement) {

        actualElement.textContent =
            actualTotal;

    }


    const countedElement =
        document.getElementById(
            "regularCountedTotal"
        );


    if (countedElement) {

        countedElement.textContent =
            countedTotal;

    }


    const chargeElement =
        document.getElementById(
            "regularChargeTotal"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}


// =====================================================
// BONUS MEAL CHANGE
// =====================================================

function handleBonusMealChange() {

    MEMBERS.forEach(member => {

        const data =
            reportData.regularMeals[member];


        if (!data) {

            return;

        }


        delete data.editedCounted;

    });


    reportData.regularMeals =
        calculateRegularMeals();


    renderRegularTable();

    renderFinalMealTable();

    renderFinalSheet();
}


// =====================================================
// ADD GUEST
// =====================================================

function addGuest() {

    const select =
        document.getElementById(
            "guestMember"
        );


    if (!select) return;


    const member =
        select.value;


    if (!member) {

        alert(
            "Please select a member."
        );

        return;

    }


    if (
        guests.includes(member)
    ) {

        alert(
            "This member is already added."
        );

        return;

    }


    if (
        !reportData.regularMeals[member]
    ) {

        alert(
            "Regular meal data not found."
        );

        return;

    }


    guests.push(member);


    renderRegularTable();

    renderGuestTable();

    renderFinalMealTable();

    renderFinalSheet();


    select.value = "";
}


// =====================================================
// REMOVE GUEST
// =====================================================

function removeGuest(member) {

    guests =
        guests.filter(
            name => name !== member
        );


    renderRegularTable();

    renderGuestTable();

    renderFinalMealTable();

    renderFinalSheet();
}


// =====================================================
// RENDER GUEST TABLE
// =====================================================

function renderGuestTable() {

    const body =
        document.getElementById(
            "guestBody"
        );


    if (!body) return;


    body.innerHTML = "";


    let originalTotal = 0;

    let guestTotal = 0;

    let chargeTotal = 0;


    guests.forEach(member => {

        const data =
            reportData.regularMeals[member];


        if (!data) {

            return;

        }


        const original =
            Number(data.actual) || 0;


        const total =
            original;


        const charge =
            total * guestMealRate;


        originalTotal +=
            original;


        guestTotal +=
            total;


        chargeTotal +=
            charge;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${member}</td>

            <td>${original}</td>

            <td>${total}</td>

            <td>

                <input
                    type="number"
                    class="guest-rate-input"
                    value="${guestMealRate}"
                    min="0"
                    step="0.01"
                    style="
                        width:80px;
                        text-align:center;
                        font-size:17px;
                        font-weight:bold;
                    "
                >

            </td>

            <td class="guest-charge">

                ${money(charge)}

            </td>

            <td>

                <button
                    type="button"
                    class="delete-btn guest-delete"
                >
                    Delete
                </button>

            </td>

        `;


        const rateInput =
            row.querySelector(
                ".guest-rate-input"
            );


        rateInput.addEventListener(
            "input",
            function () {

                guestMealRate =
                    Number(this.value) || 0;


                updateGuestCharges();

                renderFinalMealTable();

                renderFinalSheet();

            }
        );


        const deleteButton =
            row.querySelector(
                ".guest-delete"
            );


        deleteButton.addEventListener(
            "click",
            function () {

                removeGuest(member);

            }
        );


        body.appendChild(row);

    });


    const originalElement =
        document.getElementById(
            "guestOriginalTotal"
        );


    if (originalElement) {

        originalElement.textContent =
            originalTotal;

    }


    const totalElement =
        document.getElementById(
            "guestGrandTotal"
        );


    if (totalElement) {

        totalElement.textContent =
            guestTotal;

    }


    const chargeElement =
        document.getElementById(
            "guestGrandCharge"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}


// =====================================================
// UPDATE GUEST CHARGES
// =====================================================

function updateGuestCharges() {

    let guestTotal = 0;

    let chargeTotal = 0;


    document.querySelectorAll(
        "#guestBody tr"
    ).forEach(row => {

        const member =
            row.children[0]
                .textContent
                .trim();


        const data =
            reportData.regularMeals[member];


        if (!data) {

            return;

        }


        const total =
            Number(data.actual) || 0;


        const charge =
            total * guestMealRate;


        guestTotal +=
            total;


        chargeTotal +=
            charge;


        const rateInput =
            row.querySelector(
                ".guest-rate-input"
            );


        if (rateInput) {

            rateInput.value =
                guestMealRate;

        }


        const chargeCell =
            row.querySelector(
                ".guest-charge"
            );


        if (chargeCell) {

            chargeCell.textContent =
                money(charge);

        }

    });


    const totalElement =
        document.getElementById(
            "guestGrandTotal"
        );


    if (totalElement) {

        totalElement.textContent =
            guestTotal;

    }


    const chargeElement =
        document.getElementById(
            "guestGrandCharge"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}

// =====================================================
// RENDER EXTRA TABLE
// =====================================================

function renderExtraTable() {

    const body =
        document.getElementById(
            "extraBody"
        );


    if (!body) return;


    body.innerHTML = "";


    let total = 0;

    let chargeTotal = 0;


    MEMBERS.forEach(member => {

        const data =
            reportData.extraMeals[member];


        if (!data) return;


        if (
            Number(data.total) === 0 &&
            Number(data.egg) === 0 &&
            Number(data.fish) === 0 &&
            Number(data.chicken) === 0
        ) {

            return;

        }


        const fishCharge =
            Number(data.fish || 0) * 40;


        const eggCharge =
            Number(data.egg || 0) * 40;


        const chickenCharge =
            Number(data.chicken || 0) * 70;


        const automaticCharge =
            fishCharge +
            eggCharge +
            chickenCharge;


        if (
            data.editedCharge === undefined
        ) {

            data.charge =
                automaticCharge;

        } else {

            data.charge =
                Number(data.editedCharge) || 0;

        }


        const charge =
            Number(data.charge) || 0;


        total +=
            Number(data.total) || 0;


        chargeTotal +=
            charge;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${member}</td>

            <td>${Number(data.day) || 0}</td>

            <td>${Number(data.night) || 0}</td>

            <td>${Number(data.egg) || 0}</td>

            <td>${Number(data.fish) || 0}</td>

            <td>${Number(data.chicken) || 0}</td>

            <td>${Number(data.total) || 0}</td>

            <td>

                <input
                    type="number"
                    class="extra-charge-input"
                    value="${charge}"
                    min="0"
                    step="1"
                    style="
                        width:100px;
                        text-align:center;
                        font-size:17px;
                        font-weight:bold;
                    "
                >

            </td>

            <td>

                <button
                    type="button"
                    class="delete-btn extra-delete-btn">
                    Delete
                </button>

            </td>

        `;


        const chargeInput =
            row.querySelector(
                ".extra-charge-input"
            );


        chargeInput.addEventListener(
            "input",
            function () {

                const newCharge =
                    Number(this.value) || 0;


                data.editedCharge =
                    newCharge;


                data.charge =
                    newCharge;


                updateExtraTotals();

                renderFinalMealTable();

                renderFinalSheet();

            }
        );


        const deleteButton =
            row.querySelector(
                ".extra-delete-btn"
            );


        deleteButton.addEventListener(
            "click",
            function () {

                deleteExtraMeal(member);

            }
        );


        body.appendChild(row);

    });


    const totalElement =
        document.getElementById(
            "extraGrandTotal"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    const chargeElement =
        document.getElementById(
            "extraGrandCharge"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}


// =====================================================
// DELETE EXTRA MEAL
// =====================================================

function deleteExtraMeal(member) {

    if (
        !reportData.extraMeals[member]
    ) {

        return;

    }


    reportData.extraMeals[member] = {

        day: 0,

        night: 0,

        egg: 0,

        fish: 0,

        chicken: 0,

        total: 0,

        charge: 0

    };


    renderExtraTable();

    renderFinalMealTable();

    renderFinalSheet();
}


// =====================================================
// UPDATE EXTRA TOTALS
// =====================================================

function updateExtraTotals() {

    let total = 0;

    let chargeTotal = 0;


    MEMBERS.forEach(member => {

        const data =
            reportData.extraMeals[member];


        if (!data) return;


        total +=
            Number(data.total) || 0;


        chargeTotal +=
            Number(data.charge) || 0;

    });


    const totalElement =
        document.getElementById(
            "extraGrandTotal"
        );


    const chargeElement =
        document.getElementById(
            "extraGrandCharge"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}


// =====================================================
// RENDER FINAL MEAL TABLE
// =====================================================

function renderFinalMealTable() {

    const body =
        document.getElementById(
            "finalMealBody"
        );


    if (!body) return;


    body.innerHTML = "";


    let regularTotal = 0;

    let extraTotal = 0;

    let guestTotal = 0;

    let finalTotal = 0;

    let chargeTotal = 0;


    /*
     * IMPORTANT
     *
     * Final Sheet will use ONLY this object.
     *
     * finalMealTotals[member]
     * =
     * Final Meal Sheet -> Final Total Meal
     */

    reportData.finalMealTotals = {};


    reportData.finalMealCharges = {};


    MEMBERS.forEach(member => {

        const regular =
            reportData.regularMeals[member];


        const extra =
            reportData.extraMeals[member];


        if (!regular) {

            return;

        }


        // =========================================
        // GUEST MEMBER
        // =========================================

        if (
            guests.includes(member)
        ) {

            const guestMeal =
                Number(regular.actual) || 0;


            const guestCharge =
                guestMeal *
                guestMealRate;


            /*
             * THIS IS THE FINAL TOTAL MEAL
             * SHOWN IN FINAL MEAL SHEET
             */

            const finalTotalMeal =
                guestMeal;


            reportData.finalMealTotals[member] =
                finalTotalMeal;


            reportData.finalMealCharges[member] =
                guestCharge;


            guestTotal +=
                guestMeal;


            finalTotal +=
                finalTotalMeal;


            chargeTotal +=
                guestCharge;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>${member}</td>

                <td>0</td>

                <td>0</td>

                <td>${guestMeal}</td>

                <td>${finalTotalMeal}</td>

                <td>${money(guestMealRate)}</td>

                <td>${money(guestCharge)}</td>

            `;


            body.appendChild(row);

            return;

        }


        // =========================================
        // REGULAR MEMBER
        // =========================================

        const regularMeal =
            Number(
                regular.counted
            ) || 0;


        // =========================================
        // EXTRA MEAL
        // =========================================

        const extraMeal =
            extra
                ? Number(extra.total) || 0
                : 0;


        // =========================================
        // REGULAR MEAL CHARGE
        // =========================================

        const regularCharge =
            regularMeal *
            Number(
                reportData.mealRate || 0
            );


        // =========================================
        // EXTRA MEAL CHARGE
        // =========================================

        let extraCharge = 0;


        if (extra) {

            if (
                extra.editedCharge !== undefined
            ) {

                extraCharge =
                    Number(
                        extra.editedCharge
                    ) || 0;

            } else if (
                extra.charge !== undefined
            ) {

                extraCharge =
                    Number(
                        extra.charge
                    ) || 0;

            } else {

                const fishCharge =
                    (Number(extra.fish) || 0) * 40;


                const eggCharge =
                    (Number(extra.egg) || 0) * 40;


                const chickenCharge =
                    (Number(extra.chicken) || 0) * 70;


                extraCharge =
                    fishCharge +
                    eggCharge +
                    chickenCharge;

            }

        }


        // =========================================
        // MEMBER MEAL CHARGE
        // =========================================

        const memberCharge =
            regularCharge +
            extraCharge;


        reportData.finalMealCharges[member] =
            memberCharge;


        // =========================================
        // FINAL TOTAL MEAL
        // =========================================
        //
        // THIS VALUE IS THE ONE AND ONLY
        // FINAL TOTAL MEAL.
        //
        // Final Sheet will NOT calculate it again.
        //

        const finalTotalMeal =
            regularMeal +
            extraMeal;


        reportData.finalMealTotals[member] =
            finalTotalMeal;


        // =========================================
        // TOTALS
        // =========================================

        regularTotal +=
            regularMeal;


        extraTotal +=
            extraMeal;


        finalTotal +=
            finalTotalMeal;


        chargeTotal +=
            memberCharge;


        // =========================================
        // ROW
        // =========================================

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${member}</td>

            <td>${regularMeal}</td>

            <td>${extraMeal}</td>

            <td>0</td>

            <td>${finalTotalMeal}</td>

            <td>${money(reportData.mealRate)}</td>

            <td>${money(memberCharge)}</td>

        `;


        body.appendChild(row);

    });


    // =========================================
    // FINAL MEAL SHEET TOTALS
    // =========================================

    const regularElement =
        document.getElementById(
            "finalRegularTotal"
        );


    if (regularElement) {

        regularElement.textContent =
            regularTotal;

    }


    const extraElement =
        document.getElementById(
            "finalExtraTotal"
        );


    if (extraElement) {

        extraElement.textContent =
            extraTotal;

    }


    const guestElement =
        document.getElementById(
            "finalGuestTotal"
        );


    if (guestElement) {

        guestElement.textContent =
            guestTotal;

    }


    const finalElement =
        document.getElementById(
            "finalMealTotal"
        );


    if (finalElement) {

        finalElement.textContent =
            finalTotal;

    }


    const chargeElement =
        document.getElementById(
            "finalMealChargeTotal"
        );


    if (chargeElement) {

        chargeElement.textContent =
            money(chargeTotal);

    }
}

// =====================================================
// RENDER FINAL SHEET
// =====================================================

function renderFinalSheet() {

    const body =
        document.getElementById(
            "finalBody"
        );


    if (!body) return;


    /*
     * IMPORTANT:
     *
     * Always refresh Final Meal Sheet first.
     *
     * This guarantees finalMealTotals contains
     * exactly the values shown in Final Meal Sheet.
     */

    renderFinalMealTable();


    body.innerHTML = "";


    let totalMeal = 0;

    let totalExtra = 0;

    let totalMealCharge = 0;

    let totalCharges = 0;

    let totalEstablishment = 0;

    let totalExpenses = 0;

    let totalIncome = 0;


    MEMBERS.forEach(member => {

        // =========================================
        // IMPORTANT:
        // TAKE TOTAL MEAL DIRECTLY FROM
        // FINAL MEAL SHEET
        // =========================================

        const memberMeal =
            Number(
                reportData.finalMealTotals[member]
            ) || 0;


        const extra =
            Number(
                reportData.extraMeals[member]
                    ?.total
            ) || 0;


        const mealCharge =
            Number(
                reportData.finalMealCharges[member]
            ) || 0;


        // =========================================
        // CHARGES FROM FIREBASE
        // =========================================

        const charges =
            Number(
                reportData.charges[member]
            ) || 0;


        // =========================================
        // ESTABLISHMENT
        // =========================================

        const establishment =
            Number(
                reportData.establishmentPerMember
            ) || 0;


        // =========================================
        // INCOME
        // =========================================

        const income =
            Number(
                reportData.income[member]
            ) || 0;


        // =========================================
        // TOTAL EXPENSES
        // =========================================

        const expenses =
            mealCharge +
            charges +
            establishment;


        // =========================================
        // REMARKS
        // =========================================

        let remarks;


        if (income > expenses) {

            remarks =
                "Balance " +
                money(
                    income - expenses
                );

        } else if (
            income < expenses
        ) {

            remarks =
                "Due " +
                money(
                    expenses - income
                );

        } else {

            remarks =
                "Clear";

        }


        // =========================================
        // TOTALS
        // =========================================

        totalMeal +=
            memberMeal;


        totalExtra +=
            extra;


        totalMealCharge +=
            mealCharge;


        totalCharges +=
            charges;


        totalEstablishment +=
            establishment;


        totalExpenses +=
            expenses;


        totalIncome +=
            income;


        // =========================================
        // FINAL SHEET ROW
        // =========================================

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${member}</td>

            <td>${memberMeal}</td>

            <td>${extra}</td>

            <td>${money(reportData.mealRate)}</td>

            <td>${money(mealCharge)}</td>

            <td>${money(charges)}</td>

            <td>${money(establishment)}</td>

            <td>${money(expenses)}</td>

            <td>${money(income)}</td>

            <td>${remarks}</td>

        `;


        body.appendChild(row);

    });


    // =========================================
    // FINAL SHEET TOTALS
    // =========================================

    const totalMealElement =
        document.getElementById(
            "sheetTotalMeal"
        );


    if (totalMealElement) {

        totalMealElement.textContent =
            totalMeal;

    }


    const totalExtraElement =
        document.getElementById(
            "sheetTotalExtra"
        );


    if (totalExtraElement) {

        totalExtraElement.textContent =
            totalExtra;

    }


    const mealChargeElement =
        document.getElementById(
            "sheetTotalMealCharge"
        );


    if (mealChargeElement) {

        mealChargeElement.textContent =
            money(totalMealCharge);

    }


    const chargesElement =
        document.getElementById(
            "sheetTotalCharges"
        );


    if (chargesElement) {

        chargesElement.textContent =
            money(totalCharges);

    }


    const establishmentElement =
        document.getElementById(
            "sheetTotalEstablishment"
        );


    if (establishmentElement) {

        establishmentElement.textContent =
            money(totalEstablishment);

    }


    const expensesElement =
        document.getElementById(
            "sheetTotalExpenses"
        );


    if (expensesElement) {

        expensesElement.textContent =
            money(totalExpenses);

    }


    const incomeElement =
        document.getElementById(
            "sheetTotalIncome"
        );


    if (incomeElement) {

        incomeElement.textContent =
            money(totalIncome);

    }


    const remarkElement =
        document.getElementById(
            "sheetFinalRemark"
        );


    if (remarkElement) {

        remarkElement.textContent =
            totalIncome >= totalExpenses
                ? "CLEAR"
                : "DUE";

    }
}

// =====================================================
// LOAD REPORT
// =====================================================

async function loadFinalReport() {

    try {

        const month =
            getSelectedMonth();


        setStatus(
            "Loading Firebase data..."
        );


        await Promise.all([

            loadAttendance(month),

            loadRegularExpenses(month),

            loadMonthlyExpenses(month),

            loadRiceExpenses(month),

            loadIncome(month),

            loadCharges(month)

        ]);


        reportData.month =
            month;


        reportData.regularExpense =
            calculateRegularExpense();


        reportData.riceExpense =
            calculateRiceExpense();


        reportData.monthlyExpense =
            calculateMonthlyExpense();


        reportData.regularMeals =
            calculateRegularMeals();


        reportData.extraMeals =
            calculateExtraMeals();


        reportData.income =
            calculateIncomeByMember();


        reportData.charges =
            calculateChargesByMember();


        const masiInput =
            document.getElementById(
                "masiMealCharge"
            );


        reportData.masiCharge =
            masiInput
                ? toNumber(masiInput.value)
                : 0;


        // =========================================
        // INITIAL TOTAL MEAL
        // =========================================

        const regularMealTotal =
            MEMBERS.reduce(
                (sum, member) => {

                    return (
                        sum +
                        (
                            reportData
                                .regularMeals[member]
                                ?.counted || 0
                        )
                    );

                },
                0
            );


        const extraMealTotal =
            MEMBERS.reduce(
                (sum, member) => {

                    return (
                        sum +
                        (
                            reportData
                                .extraMeals[member]
                                ?.total || 0
                        )
                    );

                },
                0
            );


        reportData.totalMeal =
            regularMealTotal +
            extraMealTotal;


        const totalMealInput =
            document.getElementById(
                "totalMeal"
            );


        if (totalMealInput) {

            totalMealInput.value =
                reportData.totalMeal;

        }


        // =========================================
        // MEAL RATE
        // =========================================

        reportData.mealRate =
            calculateMealRate();


        // =========================================
        // EXPENSE DISPLAY
        // =========================================

        const regularExpenseElement =
            document.getElementById(
                "regularExpense"
            );


        if (regularExpenseElement) {

            regularExpenseElement.textContent =
                money(
                    reportData.regularExpense
                );

        }


        const riceExpenseElement =
            document.getElementById(
                "riceExpense"
            );


        if (riceExpenseElement) {

            riceExpenseElement.textContent =
                money(
                    reportData.riceExpense
                );

        }


        const monthlyExpenseElement =
            document.getElementById(
                "estMonthlyExpense"
            );


        if (monthlyExpenseElement) {

            monthlyExpenseElement.textContent =
                money(
                    reportData.monthlyExpense
                );

        }


        const masiDisplay =
            document.getElementById(
                "estMasiCharge"
            );


        if (masiDisplay) {

            masiDisplay.textContent =
                money(
                    reportData.masiCharge
                );

        }


        // =========================================
        // ESTABLISHMENT
        // =========================================

        reportData.establishmentTotal =
            reportData.monthlyExpense +
            reportData.masiCharge;


        reportData.establishmentPerMember =
            reportData.establishmentTotal / 16;


        const estTotal =
            document.getElementById(
                "estTotal"
            );


        if (estTotal) {

            estTotal.textContent =
                money(
                    reportData.establishmentTotal
                );

        }


        const estPerMember =
            document.getElementById(
                "estPerMember"
            );


        if (estPerMember) {

            estPerMember.textContent =
                money(
                    reportData.establishmentPerMember
                );

        }


        const bonusDisplay =
            document.getElementById(
                "bonusMealDisplay"
            );


        const bonusInput =
            document.getElementById(
                "bonusMeal"
            );


        if (
            bonusDisplay &&
            bonusInput
        ) {

            bonusDisplay.textContent =
                bonusInput.value;

        }


        // =========================================
        // RENDER
        // =========================================

        renderRegularTable();

        renderExtraTable();

        renderGuestTable();

        renderFinalMealTable();

        renderFinalSheet();


        setStatus(
            "Final Report Loaded Successfully"
        );


        console.log(
            "Final report data:",
            reportData
        );

    } catch (error) {

        console.error(
            "Final Report Error:",
            error
        );


        /*
         * AbortError can happen when Firebase
         * request connection is cancelled.
         */

        if (
            error &&
            error.name === "AbortError"
        ) {

            setStatus(
                "Firebase request was cancelled. Please load again."
            );

            console.warn(
                "Firebase AbortError:",
                error
            );

            return;

        }


        setStatus(
            "Error: " +
            error.message
        );


        alert(
            "Final Report Error:\n\n" +
            error.message
        );

    }
}


// =====================================================
// SAVE REPORT
// =====================================================

async function saveFinalReport() {

    try {

        if (!reportData.month) {

            alert(
                "Please load the report first."
            );

            return;

        }


        /*
         * Make sure Final Sheet is based on
         * Final Meal Sheet before saving.
         */

        renderFinalSheet();


        const finalBody =
            document.getElementById(
                "finalBody"
            );


        const rows = [];


        Array.from(
            finalBody.querySelectorAll("tr")
        ).forEach(row => {

            const cells =
                row.querySelectorAll("td");


            if (cells.length < 10) {

                return;

            }


            rows.push({

                member:
                    cells[0].textContent,

                /*
                 * THIS IS THE SAME TOTAL MEAL
                 * THAT COMES FROM FINAL MEAL SHEET.
                 */

                totalMeal:
                    toNumber(
                        cells[1].textContent
                    ),

                extraMeal:
                    toNumber(
                        cells[2].textContent
                    ),

                mealRate:
                    cells[3].textContent,

                mealCharge:
                    cells[4].textContent,

                charges:
                    cells[5].textContent,

                establishment:
                    cells[6].textContent,

                totalExpenses:
                    cells[7].textContent,

                income:
                    cells[8].textContent,

                remarks:
                    cells[9].textContent

            });

        });


        const data = {

            month:
                reportData.month,

            regularExpense:
                reportData.regularExpense,

            riceExpense:
                reportData.riceExpense,

            monthlyExpense:
                reportData.monthlyExpense,

            masiCharge:
                reportData.masiCharge,

            totalMeal:
                reportData.totalMeal,

            mealRate:
                reportData.mealRate,

            establishmentTotal:
                reportData.establishmentTotal,

            establishmentPerMember:
                reportData.establishmentPerMember,

            members:
                rows,

            savedAt:
                Timestamp.now()

        };


        await setDoc(

            doc(
                db,
                "FinalReports",
                reportData.month
            ),

            data,

            {
                merge: true
            }

        );


        setStatus(
            "Final Report Saved Successfully"
        );


        alert(
            "Final Report saved successfully."
        );

    } catch (error) {

        console.error(
            "Save Error:",
            error
        );


        alert(
            "Save Error:\n\n" +
            error.message
        );

    }
}


// =====================================================
// EVENT LISTENERS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // =============================================
        // MONTH
        // =============================================

        const monthInput =
            document.getElementById(
                "reportMonth"
            );


        if (monthInput) {

            const today =
                new Date();


            monthInput.value =
                today.getFullYear() +
                "-" +
                String(
                    today.getMonth() + 1
                ).padStart(2, "0");

        }


        // =============================================
        // LOAD REPORT
        // =============================================

        const loadButton =
            document.getElementById(
                "loadReport"
            );


        if (loadButton) {

            loadButton.addEventListener(
                "click",
                loadFinalReport
            );

        }


        // =============================================
        // ADD GUEST
        // =============================================

        const guestButton =
            document.getElementById(
                "addGuest"
            );


        if (guestButton) {

            guestButton.addEventListener(
                "click",
                addGuest
            );

        }


        // =============================================
        // SAVE REPORT
        // =============================================

        const saveButton =
            document.getElementById(
                "saveReport"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveFinalReport
            );

        }


        // =============================================
        // BONUS MEAL
        // =============================================

        const bonusMeal =
            document.getElementById(
                "bonusMeal"
            );


        if (bonusMeal) {

            bonusMeal.addEventListener(
                "change",
                () => {

                    const display =
                        document.getElementById(
                            "bonusMealDisplay"
                        );


                    if (display) {

                        display.textContent =
                            bonusMeal.value;

                    }


                    if (
                        reportData.month
                    ) {

                        handleBonusMealChange();

                    }

                }
            );

        }


        // =============================================
        // MASI MEAL CHARGE
        // =============================================

        const masiInput =
            document.getElementById(
                "masiMealCharge"
            );


        if (masiInput) {

            masiInput.addEventListener(
                "input",
                () => {

                    if (
                        reportData.month
                    ) {

                        reportData.masiCharge =
                            toNumber(
                                masiInput.value
                            );


                        reportData.mealRate =
                            calculateMealRate();


                        renderRegularTable();

                        renderExtraTable();

                        renderGuestTable();

                        renderFinalMealTable();

                        renderFinalSheet();

                    }

                }
            );

        }


        // =============================================
        // TOTAL MEAL
        // =============================================

        const totalMealInput =
            document.getElementById(
                "totalMeal"
            );


        if (totalMealInput) {

            totalMealInput.addEventListener(
                "input",
                () => {

                    if (
                        !reportData.month
                    ) {

                        return;

                    }


                    reportData.totalMeal =
                        toNumber(
                            totalMealInput.value
                        );


                    reportData.mealRate =
                        calculateMealRate();


                    renderRegularTable();

                    renderExtraTable();

                    renderGuestTable();

                    renderFinalMealTable();

                    renderFinalSheet();

                }
            );

        }

    }
);