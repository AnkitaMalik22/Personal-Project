const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const Inbox = require("../../../models/college/inbox/Inbox");
const Mail = require("../../../models/college/inbox/Mail");
const { Student } = require("../../../models/student/studentModel");
const ErrorHandler = require("../../../utils/errorhandler");
const { v2: cloudinary } = require("cloudinary");

const mongoose = require("mongoose");
const BookmarkedMail = require("../../../models/college/inbox/BookmarkedMails");

// Forgot Password

exports.uploadAttachment = async (req, res) => {
  try {
    console.log(Object.values(req.files));
    const uploadPromises = [];
    let pics = [];
    // Iterate over uploaded files

    for (let i = 0; i < Object.values(req.files).length; i++) {
      let file = Object.values(req.files)[i];
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "Inbox",
        filename_override: file.name,
        resource_type: "auto",
      });
      uploadPromises.push(result);
    }

    const uploadedFiles = await Promise.all(uploadPromises);

    uploadedFiles.forEach((file) => {
      pics.push({
        url: file.url,
        name: file.original_filename,
        format: file.format,
        size: file.bytes,
      });
    });
    console.log(uploadedFiles[0]);
    res.status(200).json(pics);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

exports.sendEMail = catchAsyncErrors(async (req, res, next) => {
  let attachments = req.body.attachments || [];

  const role = req.params.role;
  console.log(req.user);

  if (role === "college") {
    user = await College.findOne({ Email: req.body.Email });
  } else {
    user = await Student.findOne({ Email: req.body.Email });
  }

  const college = await College.findOne({ Email: req.body.Email });
  const student = await Student.findOne({ Email: req.body.Email });

  if (college) {
    emailTo = "College";
  } else if (student) {
    emailTo = "Student";
  } else {
    return next(new ErrorHandler("not found", 404));
  }
  let from;
  if (req.user.role === "college") {
    from = "College";
  } else {
    from = "Student";
  }
  try {
    const mail = await Mail.create({
      Mailtype: emailTo,
      MailtypeFrom: from,
      attachments: attachments,
      Date: new Date(),
      from: req.user.id,
      to: user._id,
      message: req.body.Message,
      subject: req.body.Subject,
      replies: [],
    });

    const sender = await Inbox.findOneAndUpdate(
      { user: req.user.id }, // Find the document with the specified user ID
      {
        $push: {
          emailsSent: { mail: mail._id },
        },
      },
      { new: true, upsert: true } // Return the modified document after update
    );
    sender.emailsSent.reverse();
    const receiver = await Inbox.findOneAndUpdate(
      { user: user._id }, // Find the document with the specified user ID
      {
        $push: {
          emailsReceived: { mail: mail._id },
        },
      },
      { new: true, upsert: true } // Return the modified document after update
    );

    res.status(200).send({ sender, receiver });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.sendReply = catchAsyncErrors(async (req, res) => {
  let attachments = req.body.attachments || [];

  try {
    const reply = {
      attachments: attachments,
      Date: new Date(),
      message: req.body.Message,
    };
    // add mail to emails sent for the sender
    const mail = await Mail.findOneAndUpdate(
      { _id: req.body.id }, // Filter to match the email by its _id
      { $push: { replies: reply } }, // Use $push to add newReply to replies array
      { new: true, upsert: true } // Return the updated document
    );
    res.status(200).json(mail);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.getEmail = catchAsyncErrors(async (req, res, next) => {
  try {
    const { skip = 0, limit = 10 } = req.query;
    let mail = await Inbox.findOne({ user: req.user.id })
      .populate({
        path: "emailsReceived.mail",
        populate: {
          path: "from",
          select: "FirstName LastName Email CollegeName avatar",
        },
      })
      .populate({
        path: "emailsSent.mail",
        populate: {
          path: "from",
          select: "FirstName LastName Email CollegeName avatar",
        },
      })
      .populate({
        path: "emailsSent.mail",
        populate: {
          path: "to",
          select: "FirstName LastName Email CollegeName avatar",
        },
      })
      .populate({
        path: "emailsReceived.mail",
        populate: {
          path: "to",
          select: "FirstName LastName Email CollegeName avatar",
        },
      });

    const total = mail.emailsReceived.length;
    mail.emailsReceived = mail.emailsReceived.slice(skip, limit);
    mail.emailsSent = mail.emailsSent.slice(skip, limit);

    res.status(200).send({ success: true, mail, total });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.searchMail = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.query;
    const uploadPromises = [];
    let from,
      to = null;
    let within = 1;
    from = await College.find({ Email: req.body.from });
    // to = await College.find({ Email: req.body.to });

    // if (!from) {
    //   from = await Student.find({ Email: req.body.from});
    // } else if (!from) {
    //   from = await Company.find({ Email: req.body.from });
    // }
    // if (!to) {
    //   to = await Student.find({ Email: "Siddchtriggg@gmail.com" });
    // }
    const startDate = new Date(); // Current date
    startDate.setDate(startDate.getDate() - req.body.within || 0); // Subtract 1 day

    const endDate = new Date(); // Current date

    let dateToMatch = new Date();

    if (req.body.date) {
      dateToMatch = new Date(req.body.date);
    }
    if (req.body.within) {
      within = req.body.within;
    }
    // Convert the date from the request body to a Date object

    const nextDay = new Date(dateToMatch); // Create a new Date object for the day after dateToMatch
    nextDay.setDate(nextDay.getDate() + within);
    let mails;
    let query = {};

    if (req.body.within && !req.body.date) {
      query = {
        isDeletedReceiver: { $nin: { user: req.user.id } },
        // Always include the Date field in the query
        Date: { $gte: startDate, $lt: endDate },
      };
    } else if (!req.body.within && !req.body.date) {
      query = { isDeletedReceiver: { $nin: { user: req.user.id } } };
    } else {
      query = {
        isDeletedReceiver: { $nin: { user: req.user.id } },
        Date: { $gte: dateToMatch, $lt: nextDay }, // Match documents between dateToMatch (inclusive) and nextDay (exclusive)
      };
    }

    // Conditionally include the 'to' field
    // if (to._id) {
    query.to = req.user.id;
    // }
    const objectId = new mongoose.Types.ObjectId(req.user.id);
    // query.isDeletedReceiver = { $nin: { user: req.user.id } };

    // Conditionally include the 'message' field
    if (req.body.keyword) {
      query.message = { $regex: new RegExp(`.*${req.body.keyword}.*`) };
    }

    // Conditionally include the 'from' field
    if (from._id) {
      query.from = from._id;
    }

    console.log(query);

    mails = await Mail.find({
      $and: [
        {
          isDeletedReceiver: {
            $not: {
              $elemMatch: {
                user: req.user.id,
              },
            },
          },
        },
        query, // Your existing query conditions
      ],
    })
      .skip(skip)
      .limit(limit)
      .populate("from")
      .populate("to");

    res.status(200).send(mails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

exports.deleteMail = async (req, res) => {
  try {
    let inbox = await Inbox.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { emailsReceived: { mail: req.params.id } } },
      { new: true } // To return the updated document after the update
    );

    let mail = await Mail.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { isDeletedReceiver: { user: req.user.id } } },
      { new: true } // To return the updated document after the update
    );
    if (!mail || !inbox) {
    }
    res.status(200).json({ success: true, mail, inbox });
  } catch (error) {
    console.log(error);
  }
};

// ------------------------------------------------------------------------------------------------------------------

exports.addMailBookmark = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const mail = await Mail.findById(req.params.id);
  console.log(mail, req.params.id);

  if (!mail) {
    return next(new ErrorHandler("Mail not found", 404));
  }

  const isMailBookmarked = await BookmarkedMail.findOne({
    mail: req.params.id,
    userId,
  });

  if (isMailBookmarked) {
    return next(new ErrorHandler("Mail already bookmarked", 400));
  }

  await BookmarkedMail.create({
    mail: req.params.id,
    userId,
  });

  mail.bookmarked = true;
  await mail.save();

  res.status(200).json({
    success: true,
    message: "Mail bookmarked successfully",
  });
});

exports.getBookmarkedMails = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const bookmarks = await BookmarkedMail.find({ userId }).populate({
    path: "mail",
    populate: {
      path: "from",
      select: "FirstName LastName Email CollegeName",
    },
  });

  res.status(200).json({
    success: true,
    bookmarks,
  });
});

exports.deleteBookmarkedMail = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const bookmarkedMail = await BookmarkedMail.findOne({ mail: id });

  if (!bookmarkedMail) {
    return next(new ErrorHandler("Bookmarked Mail not found", 404));
  }

  await BookmarkedMail.deleteOne({
    mail: id,
  });
  const mailId = bookmarkedMail.mail;

  const mail = await Mail.findById(mailId);
  if (!mail) {
    return next(new ErrorHandler("Mail not found", 404));
  }

  mail.bookmarked = false;
  await mail.save();

  res.status(200).json({
    success: true,
    message: "Bookmarked Mail deleted successfully",
  });
});

exports.deleteCollegeMail = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const mail = await Mail.findById(id);

  if (!mail) {
    return next(new ErrorHandler("Mail not found", 404));
  }

  if (
    userId.toString() !== mail.from.toString() &&
    userId.toString() !== mail.to.toString()
  ) {
    return next(
      new ErrorHandler("You are not authorized to delete this mail", 401)
    );
  }

  await mail.remove();

  res.status(200).json({
    success: true,
    message: "Mail deleted successfully",
  });
});
