const collegeRoutes = require("../routes/college/collegeRoutes.js");
const assessmentsRoutes = require("../routes/college/assessmentsRoutes.js");
const studentRoutes = require("../routes/student/studentRoutes.js");
const companyRoutes = require("../routes/company/companyRoutes.js");
const adminTestRoutes = require("../routes/admin/adminTestRoutes.js");
const studentDummyRoutes = require("../routes/student/studentDummyRoutes.js");
const collegeTeamRoutes = require("../routes/college/teamRoutes.js");
const qbRoutes = require("../routes/college/qbRoutes.js");
const paymentRoutes = require("../routes/college/paymentRoutes.js");
const collegeStudentRoutes = require("../routes/college/studentRoutes.js");
const universityRoutes = require("../routes/university/universityRoutes.js");
const studentTestRoutes = require("../routes/student/studentTestRoutes.js");
const studentInboxRoutes = require("../routes/student/studentInboxRoutes.js");
const studentGraphRoutes = require("../routes/student/studentGraphRoutes.js");
const companyTestRoutes = require("../routes/company/companyTestRoutes.js");
const authRoutes = require("../routes/auth/index.js");
const { isAuthenticatedCompany } = require("../middlewares/companyAuth.js");

module.exports = (app) => {
  app.use("/api/university", universityRoutes);
  app.use("/api/college", collegeRoutes);
  app.use("/api/college/teams", collegeTeamRoutes);
  app.use("/api/college/student", collegeStudentRoutes);
  app.use("/api/assessments", assessmentsRoutes);
  app.use("/api/student", studentRoutes);
  app.use("/api/studentDummy", studentDummyRoutes);
  app.use(
    "/api/company/studentDummy",
    isAuthenticatedCompany,
    studentDummyRoutes
  );
  app.use("/api/student/test", studentTestRoutes);
  app.use("/api/student/inbox", studentInboxRoutes);
  app.use("/api/student/graph", studentGraphRoutes);
  app.use("/api/company", companyRoutes);
  app.use("/api/company/test", companyTestRoutes);
  app.use(
    "/api/company/campus-drive",
    require("../routes/company/campusDriveRoutes.js")
  );
  ``;
  app.use("/api/admin", adminTestRoutes);
  app.use("/api/admin/category", require("../routes/admin/categoryRoutes.js"));
  app.use("/api/admin/approval", require("../routes/admin/approvalRoutes.js"));
  app.use("/api/qb", qbRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/compiler", require("../routes/compiler/compilerRoutes"));
  app.use("/api/auth", authRoutes);

  app.get("/", (req, res) => {
    res.send("API is running");
  });

  app.get("/test", (req, res) => {
    res.send("Dockerize container running");
  });
};
