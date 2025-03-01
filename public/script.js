$(document).ready(function () {
  const BASE_URL = "http://localhost:3000"; 

  /** Load Courses into Dropdown **/
  function loadCourses() {
    $.ajax({
      url: `${BASE_URL}/courses`,
      method: "GET",
      dataType: "json",
      success: function (courses) {
        $("#course").empty().append('<option selected value="">Choose Course</option>');
        $.each(courses, function (_, course) {
          $("#course").append(`<option value="${course.id}">${course.display}</option>`);
        });
      },
      error: function () {
        console.error("Failed to fetch courses.");
      }
    });
  }

  /** Load Logs for Selected Course & UVU ID **/
  function loadLogs(courseId, uvuId) {
    $.ajax({
      url: `${BASE_URL}/logs`,
      method: "GET",
      data: { courseId, uvuId },
      dataType: "json",
      success: function (logs) {
        $("#uvuIdDisplay").text(`Student Logs for ${uvuId}`);
        const logList = $("ul[data-cy='logs']").empty();
        $.each(logs, function (_, log) {
          logList.append(`
            <li class="list-group-item">
              <div><small>${log.date}</small></div>
              <pre class="d-none"><p>${log.text}</p></pre>
            </li>
          `);
        });
      },
      error: function () {
        $("ul[data-cy='logs']").html('<li class="text-danger">Error fetching logs.</li>');
      }
    });
  }

  /** Course Selection Event **/
  $("#course").on("change", function () {
    const courseSelected = $(this).val() !== "";
    $("#uvuId").prop("disabled", !courseSelected);
  });

  /** UVU ID Input Event **/
  $("#uvuId").on("input", function () {
    let inputVal = $(this).val().replace(/\D/g, "").slice(0, 8);
    $(this).val(inputVal);

    if (inputVal.length === 8) {
      loadLogs($("#course").val(), inputVal);
    } else {
      $("ul[data-cy='logs']").empty();
    }
  });

  /** Log Entry Click (Toggle Visibility) **/
  $("ul[data-cy='logs']").on("click", "li", function () {
    $(this).find("pre").toggleClass("d-none");
  });

  /** Enable/Disable Add Log Button **/
  $("textarea[data-cy='log_textarea']").on("input", function () {
    $("#add_log_btn").prop("disabled", $(this).val().trim() === "");
  });

  /** Submit New Log **/
  $("#add_log_btn").on("click", function (event) {
    event.preventDefault();
    if ($(this).prop("disabled")) return;

    const newLog = {
      courseId: $("#course").val(),
      uvuId: $("#uvuId").val(),
      text: $("textarea[data-cy='log_textarea']").val().trim(),
      date: new Date().toLocaleString()
    };

    $.ajax({
      url: `${BASE_URL}/logs`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(newLog),
      success: function () {
        $("textarea[data-cy='log_textarea']").val("");
        $("#add_log_btn").prop("disabled", true);
        loadLogs(newLog.courseId, newLog.uvuId);
      },
      error: function () {
        console.error("Error adding log.");
      }
    });
  });

  /** Bootstrap Dark Mode (No Custom CSS) **/
  const themeToggle = $("#themeSwitch");
  themeToggle.on("change", function () {
    $("body").toggleClass("bg-dark text-light", $(this).prop("checked"));
    $(".form-control, .list-group-item").toggleClass("bg-dark text-light border-secondary", $(this).prop("checked"));
    localStorage.setItem("theme", $(this).prop("checked") ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    themeToggle.prop("checked", true).trigger("change");
  }

  loadCourses(); // Load courses on page load
});
