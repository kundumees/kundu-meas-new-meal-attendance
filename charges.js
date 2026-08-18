// =====================================================
// FIREBASE
// =====================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// =====================================================
// MEMBERS
// =====================================================

const MEMBERS = [
    "Ramu", "Nabin", "Sovon", "Suman", "Riman", "Dipankar",
    "Krishna", "Pradip", "Santu", "Madhav", "Deep", "Mohit",
    "Suman 2", "Surojit", "Bikash", "Riju"
];


// =====================================================
// DOM ELEMENT SELECTORS
// =====================================================

const chargeMonthInput =
    document.getElementById("chargeMonth");

const loadChargesBtn =
    document.getElementById("loadCharges");

const memberSelect =
    document.getElementById("member");

const fineAmountInput =
    document.getElementById("fineAmount");

const chargeTypeSelect =
    document.getElementById("chargeType");

const chargeAmountInput =
    document.getElementById("chargeAmount");

const saveChargeBtn =
    document.getElementById("saveCharge");

const chargesBody =
    document.getElementById("chargesBody");

const summaryBody =
    document.getElementById("summaryBody");

const grandTotalEl =
    document.getElementById("grandTotal");


// =====================================================
// INITIALIZE APPLICATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadMonthlyData();

    loadChargesBtn.addEventListener(
        "click",
        loadMonthlyData
    );

    saveChargeBtn.addEventListener(
        "click",
        handleSaveCharge
    );

    chargeMonthInput.addEventListener(
        "change",
        loadMonthlyData
    );

});


// =====================================================
// LOCAL STORAGE KEY
// =====================================================

function getStorageKey() {

    return `kundu_mess_charges_${chargeMonthInput.value}`;

}


// =====================================================
// GET LOCAL STORAGE DATA
// =====================================================

function getChargesData() {

    const data =
        localStorage.getItem(
            getStorageKey()
        );

    return data
        ? JSON.parse(data)
        : [];

}


// =====================================================
// SAVE LOCAL STORAGE DATA
// =====================================================

function saveChargesData(data) {

    localStorage.setItem(
        getStorageKey(),
        JSON.stringify(data)
    );

}


// =====================================================
// LOAD MONTHLY DATA
// =====================================================

function loadMonthlyData() {

    const records =
        getChargesData();

    renderLedger(records);

    renderSummary(records);

}


// =====================================================
// RENDER CHARGES LEDGER
// =====================================================

