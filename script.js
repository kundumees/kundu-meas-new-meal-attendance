import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("SCRIPT STARTED");

// =====================================================
// GET ELEMENTS
// =====================================================

const dateInput = document.getElementById("attendanceDate");
const attendanceTable = document.getElementById("attendanceTable");

const totalDayMeal = document.getElementById("totalDayMeal");
const totalNightMeal = document.getElementById("totalNightMeal");
const totalMeal = document.getElementById("totalMeal");

const extraMember = document.getElementById("extraMember");
const extraTime = document.getElementById("extraTime");
const extraQuantity = document.getElementById("extraQuantity");
const extraMeal = document.getElementById("extraMeal");

const addExtra = document.getElementById("addExtra");
const extraList = document.getElementById("extraList");
const saveButton = document.getElementById("save");


// =====================================================
// CHECK
// =====================================================

console.log("Date:", dateInput);
console.log("Attendance table:", attendanceTable);
console.log(
    "Buttons:",
    document.querySelectorAll("#attendanceTable .toggle").length
);
console.log("Save:", saveButton);
console.log("Add Extra:", addExtra);


// =====================================================
// TODAY
// =====================================================

function getToday() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const day =
        String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const today = getToday();

dateInput.value = today;
dateInput.max = today;


// =====================================================
// VARIABLES
// =====================================================

let isAdmin = false;

let extraMeals = [];


// =====================================================
// TOTAL MEAL
// =====================================================

function updateTotalMeal() {

    let day = 0;
    let night = 0;


    // Regular attendance

    const buttons =
        attendanceTable.querySelectorAll(".toggle");


    buttons.forEach((button, index) => {

        const row = button.closest("tr");

        if (!row) return;


        const cells = row.children;

        if (cells.length < 3) return;


        // Day button
        if (
            button ===
            cells[1].querySelector(".toggle")
        ) {

            if (
                button.textContent.trim() === "✅"
            ) {

                day++;

            }

        }


        // Night button
        if (
            button ===
            cells[2].querySelector(".toggle")
        ) {

            if (
                button.textContent.trim() === "✅"
            ) {

                night++;

            }

        }

    });


    // Extra meal

    extraMeals.forEach(item => {

        const quantity =
            Number(item.quantity) || 0;


        if (item.time === "day") {

            day += quantity;

        }

        if (item.time === "night") {

            night += quantity;

        }

    });


    const total = day + night;


    // Update HTML

    totalDayMeal.textContent = day;

    totalNightMeal.textContent = night;

    totalMeal.textContent = total;


    console.log(
        "TOTAL:",
        {
            day,
            night,
            total
        }
    );


    return {
        day,
        night,
        total
    };
}


// =====================================================
// ATTENDANCE BUTTONS
// =====================================================

document
    .querySelectorAll("#attendanceTable .toggle")
    .forEach(button => {

        button.addEventListener("click", function () {

            if (
                this.textContent.trim() === "❌"
            ) {

                this.textContent = "✅";

            } else {

                this.textContent = "❌";

            }


            updateTotalMeal();

        });

    });


console.log("Attendance buttons ready.");


// =====================================================
// RENDER EXTRA
// =====================================================

function renderExtraMeals() {

    extraList.innerHTML = "";


    extraMeals.forEach((item, index) => {

        const row =
            document.createElement("tr");


        let mealName = item.meal;

        if (item.meal === "egg") {
            mealName = "🥚 Egg";
        }

        if (item.meal === "fish") {
            mealName = "🐟 Fish";
        }

        if (item.meal === "chicken") {
            mealName = "🍗 Chicken";
        }


        const timeName =
            item.time === "day"
                ? "🌞 Day"
                : "🌙 Night";


        row.innerHTML = `
            <td>${item.member}</td>
            <td>${timeName}</td>
            <td>${item.quantity}</td>
            <td>${mealName}</td>
            <td>
                <button
                    type="button"
                    class="removeExtra">
                    🗑️ Remove
                </button>
            </td>
        `;


        const removeButton =
            row.querySelector(".removeExtra");


        removeButton.addEventListener(
            "click",
            function () {

                extraMeals.splice(index, 1);

                renderExtraMeals();

                updateTotalMeal();

            }
        );


        extraList.appendChild(row);

    });

}


// =====================================================
// ADD EXTRA MEAL
// =====================================================

addExtra.addEventListener(
    "click",
    function () {

        const member =
            extraMember.value;

        const time =
            extraTime.value;

        const quantity =
            Number(extraQuantity.value);

        const meal =
            extraMeal.value;


        if (!member) {

            alert("Please select member.");

            return;

        }


        if (!time) {

            alert("Please select Day or Night.");

            return;

        }


        if (!quantity) {

            alert("Please select quantity.");

            return;

        }


        if (!meal) {

            alert("Please select meal.");

            return;

        }


        extraMeals.push({

            member: member,

            time: time,

            quantity: quantity,

            meal: meal

        });


        renderExtraMeals();

        updateTotalMeal();


        extraMember.value = "";

        extraTime.value = "";

        extraQuantity.value = "1";

        extraMeal.value = "";


        console.log(
            "Extra added:",
            extraMeals
        );

    }
);


