// =====================================================
// RICE EXPENSES
// KUNDU MEES
// =====================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


console.log("Rice JS Started");


// =====================================================
// ELEMENTS
// =====================================================

const riceDate =
    document.getElementById("riceDate");

const riceAmount =
    document.getElementById("riceAmount");

const riceRemarks =
    document.getElementById("riceRemarks");

const saveRice =
    document.getElementById("saveRice");

const riceMonth =
    document.getElementById("riceMonth");

const loadRice =
    document.getElementById("loadRice");

const riceBody =
    document.getElementById("riceBody");

const riceTotal =
    document.getElementById("riceTotal");

const status =
    document.getElementById("status");


// =====================================================
// TODAY
// =====================================================

function getToday() {

    const d = new Date();

    const year =
        d.getFullYear();

    const month =
        String(d.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(d.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


const today = getToday();


// Default date

riceDate.value = today;


// Default month

riceMonth.value =
    today.slice(0, 7);


// =====================================================
// SAVE RICE
// =====================================================

saveRice.addEventListener(
    "click",
    async function () {

        const date =
            riceDate.value;

        const amount =
            Number(riceAmount.value);

        const remarks =
            riceRemarks.value.trim();


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!date) {

            alert(
                "Please select date."
            );

            return;
        }


        if (
            !amount ||
            amount <= 0
        ) {

            alert(
                "Please enter valid Rice amount."
            );

            return;
        }


        try {

            saveRice.disabled = true;

            saveRice.textContent =
                "⏳ Saving...";

            status.textContent =
                "Saving Rice expense...";


            // -------------------------------------------------
            // FIRESTORE
            // -------------------------------------------------

            await addDoc(
                collection(
                    db,
                    "RiceExpenses"
                ),
                {

                    date: date,

                    amount: amount,

                    remarks: remarks,

                    createdAt:
                        new Date()

                }
            );


            console.log(
                "Rice saved:",
                date,
                amount
            );


            alert(
                "Rice Expense Saved Successfully ✅"
            );


            // Clear amount

            riceAmount.value = "";

            riceRemarks.value = "";


            // Reload selected month

            riceMonth.value =
                date.slice(0, 7);

            await loadRiceReport();


            status.textContent =
                "Rice expense saved successfully ✅";


        }

        catch (error) {

            console.error(
                "Rice Save Error:",
                error
            );


            status.textContent =
                "Save failed ❌";


            alert(
                "Rice Save Failed:\n" +
                error.message
            );

        }


        finally {

            saveRice.disabled = false;

            saveRice.textContent =
                "💾 Save Rice Expense";

        }

    }
);


// =====================================================
// LOAD BUTTON
// =====================================================

loadRice.addEventListener(
    "click",
    loadRiceReport
);


// =====================================================
// LOAD RICE REPORT
// =====================================================

async function loadRiceReport() {

    const selectedMonth =
        riceMonth.value;


    if (!selectedMonth) {

        alert(
            "Please select month."
        );

        return;
    }


    riceBody.innerHTML = `

        <tr>

            <td colspan="3">
                Loading...
            </td>

        </tr>

    `;


    riceTotal.textContent =
        "₹0.00";


    try {

        // -------------------------------------------------
        // FIRESTORE QUERY
        // -------------------------------------------------

        const startDate =
            selectedMonth + "-01";


        const nextMonth =
            getNextMonth(selectedMonth);


        const endDate =
            nextMonth + "-01";


        const q =
            query(

                collection(
                    db,
                    "RiceExpenses"
                ),

                where(
                    "date",
                    ">=",
                    startDate
                ),

                where(
                    "date",
                    "<",
                    endDate
                ),

                orderBy(
                    "date",
                    "asc"
                )

            );


        const snapshot =
            await getDocs(q);


        console.log(
            "Rice documents:",
            snapshot.size
        );


        riceBody.innerHTML = "";


        let total = 0;


        // -------------------------------------------------
        // NO DATA
        // -------------------------------------------------

        if (
            snapshot.empty
        ) {

            riceBody.innerHTML = `

                <tr>

                    <td colspan="3">

                        No Rice expense found
                        for ${selectedMonth}

                    </td>

                </tr>

            `;

            riceTotal.textContent =
                "₹0.00";

            return;
        }


        // -------------------------------------------------
        // DISPLAY
        // -------------------------------------------------

        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const amount =
                    Number(data.amount) || 0;


                total += amount;


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${data.date || "-"}
                    </td>

                    <td>
                        ₹${amount.toFixed(2)}
                    </td>

                    <td>
                        ${data.remarks || "-"}
                    </td>

                `;


                riceBody.appendChild(row);

            }
        );


        // -------------------------------------------------
        // TOTAL
        // -------------------------------------------------

        riceTotal.textContent =
            "₹" + total.toFixed(2);


        console.log(
            "Rice Monthly Total:",
            total
        );


    }

    catch (error) {

        console.error(
            "Rice Report Error:",
            error
        );


        riceBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    style="color:red;"
                >

                    Error:
                    ${error.message}

                </td>

            </tr>

        `;

    }

}


// =====================================================
// NEXT MONTH
// =====================================================

function getNextMonth(month) {

    const parts =
        month.split("-");


    let year =
        Number(parts[0]);

    let monthNumber =
        Number(parts[1]);


    monthNumber++;


    if (monthNumber > 12) {

        monthNumber = 1;

        year++;

    }


    return (
        year +
        "-" +
        String(monthNumber)
            .padStart(2, "0")
    );

}


// =====================================================
// AUTO LOAD
// =====================================================

loadRiceReport();


console.log(
    "Rice JS Finished"
);