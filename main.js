// Sample courses data
let courses = [
  { title: "java", instructor: "caro, ashlie", duration: 20, enrollment: 100 },
  { title: "html", instructor: "jenny getalado", duration: 15, enrollment: 80 },
  { title: "css", instructor: "cyrene ramirez", duration: 25, enrollment: 120 },
  { title: "python", instructor: "maj mahilum", duration: 30, enrollment: 150 }
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