// =====================================================
// GET ATTENDANCE
// =====================================================

function getAttendance() {

    const data = {};


    const rows =
        attendanceTable.querySelectorAll(
            "tbody tr"
        );


    rows.forEach(row => {

        const name =
            row.children[0]
                .textContent
                .trim();


        const dayButton =
            row.children[1]
                .querySelector(".toggle");


        const nightButton =
            row.children[2]
                .querySelector(".toggle");


        data[name] = {

            day:
                dayButton.textContent.trim() === "✅",

            night:
                nightButton.textContent.trim() === "✅"

        };

    });


    return data;
}


// =====================================================
// RESET
// =====================================================

function resetAttendance() {

    document
        .querySelectorAll("#attendanceTable .toggle")
        .forEach(button => {

            button.textContent = "❌";

        });

}


// =====================================================
// LOAD ATTENDANCE
// =====================================================

async function loadAttendance() {

    const date = dateInput.value;

    if (!date) return;


    try {

        resetAttendance();

        extraMeals = [];

        renderExtraMeals();

        updateTotalMeal();


        const ref =
            doc(
                db,
                "Attendance",
                date
            );


        const snap =
            await getDoc(ref);


        if (!snap.exists()) {

            console.log(
                "No data for:",
                date
            );

            return;

        }


        const data = snap.data();


        // Regular attendance

        const rows =
            attendanceTable.querySelectorAll(
                "tbody tr"
            );


        rows.forEach(row => {

            const name =
                row.children[0]
                    .textContent
                    .trim();


            if (!data[name]) return;


            const dayButton =
                row.children[1]
                    .querySelector(".toggle");


            const nightButton =
                row.children[2]
                    .querySelector(".toggle");


            dayButton.textContent =
                data[name].day
                    ? "✅"
                    : "❌";


            nightButton.textContent =
                data[name].night
                    ? "✅"
                    : "❌";

        });


        // Extra meals

        if (
            Array.isArray(data.extraMeals)
        ) {

            extraMeals =
                data.extraMeals.map(item => ({

                    member: item.member || "",

                    time: item.time || "",

                    quantity:
                        Number(item.quantity) || 0,

                    meal: item.meal || ""

                }));

        }


        renderExtraMeals();

        updateTotalMeal();


        console.log(
            "Loaded:",
            date
        );

    }

    catch (error) {

        console.error(
            "Load error:",
            error
        );

    }

}


// =====================================================
// DATE CHANGE
// =====================================================

dateInput.addEventListener(
    "change",
    async function () {

        if (
            !isAdmin &&
            this.value !== today
        ) {

            alert(
                "Only admin can edit previous dates."
            );

            this.value = today;

        }


        await loadAttendance();

    }
);


// =====================================================
// SAVE
// =====================================================

saveButton.addEventListener(
    "click",
    async function () {

        const date =
            dateInput.value;


        if (!date) {

            alert("Please select date.");

            return;

        }


        if (
            !isAdmin &&
            date !== today
        ) {

            alert(
                "Only admin can save previous dates."
            );

            return;

        }


        try {

            saveButton.disabled = true;

            saveButton.textContent =
                "⏳ Saving...";


            const attendance =
                getAttendance();


            const total =
                updateTotalMeal();


            const data = {

                date: date,

                ...attendance,

                extraMeals: extraMeals,

                totalMeal: {

                    day: total.day,

                    night: total.night,

                    total: total.total

                }

            };


            // IMPORTANT:
            // Document ID = DATE

            const ref =
                doc(
                    db,
                    "Attendance",
                    date
                );


            await setDoc(
                ref,
                data
            );


            console.log(
                "Saved successfully:",
                date
            );


            alert(
                "Attendance Saved Successfully ✅"
            );

        }

        catch (error) {

            console.error(
                "Save error:",
                error
            );


            alert(
                "Save failed: " +
                error.message
            );

        }

        finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "💾 Save Attendance";

        }

    }
);


// =====================================================
// ADMIN CHECK
// =====================================================

auth.onAuthStateChanged(
    async function (user) {

        isAdmin = false;


        if (!user) {

            console.log(
                "No User Login"
            );

            await loadAttendance();

            return;

        }


        try {

            const adminRef =
                doc(
                    db,
                    "admins",
                    user.uid
                );


            const adminSnap =
                await getDoc(adminRef);


            if (adminSnap.exists()) {

                isAdmin = true;

                dateInput.removeAttribute("max");

                console.log(
                    "Admin Login"
                );

            } else {

                console.log(
                    "Normal User"
                );

            }

        }

        catch (error) {

            console.error(
                "Admin check error:",
                error
            );

        }


        await loadAttendance();

    }
);


// =====================================================
// FIRST TOTAL
// =====================================================

updateTotalMeal();

console.log("SCRIPT FINISHED");