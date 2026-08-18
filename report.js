import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("Monthly Report Script Started");


// =====================================================
// ELEMENTS
// =====================================================

const table = document.getElementById("report");
const monthInput = document.getElementById("reportMonth");
const loadButton = document.getElementById("load");


// =====================================================
// CURRENT MONTH
// =====================================================

monthInput.value =
    new Date().toISOString().slice(0, 7);


// =====================================================
// CREATE DAY HEADERS
// =====================================================

const header =
    table.querySelector("thead tr");


// Prevent duplicate headers

if (header.children.length === 2) {

    for (let i = 1; i <= 31; i++) {

        const th =
            document.createElement("th");

        th.textContent = i;

        header.appendChild(th);
    }


    const total =
        document.createElement("th");

    total.textContent = "Total";

    header.appendChild(total);
}


// =====================================================
// LOAD REPORT
// =====================================================

loadButton.addEventListener(
    "click",
    loadReport
);


// =====================================================
// LOAD REPORT FUNCTION
// =====================================================

async function loadReport() {

    const tbody =
        document.querySelector("#report tbody");

    tbody.innerHTML = "";


    const selectedMonth =
        monthInput.value;


    if (!selectedMonth) {

        alert("Please select month.");

        return;
    }


    console.log(
        "Loading month:",
        selectedMonth
    );


    try {

        // =================================================
        // GET ATTENDANCE COLLECTION
        // =================================================

        const snapshot =
            await getDocs(
                collection(db, "Attendance")
            );


        console.log(
            "Attendance documents:",
            snapshot.size
        );


        // =================================================
        // REPORT OBJECT
        // =================================================

        const report = {};


        // =================================================
        // READ EACH DOCUMENT
        //
        // Document ID = DATE
        //
        // Example:
        // 2026-08-10
        // =================================================

        snapshot.forEach(docSnap => {

            const documentId =
                docSnap.id;


            // Only selected month

            if (
                !documentId.startsWith(
                    selectedMonth + "-"
                )
            ) {

                return;
            }


            // Get day number

            const parts =
                documentId.split("-");


            if (parts.length !== 3) {

                return;
            }


            const dayNo =
                Number(parts[2]);


            if (
                dayNo < 1 ||
                dayNo > 31
            ) {

                return;
            }


            const data =
                docSnap.data();


            // =================================================
            // READ MEMBERS
            // =================================================

            for (const name of Object.keys(data)) {

                // Ignore Firebase special fields

                if (
                    name === "date" ||
                    name === "extraMeals" ||
                    name === "totalMeal"
                ) {

                    continue;
                }


                // Make sure it is attendance data

                if (
                    !data[name] ||
                    typeof data[name] !== "object"
                ) {

                    continue;
                }


                // =================================================
                // CREATE MEMBER
                // =================================================

                if (!report[name]) {

                    report[name] = {

                        day:
                            Array(31).fill("X"),

                        night:
                            Array(31).fill("X")

                    };

                }


                // =================================================
                // DAY
                // =================================================

                if (
                    data[name].day === true
                ) {

                    report[name]
                        .day[dayNo - 1] = "✓";

                } else {

                    report[name]
                        .day[dayNo - 1] = "X";

                }


                // =================================================
                // NIGHT
                // =================================================

                if (
                    data[name].night === true
                ) {

                    report[name]
                        .night[dayNo - 1] = "✓";

                } else {

                    report[name]
                        .night[dayNo - 1] = "X";

                }

            }

        });


        // =================================================
        // NO DATA
        // =================================================

        const names =
            Object.keys(report);


        if (names.length === 0) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="34"
                        style="padding:15px;"
                    >

                        No attendance found
                        for ${selectedMonth}

                    </td>

                </tr>

            `;

            console.log(
                "No attendance found."
            );

            return;
        }


        // =================================================
        // DISPLAY MEMBERS
        // =================================================

        names.forEach(name => {

            let dayRow =
                `<tr>
                    <td>${name}</td>
                    <td>Day</td>`;


            let nightRow =
                `<tr>
                    <td></td>
                    <td>Night</td>`;


            let totalAttendance = 0;


            // =================================================
            // DAY CELLS
            // =================================================

            report[name].day.forEach(value => {

                if (value === "✓") {

                    totalAttendance++;

                }


                dayRow +=
                    `<td>${value}</td>`;

            });


            // =================================================
            // NIGHT CELLS
            // =================================================

            report[name].night.forEach(value => {

                if (value === "✓") {

                    totalAttendance++;

                }


                nightRow +=
                    `<td>${value}</td>`;

            });


            // =================================================
            // TOTAL
            // =================================================

            dayRow += `

                <td rowspan="2">

                    ${totalAttendance}

                </td>

            </tr>`;


            nightRow += `

            </tr>`;


            // =================================================
            // ADD TO TABLE
            // =================================================

            tbody.innerHTML +=
                dayRow + nightRow;

        });


        console.log(
            "Monthly report loaded successfully."
        );


    } catch (error) {

        console.error(
            "Monthly Report Error:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="34"
                    style="color:red;padding:15px;"
                >

                    Report Error:
                    ${error.message}

                </td>

            </tr>

        `;

    }

}


// =====================================================
// AUTO LOAD CURRENT MONTH
// =====================================================

loadReport();