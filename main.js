
let courses = [
  { title: "java", instructor: "ms. caro", duration: 20, enrollment: 100 },
  { title: "html", instructor: "ms. jenny", duration: 15, enrollment: 80 },
  { title: "css", instructor: "ms. cyrene", duration: 25, enrollment: 120 },
  { title: "python", instructor: "ms. maj", duration: 30, enrollment: 150 }
];


function getTotalEnrollment(courses) {
  return courses.reduce((sum, c) => sum + c.enrollment, 0);
}


function filterByInstructor(courses, instructorName) {
  return courses.filter(c => c.instructor === instructorName);
}

function findLongestCourse(courses) {
  return courses.reduce((max, c) => c.duration > max.duration ? c : max, courses[0]);
}

function groupByDuration(courses) {
  const groups = { short: [], medium: [], long: [] };
  courses.forEach(c => {
    if (c.duration <= 15) groups.short.push(c);
    else if (c.duration <= 25) groups.medium.push(c);
    else groups.long.push(c);
  });
  return groups;
}

function fetchNewCourses() {
  return new Promise(resolve => {
    setTimeout(() => {
      const newCourses = [
        { title: "Machine Learning", instructor: "Diana", duration: 40, enrollment: 200 },
        { title: "UI/UX Design", instructor: "Eve", duration: 10, enrollment: 60 }
      ];
      resolve(newCourses);
    }, 2000);
  });
}


console.log("Total Enrollment:", getTotalEnrollment(courses));

console.log("Courses by Alice:", filterByInstructor(courses, "Alice"));

console.log("Longest Course:", findLongestCourse(courses));

console.log("Grouped by Duration:", groupByDuration(courses));

fetchNewCourses().then(newCourses => {
  courses = courses.concat(newCourses);
  console.log("After Fetching New Courses:", courses);
});
