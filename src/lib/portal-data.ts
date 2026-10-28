export type Assignment = { id: string; subject: string; className: string; teacher: string; initials: string; color: string; students: number; room: string };
export type Review = { id: string; title: string; assignmentId: string; status: "Awaiting review" | "Changes requested" | "Approved"; body: string; comments: { author: string; text: string }[] };
export type Meeting = { id: string; title: string; date: string; time: string; department: string; agenda: string; link: string; attending: boolean; minutes: string };
export type PortalData = { assignments: Assignment[]; reviews: Review[]; meetings: Meeting[]; notices: { id: string; title: string; body: string; author: string }[]; tasks: { id: string; title: string; due: string; done: boolean }[]; scores: Record<string, { ca: number; exam: number }>; attendance: Record<string, string>; activity: string[] };
export const teachers = ["Mrs. Adebayo", "Mr. Okafor", "Mrs. Balogun", "Mr. Adeyemi", "Mrs. Williams"];
export const subjects = ["Biology", "Basic Science", "Mathematics", "English Language", "Chemistry", "Physics", "Civic Education", "Agricultural Science"];
export const classes = ["JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "SS 1A", "SS 1B", "SS 2A", "SS 3A"];
export const students = ["Akinwale, Tobiloba", "Balogun, Damilola", "Eze, Chiamaka", "Ibrahim, Yusuf", "Ogunleye, Temiloluwa", "Okonkwo, Chidera", "Oladipo, Fikayo", "Salami, Aisha"];
export const initialPortalData: PortalData = {
  assignments: [
    { id: "a1", subject: "Biology", className: "SS 1A", teacher: "Mrs. Adebayo", initials: "BA", color: "sage", students: 32, room: "Science lab 1" },
    { id: "a2", subject: "Biology", className: "SS 2A", teacher: "Mrs. Adebayo", initials: "BA", color: "sage", students: 28, room: "Science lab 1" },
    { id: "a3", subject: "Basic Science", className: "JSS 1A", teacher: "Mrs. Adebayo", initials: "BA", color: "blue", students: 35, room: "Room 04" },
    { id: "a4", subject: "Mathematics", className: "JSS 1A", teacher: "Mr. Okafor", initials: "CO", color: "peach", students: 35, room: "Room 04" },
    { id: "a5", subject: "English Language", className: "JSS 1A", teacher: "Mrs. Balogun", initials: "FB", color: "lavender", students: 35, room: "Room 04" },
    { id: "a6", subject: "Chemistry", className: "SS 1A", teacher: "Mr. Adeyemi", initials: "TA", color: "peach", students: 32, room: "Science lab 2" },
    { id: "a7", subject: "English Language", className: "SS 1A", teacher: "Mrs. Williams", initials: "SW", color: "lavender", students: 32, room: "Room 12" },
  ],
  reviews: [
    { id: "r1", title: "Cell structure & organisation", assignmentId: "a1", status: "Awaiting review", body: "Learning objective: identify plant and animal cell structures and explain their functions. Activities: microscope demonstration, labelled diagrams, and a five-question exit ticket. Resources: prepared slides and Biology textbook, chapter 2.", comments: [{ author: "Mrs. Adebayo", text: "Lesson plan for week 6 is ready. Please review the practical activities before Friday." }] },
    { id: "r2", title: "Living things and their environment", assignmentId: "a3", status: "Changes requested", body: "Learning objective: distinguish living and non-living things through observation. Students will collect examples in the school garden and complete a classification worksheet.", comments: [{ author: "Academic lead", text: "Please include an alternative indoor activity for rainy weather." }] },
    { id: "r3", title: "Transport systems in plants", assignmentId: "a2", status: "Approved", body: "Investigate water transport using coloured water and celery stems. Students record observations and discuss xylem and phloem.", comments: [{ author: "Academic lead", text: "Clear objectives and a well-planned practical. Approved for teaching." }] },
  ],
  meetings: [
    { id: "m1", title: "Science department check-in", date: "2026-10-27", time: "14:30", department: "Science department", agenda: "Review practical lesson resources, align week 6 plans, and discuss students who need additional support.", link: "", attending: true, minutes: "" },
    { id: "m2", title: "JSS 1 teachers’ review", date: "2026-10-28", time: "13:00", department: "JSS 1 teaching team", agenda: "Share observations across subjects and agree on support plans ahead of the mid-term assessment.", link: "", attending: false, minutes: "" },
    { id: "m3", title: "Mid-term assessment planning", date: "2026-10-30", time: "15:00", department: "All teaching staff", agenda: "Confirm assessment dates, moderation responsibilities, and result submission deadlines.", link: "", attending: false, minutes: "" },
  ],
  notices: [{ id: "n1", title: "Mid-term assessments are around the corner", body: "Please submit your assessment questions for moderation by Friday, 30 October. Class teachers should coordinate with subject teachers to avoid timetable clashes.", author: "Academic office" }, { id: "n2", title: "A little collaboration goes a long way", body: "Use your class teaching teams to share observations and support students together. Record agreed actions after every department meeting.", author: "School administration" }],
  tasks: [{ id: "t1", title: "Submit SS 1 Biology assessment questions", due: "Fri, 30 Oct", done: false }, { id: "t2", title: "Update JSS 1A lesson plan", due: "Wed, 28 Oct", done: false }, { id: "t3", title: "Complete SS 2A attendance register", due: "Today", done: true }], scores: {}, attendance: {}, activity: ["Academic lead approved Transport systems in plants.", "Mrs. Adebayo submitted Cell structure & organisation for review."]
};