function renderLedger(records) {

    chargesBody.innerHTML = "";

    if (records.length === 0) {

        chargesBody.innerHTML = `
            <tr>
                <td
                    colspan="3"
                    style="
                        color:#666;
                        font-style:italic;
                    "
                >
                    No charges recorded for this month.
                </td>
            </tr>
        `;

        return;
    }


    records.forEach((record, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                <b>${record.member}</b>
            </td>

            <td>
                ${record.reason}
            </td>

            <td>
                ₹${Number(record.amount).toFixed(2)}
            </td>
        `;


        chargesBody.appendChild(row);

    });

}


// =====================================================
// RENDER MEMBER SUMMARY
// =====================================================

function renderSummary(records) {

    summaryBody.innerHTML = "";

    let overallGrandTotal = 0;


    const summaryMap = {};


    MEMBERS.forEach(member => {

        summaryMap[member] = {
            logs: [],
            total: 0
        };

    });


    records.forEach(record => {

        if (summaryMap[record.member]) {

            summaryMap[
                record.member
            ].logs.push(
                `${record.reason} (₹${record.amount})`
            );


            summaryMap[
                record.member
            ].total +=
                Number(record.amount);


            overallGrandTotal +=
                Number(record.amount);

        }

    });


    MEMBERS.forEach(member => {

        const row =
            document.createElement("tr");


        const details =
            summaryMap[member].logs.length > 0
                ? summaryMap[member].logs.join(", ")
                : "—";


        const sum =
            summaryMap[member].total;


        row.innerHTML = `

            <td>
                ${member}
            </td>

            <td>
                <small>
                    ${details}
                </small>
            </td>

            <td
                class="${
                    sum > 0
                        ? "total-active"
                        : ""
                }"
            >
                <b>
                    ₹${sum.toFixed(2)}
                </b>
            </td>

        `;


        summaryBody.appendChild(row);

    });


    grandTotalEl.textContent =
        `₹${overallGrandTotal.toFixed(2)}`;

}


// =====================================================
// SAVE CHARGE
// =====================================================

async function handleSaveCharge() {

    const selectedMember =
        memberSelect.value;


    const fineVal =
        parseFloat(
            fineAmountInput.value
        );


    const chargeType =
        chargeTypeSelect.value;


    const chargeVal =
        parseFloat(
            chargeAmountInput.value
        );


    // =================================================
    // MEMBER VALIDATION
    // =================================================

    if (!selectedMember) {

        alert(
            "Please select a member first!"
        );

        return;

    }


    // =================================================
    // CURRENT LOCAL RECORDS
    // =================================================

    const currentRecords =
        getChargesData();


    let entryCreated = false;


    // =================================================
    // FINE
    // =================================================

    if (
        !isNaN(fineVal) &&
        fineVal > 0
    ) {

        const fineRecord = {

            member:
                selectedMember,

            reason:
                "Fine Penalty",

            amount:
                fineVal

        };


        // ---------------------------------------------
        // LOCAL STORAGE
        // ---------------------------------------------

        currentRecords.push(
            fineRecord
        );


        // ---------------------------------------------
        // FIREBASE
        // Collection = Charges
        // Document ID = AUTO GENERATED
        // ---------------------------------------------

        try {

            await addDoc(
                collection(
                    db,
                    "Charges"
                ),
                {
                    member:
                        selectedMember,

                    reason:
                        "Fine Penalty",

                    chargeType:
                        "Fine Penalty",

                    chargeAmount:
                        fineVal,

                    amount:
                        fineVal,

                    month:
                        chargeMonthInput.value,

                    savedAt:
                        serverTimestamp()
                }
            );


            console.log(
                "Fine saved to Firebase"
            );

        } catch (error) {

            console.error(
                "Firebase Fine Save Error:",
                error
            );


            alert(
                "Firebase Fine Save Error:\n\n" +
                error.message
            );


            return;

        }


        entryCreated = true;

    }


    // =================================================
    // OTHER CHARGE
    // =================================================

    if (
        chargeType &&
        !isNaN(chargeVal) &&
        chargeVal > 0
    ) {

        const chargeRecord = {

            member:
                selectedMember,

            reason:
                chargeType,

            amount:
                chargeVal

        };


        // ---------------------------------------------
        // LOCAL STORAGE
        // ---------------------------------------------

        currentRecords.push(
            chargeRecord
        );


        // ---------------------------------------------
        // FIREBASE
        // Collection = Charges
        // Document ID = AUTO GENERATED
        // ---------------------------------------------

        try {

            await addDoc(
                collection(
                    db,
                    "Charges"
                ),
                {
                    member:
                        selectedMember,

                    reason:
                        chargeType,

                    chargeType:
                        chargeType,

                    chargeAmount:
                        chargeVal,

                    amount:
                        chargeVal,

                    month:
                        chargeMonthInput.value,

                    savedAt:
                        serverTimestamp()
                }
            );


            console.log(
                "Charge saved to Firebase"
            );

        } catch (error) {

            console.error(
                "Firebase Charge Save Error:",
                error
            );


            alert(
                "Firebase Charge Save Error:\n\n" +
                error.message
            );


            return;

        }


        entryCreated = true;

    }


    // =================================================
    // NOTHING ENTERED
    // =================================================

    if (!entryCreated) {

        alert(
            "Please enter a valid fine amount OR choose a charge type with its respective amount."
        );

        return;

    }


    // =================================================
    // SAVE LOCAL STORAGE
    // =================================================

    saveChargesData(
        currentRecords
    );


    // =================================================
    // REFRESH SUMMARY
    // =================================================

    loadMonthlyData();


    // =================================================
    // CLEAR INPUTS
    // =================================================

    clearInputs();


    alert(
        "Charge saved successfully to Firebase!"
    );

}


// =====================================================
// CLEAR INPUTS
// =====================================================

function clearInputs() {

    memberSelect.value = "";

    fineAmountInput.value = "";

    chargeTypeSelect.value = "";

    chargeAmountInput.value = "";

}

