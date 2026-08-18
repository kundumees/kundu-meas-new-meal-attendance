import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("Total Meal Report JS Started");


// =====================================================
// ELEMENTS
// =====================================================

const monthInput =
    document.getElementById("reportMonth");

const loadButton =
    document.getElementById("loadReport");

const mealList =
    document.getElementById("totalMealList");

const monthDayMeal =
    document.getElementById("monthDayMeal");

const monthNightMeal =
    document.getElementById("monthNightMeal");

const monthTotalMeal =
    document.getElementById("monthTotalMeal");

const footerDay =
    document.getElementById("footerDay");

const footerNight =
    document.getElementById("footerNight");

const footerTotal =
    document.getElementById("footerTotal");


// =====================================================
// CURRENT MONTH
// =====================================================

const today = new Date();

const currentMonth =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0");

monthInput.value = currentMonth;


// =====================================================
// LOAD BUTTON
// =====================================================

loadButton.addEventListener(
    "click",
    loadTotalMealReport
);


// =====================================================
// LOAD REPORT
// =====================================================

async function loadTotalMealReport() {

    console.log("Loading Total Meal Report");


    const selectedMonth =
        monthInput.value;


    if (!selectedMonth) {

        alert("Please select a month.");

        return;
    }


    // =================================================
    // RESET SCREEN
    // =================================================

    mealList.innerHTML = "";

    monthDayMeal.textContent = "0";

    monthNightMeal.textContent = "0";

    monthTotalMeal.textContent = "0";

    footerDay.textContent = "0";

    footerNight.textContent = "0";

    footerTotal.textContent = "0";


    try {

        loadButton.disabled = true;

        loadButton.textContent =
            "⏳ Loading...";


        // =================================================
        // FIRESTORE
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
        // MONTH TOTAL
        // =================================================

        let totalDay = 0;

        let totalNight = 0;

        let totalMeal = 0;


        // =================================================
        // DATE DATA
        // =================================================

        const dates = [];


        // =================================================
        // READ ATTENDANCE
        // =================================================

        snapshot.forEach(docSnap => {

            const date =
                docSnap.id;


            // Only selected month

            if (
                !date.startsWith(
                    selectedMonth + "-"
                )
            ) {

                return;
            }


            const data =
                docSnap.data();


            // =================================================
            // GET TOTAL MEAL
            // =================================================

            let day = 0;

            let night = 0;

            let total = 0;


            // =================================================
            // NEW FORMAT
            //
            // totalMeal: {
            //     day: 5,
            //     night: 4,
            //     total: 9
            // }
            // =================================================

            if (
                data.totalMeal &&
                typeof data.totalMeal === "object"
            ) {

                day =
                    Number(
                        data.totalMeal.day
                    ) || 0;


                night =
                    Number(
                        data.totalMeal.night
                    ) || 0;


                total =
                    Number(
                        data.totalMeal.total
                    ) || 0;

            }


            // =================================================
            // FALLBACK
            //
            // If totalMeal.total is missing,
            // calculate from day + night
            // =================================================

            if (total === 0 && (day > 0 || night > 0)) {

                total =
                    day + night;

            }


            // =================================================
            // ADD MONTH TOTAL
            // =================================================

            totalDay += day;

            totalNight += night;

            totalMeal += total;


            // =================================================
            // SAVE DATE
            // =================================================

            dates.push({

                date: date,

                day: day,

                night: night,

                total: total

            });

        });


        // =================================================
        // SORT DATE
        // =================================================

        dates.sort(
            (a, b) =>
                a.date.localeCompare(b.date)
        );


        // =================================================
        // NO DATA
        // =================================================

        if (dates.length === 0) {

            mealList.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        style="text-align:center;padding:15px;"
                    >

                        ❌ No meal data found
                        for ${selectedMonth}

                    </td>

                </tr>

            `;


            console.log(
                "No meal data found."
            );

            return;
        }


        // =================================================
        // DATE-WISE TABLE
        // =================================================

        dates.forEach(item => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${item.date}
                </td>

                <td>
                    ${item.day}
                </td>

                <td>
                    ${item.night}
                </td>

                <td>
                    <strong>
                        ${item.total}
                    </strong>
                </td>

            `;


            mealList.appendChild(row);

        });


        // =================================================
        // SHOW MONTH TOTAL
        // =================================================

        monthDayMeal.textContent =
            totalDay;


        monthNightMeal.textContent =
            totalNight;


        monthTotalMeal.textContent =
            totalMeal;


        // =================================================
        // FOOTER TOTAL
        // =================================================

        footerDay.textContent =
            totalDay;


        footerNight.textContent =
            totalNight;


        footerTotal.textContent =
            totalMeal;


        // =================================================
        // CONSOLE
        // =================================================

        console.log(
            "TOTAL MEAL REPORT:",
            {
                month: selectedMonth,

                totalDay: totalDay,

                totalNight: totalNight,

                totalMeal: totalMeal
            }
        );


    } catch (error) {

        console.error(
            "Total Meal Report Error:",
            error
        );


        mealList.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="color:red;text-align:center;padding:15px;"
                >

                    ❌ Error:
                    ${error.message}

                </td>

            </tr>

        `;

    } finally {

        loadButton.disabled = false;

        loadButton.textContent =
            "📊 Load Total Meal Report";

    }

}


// =====================================================
// AUTO LOAD CURRENT MONTH
// =====================================================

loadTotalMealReport();