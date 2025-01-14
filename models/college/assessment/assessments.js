const mongoose = require("mongoose");
const { Schema } = mongoose;

const assessmentsSchema = new Schema(
  {
    visible: { type: Boolean, default: true },
    isReportGenerated: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Total time in minutes = All sections time //duration
    totalTime: {
      type: Number,
      default: 0,
      // required: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
      // required: true,
    },

    totalMarks: {
      type: Number,
      default: 0,
      // required: true,
    },

    duration_from: {
      // type: Date,
      type: String,
      // required: true,
    },
    duration_to: {
      // type: Date,
      type: String,
      // required: true,
    },

    isNegativeMarking: {
      type: Boolean,
      default: false,
      // required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
      // required: true,
    },
    endDate: {
      type: Date,
      // required: true,
    },
    totalQuestionsCount: {
      type: Number,
      default: 0,
      // required: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      // required: true,
    },
    totalSectionsCount: {
      type: Number,
      default: 0,
      max: 5,
    },
    level: {
      type: String,
      default: "beginner",
      // enum: ["beginner", "intermediate", "advanced" ,"adaptive"],
      // required: true,
    },
    type: {
      type: String,
      default: "mcq",
      // required: true,
    },
    status: {
      type: String,
      default: "active",
      // required: true,
    },
    // if this is an college assessment
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
    },
    // if this is an company assessment
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    createdByCompany: {
      type: Boolean,
      default: false,
    },
    createdByUniversity: {
      type: Boolean,
      default: false,
    },
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    topics: [],

    // -------------
    studentResponses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentResponse",
      },
    ],

    invitedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Students",
      },
    ],
    avgPercentage: {
      type: Number,
      default: 0,
    },

    // -------------------------------- RESULTS --------------------------
    avgSelectedPercentage: {
      type: Number,
      default: 0,
    },
    avgRejectedPercentage: {
      type: Number,
      default: 0,
    },
    selectedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentResponse",
      },
    ],

    rejectedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentResponse",
      },
    ],

    apprearedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentResponse",
      },
    ],

    // -----------------------------------------------------------------------
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    categoryName: {
      type: String,
      default: "",
    },

    hasAccessToAllBranches: {
      type: Boolean,
      default: false,
    },
    hasAccessToAllDepartments: {
      type: Boolean,
      default: false,
    },

    // accessibleBranches: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Branch",
    //   },
    // ],
    accessibleDepartments: [
      // {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "Department",
      // },
    ],

    // -----------------------------------------------------------------------
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      // ref : 'Company',
      // required: true,
    },

    config: {
      instructions:
        [
          {
            title: String,
            description: String
          }
        ]
      ,
      totalTime: Number,
      isCameraRequired: {
        type: Boolean,
        default: true,
      },
      maxTabSwitches: {
        type: Number,
        default: 3
      },
      maxAudioLimitExceedCount: {
        type: Number,
        default: 3
      }
    }
    //---------------------------------------
  },
  { timestamps: true }
);

const Assessments = mongoose.model("Assessments", assessmentsSchema);

assessmentsSchema.index({ company: 1 });
assessmentsSchema.index({ createdByCompany: 1 });
assessmentsSchema.index({ college: 1 });

module.exports = Assessments;
